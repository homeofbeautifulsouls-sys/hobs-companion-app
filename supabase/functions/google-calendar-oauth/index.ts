// Handles the Google Calendar OAuth flow for professionals connecting their own calendar --
// two actions: exchange an authorization code for tokens (initial connect), and refresh an
// access token using a stored refresh token (silent renewal within the 7-day testing-mode
// window). Client secret never leaves this server-side function, matching the same pattern
// already used for transcribe-audio (auth checked directly, no SDK import that broke boot
// there previously).

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const REDIRECT_URI = "https://homeofbeautifulsouls-sys.github.io/hobs-companion-app/";

async function getAuthedUser(authHeader: string | null) {
  if (!authHeader) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY ?? "" },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function dbWrite(path: string, method: string, body: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Calendar connection is not configured yet." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const user = await getAuthedUser(authHeader);
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action;

    if (action === "exchange_code") {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: body.code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Google token exchange error:", tokenData);
        return new Response(JSON.stringify({ error: "Could not connect — please try again." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up the connected Google account's email for display purposes.
      let googleEmail = null;
      try {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (profileRes.ok) googleEmail = (await profileRes.json()).email;
      } catch (_e) { /* non-critical, proceed without it */ }

      const now = Date.now();
      // Testing-mode refresh tokens are valid for 7 days -- tracked explicitly so a clean
      // reconnect prompt can be shown right when it actually expires, not guessed at.
      await dbWrite("professional_calendar_connections", "POST", {
        user_id: user.id,
        google_email: googleEmail,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        access_token_expires_at: new Date(now + tokenData.expires_in * 1000).toISOString(),
        refresh_token_expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        connected_at: new Date(now).toISOString(),
        last_refreshed_at: new Date(now).toISOString(),
        needs_reconnect: false,
      });

      return new Response(JSON.stringify({ success: true, google_email: googleEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh_token") {
      const connRes = await fetch(
        `${SUPABASE_URL}/rest/v1/professional_calendar_connections?user_id=eq.${user.id}&select=refresh_token,refresh_token_expires_at`,
        { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const rows = await connRes.json();
      const conn = rows[0];
      if (!conn || !conn.refresh_token) {
        return new Response(JSON.stringify({ error: "No connection found", needs_reconnect: true }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: conn.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        // Refresh token itself has expired (the 7-day testing-mode cap) or was revoked --
        // flag for reconnect rather than failing silently, so the UI can prompt clearly.
        await dbWrite(`professional_calendar_connections?user_id=eq.${user.id}`, "PATCH", { needs_reconnect: true });
        return new Response(JSON.stringify({ error: "Reconnection needed", needs_reconnect: true }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = Date.now();
      await dbWrite(`professional_calendar_connections?user_id=eq.${user.id}`, "PATCH", {
        access_token: tokenData.access_token,
        access_token_expires_at: new Date(now + tokenData.expires_in * 1000).toISOString(),
        last_refreshed_at: new Date(now).toISOString(),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-calendar-oauth error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
