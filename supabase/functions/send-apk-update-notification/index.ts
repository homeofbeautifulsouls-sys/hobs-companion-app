// Sends (and re-sends, daily, via cron) a push notification to anyone on the native Android app
// whose reported version is behind the latest release, pointing them at the APK download --
// reusing the app's own existing 'app_update' notification-tap handler (already built in the
// app itself, confirmed by reading the client code -- this function is the missing send side).
// "Until installed" is tracked the honest way: each person's own app_version_code, which the
// app already syncs to their profile automatically the moment they actually open a newer build.
// Once that catches up to the latest release, they stop matching the query below and the daily
// reminder naturally stops -- not a guess, not a manual dismiss, the real signal.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET");

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function dbWrite(path: string, method: string, body: unknown, prefer = "return=representation") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const schedulerSecret = req.headers.get("x-scheduler-secret");
    if (schedulerSecret !== SCHEDULER_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const releases = await dbFetch(`app_releases?order=version_code.desc&limit=1`);
    const latest = Array.isArray(releases) ? releases[0] : null;
    if (!latest) {
      return new Response(JSON.stringify({ sent: 0, message: "No releases on record" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const apkUrl = `${SUPABASE_URL}/storage/v1/object/public/app-releases/${latest.apk_storage_path}`;
    // Behind the latest release, has actually used the native app before (a real app_version_code
    // on record -- never guess at web-only users, who have no APK to update at all), and hasn't
    // explicitly muted notifications.
    const behindUsers = await dbFetch(
      `profiles?app_version_code=not.is.null&app_version_code=lt.${latest.version_code}&push_token=not.is.null&notifications_enabled=neq.false&select=user_id,push_token,app_version_code`
    );
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const results = [];
    for (const u of (Array.isArray(behindUsers) ? behindUsers : [])) {
      const existingReminder = await dbFetch(`app_update_reminders?user_id=eq.${u.user_id}&select=release_id,last_reminded_at`);
      const existing = Array.isArray(existingReminder) ? existingReminder[0] : null;
      // Already reminded about THIS specific release today -- skip, avoid spamming multiple
      // sends if this ever gets triggered more than once in a day.
      if (existing && existing.release_id === latest.id && new Date(existing.last_reminded_at) >= todayStart) {
        results.push({ user_id: u.user_id, skipped: "already reminded today" });
        continue;
      }
      await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          serverCallerId: null,
          userId: u.user_id,
          title: "New HOBS Companion update available",
          body: `Version ${latest.version_name} is ready — tap to download and install.`,
          data: { type: "app_update", url: apkUrl },
          notificationType: "app_update",
        }),
      });
      await dbWrite("app_update_reminders", "POST", { user_id: u.user_id, release_id: latest.id, last_reminded_at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal");
      results.push({ user_id: u.user_id, notified: true, from_version: u.app_version_code, to_version: latest.version_code });
    }
    return new Response(JSON.stringify({ latest_version: latest.version_code, checked: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-apk-update-notification error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
