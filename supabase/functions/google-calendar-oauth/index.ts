// Handles the Google Calendar OAuth flow for professionals connecting their own calendar.
//
// The initial connect step has a real architectural constraint: on native Android, opening the
// OAuth URL can hand the flow to a browser context that's completely disconnected from the
// app's own logged-in session (confirmed directly -- this is exactly what caused "clicked
// continue but never came back to the app"). So exchange_code supports two ways to identify
// who's connecting: a normal Bearer-token session (used from a plain browser, where the
// session survives fine), or a short-lived, single-use state_token generated *before* the
// redirect while the app definitely has a valid session, passed through Google's own state
// parameter and read back on return -- this lets the landing page complete the connection
// even in a context with no active session of its own, without ever trusting a raw user id
// from the client.

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

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  return res.json();
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

// Resolves which user this request is acting for, trying a real session first and falling
// back to a valid, unexpired, unused state token -- never trusts a user id supplied directly.
async function resolveActingUserId(authHeader: string | null, stateToken: string | undefined) {
  const sessionUser = await getAuthedUser(authHeader);
  if (sessionUser) return sessionUser.id;

  if (!stateToken) return null;
  const rows = await dbFetch(`gcal_connect_state_tokens?token=eq.${stateToken}&select=user_id,expires_at,used`);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || row.used || new Date(row.expires_at).getTime() < Date.now()) return null;
  await dbWrite(`gcal_connect_state_tokens?token=eq.${stateToken}`, "PATCH", { used: true });
  return row.user_id;
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
    const body = await req.json();
    const action = body.action;

    if (action === "create_state_token") {
      // Called from the app while it definitely has a valid session, right before opening the
      // OAuth URL -- generates the short-lived ticket that lets the landing page identify who's
      // connecting even without a session of its own.
      const user = await getAuthedUser(authHeader);
      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const insertRes = await dbWrite("gcal_connect_state_tokens", "POST", { user_id: user.id });
      const rows = await insertRes.json();
      const token = Array.isArray(rows) ? rows[0]?.token : null;
      return new Response(JSON.stringify({ token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      const userId = await resolveActingUserId(authHeader, body.state_token);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      let googleEmail = null;
      try {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (profileRes.ok) googleEmail = (await profileRes.json()).email;
      } catch (_e) { /* non-critical, proceed without it */ }

      const now = Date.now();
      await dbWrite("professional_calendar_connections", "POST", {
        user_id: userId,
        google_email: googleEmail,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        access_token_expires_at: new Date(now + tokenData.expires_in * 1000).toISOString(),
        refresh_token_expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        connected_at: new Date(now).toISOString(),
        last_refreshed_at: new Date(now).toISOString(),
        needs_reconnect: false,
      });

      // Starts instant sync right away -- registered server-side here rather than as a
      // separate frontend call, since this landing page might have no active session at all
      // (the whole reason the state-token approach exists), so it can't be relied on to make
      // a second authenticated round-trip afterward.
      fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register_watch", user_id: userId }),
      }).catch((e) => console.error("Could not register calendar watch:", e));

      return new Response(JSON.stringify({ success: true, google_email: googleEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh_token") {
      const user = await getAuthedUser(authHeader);
      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const rows = await dbFetch(`professional_calendar_connections?user_id=eq.${user.id}&select=refresh_token,refresh_token_expires_at`);
      const conn = Array.isArray(rows) ? rows[0] : null;
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
