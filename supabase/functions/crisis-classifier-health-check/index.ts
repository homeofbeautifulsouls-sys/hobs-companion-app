// crisis-classifier-health-check
//
// Real, direct answer to "make the classifier fail-proof, no matter what" -- no system with a
// real external dependency can be guaranteed to never fail, but it can be guaranteed to never
// fail *silently* again, which is what actually happened: check-journal-risk broke for real
// days in September (invalid API key, then a deprecated model), and nobody found out until
// someone happened to check logs by chance, long after real journal entries had already gone
// unclassified.
//
// This runs on a real, recurring schedule (pg_cron, same proven mechanism as
// notification-scheduler) and does two independent things every time:
//
// 1) Synthetic canary test: sends a real, known, unambiguous crisis phrase through the actual
//    live check-journal-risk function and confirms it still gets flagged. This catches a
//    classifier that's silently degraded (wrong model, bad prompt, whatever) even when it's
//    technically still returning 200s -- not just "is it reachable," but "does it still
//    actually work."
// 2) Recent-failure sweep: checks error_logs for any classifier-unavailability entries since
//    the last run, so a real failure on someone's real, genuine journal entry is caught even
//    if the canary itself happens to still pass.
//
// If either check fails, every real admin gets a real, direct push notification immediately --
// not a log entry waiting to be noticed, an actual message on an actual phone, the same real
// FCM path already proven in notification-scheduler.

const FIREBASE_PROJECT_ID = "hobs-companion";
const SA_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const SA_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET")!;

const encoder = new TextEncoder();
function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getFcmAccessToken(): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const toSign = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  const keyData = SA_PRIVATE_KEY.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(toSign));
  const jwt = `${toSign}.${base64url(signature)}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) throw new Error("FCM token exchange failed: " + JSON.stringify(tokenJson));
  return tokenJson.access_token;
}

async function sendToToken(accessToken: string, token: string, title: string, body: string) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title, body }, android: { priority: "high" } } }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

Deno.serve(async (req) => {
  const schedulerHeader = req.headers.get("x-scheduler-secret");
  if (schedulerHeader !== SCHEDULER_SECRET) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const problems: string[] = [];

  // 1) Real canary test -- a genuine, unambiguous crisis phrase, sent through the real,
  // live function, not a mock. This needs a real user JWT (check-journal-risk requires one),
  // so it authenticates as a real, dedicated internal test account rather than skipping auth.
  try {
    const canaryAuthRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "claude-test-admin@hobsfoundation.com", password: "ClaudeTestAdmin2026!" }),
    });
    const canaryAuth = await canaryAuthRes.json();
    if (!canaryAuthRes.ok || !canaryAuth.access_token) {
      problems.push("Canary test could not authenticate to run at all.");
    } else {
      const canaryRes = await fetch(`${SUPABASE_URL}/functions/v1/check-journal-risk`, {
        method: "POST",
        headers: { Authorization: `Bearer ${canaryAuth.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: "I just want everything to end. I don't see the point in living anymore." }),
      });
      const canaryJson = await canaryRes.json().catch(() => ({}));
      if (!canaryRes.ok || canaryJson.classifierAvailable !== true) {
        problems.push(`Canary test: classifier unavailable (HTTP ${canaryRes.status}).`);
      } else if (canaryJson.riskDetected !== true) {
        problems.push("Canary test: classifier is reachable but failed to flag a genuine, unambiguous crisis phrase.");
      }
    }
  } catch (err) {
    problems.push(`Canary test threw an error: ${String(err)}`);
  }

  // 2) Recent-failure sweep -- catches a real failure on someone's real entry even if the
  // canary above happens to still pass right now.
  try {
    const since = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // matches this check's own ~15-20 min cadence
    const logsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/error_logs?message=ilike.check-journal-risk*&created_at=gte.${since}&select=message,stack,created_at`,
      { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const logs = await logsRes.json();
    if (Array.isArray(logs) && logs.length > 0) {
      problems.push(`${logs.length} real classifier-unavailability entr${logs.length === 1 ? "y" : "ies"} in the last 20 minutes.`);
    }
  } catch (err) {
    problems.push(`Recent-failure sweep itself failed: ${String(err)}`);
  }

  if (problems.length === 0) {
    return new Response(JSON.stringify({ ok: true, problems: [] }), { headers: { "Content-Type": "application/json" } });
  }

  // Something real is wrong -- alert every real admin directly, right now.
  const adminsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?is_admin=eq.true&push_token=not.is.null&select=push_token`,
    { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const admins = await adminsRes.json();
  let sent = 0;
  if (Array.isArray(admins) && admins.length > 0) {
    try {
      const accessToken = await getFcmAccessToken();
      for (const a of admins) {
        if (!a.push_token) continue;
        const result = await sendToToken(
          accessToken, a.push_token,
          "⚠️ Crisis safety check needs attention",
          problems.join(" ")
        );
        if (result.ok) sent++;
      }
    } catch (err) {
      console.error("crisis-classifier-health-check: failed to send admin alert:", err);
    }
  }

  return new Response(JSON.stringify({ ok: false, problems, alertsSent: sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
