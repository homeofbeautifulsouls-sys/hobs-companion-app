// error-alert-monitor
//
// Closes the real gap found in the production reliability audit: error_logs already captures
// real client-side JS errors and unhandled promise rejections with good detail, but nothing
// ever surfaced them proactively -- someone had to remember to open the admin error screen.
// This runs on a schedule (pg_cron) and pushes a real notification to admins when something
// genuinely new or unusual shows up, using the existing send-push-notification infrastructure.
//
// Deliberately NOT alerting on every single error -- that would just train everyone to ignore
// the notifications. Two distinct triggers instead:
//   1. A genuinely new error message never seen before (first occurrence ever) -- these are the
//      ones most likely to represent an actual new bug, exactly like the currentUser.id crash
//      found by hand this session, which had been happening silently for a long time.
//   2. A volume spike -- more than SPIKE_THRESHOLD errors in the last CHECK_INTERVAL_MINUTES,
//      which suggests something is actively, currently breaking for multiple people right now.
//
// Auth: shared secret, same pattern as every other scheduled function in this project.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET");

const CHECK_INTERVAL_MINUTES = 60;
const SPIKE_THRESHOLD = 15; // more than this many errors in one check window triggers an alert
const CONFIG_KEY = "error_alert_last_checked_at";

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function dbWrite(path: string, method: string, body: unknown, prefer = "return=minimal") {
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

    const configRows = await dbFetch(`app_config?key=eq.${CONFIG_KEY}&select=value`);
    const lastChecked = Array.isArray(configRows) && configRows[0]
      ? configRows[0].value
      : new Date(Date.now() - CHECK_INTERVAL_MINUTES * 60000).toISOString();

    const recentErrors = await dbFetch(
      `error_logs?created_at=gt.${encodeURIComponent(lastChecked)}&select=message,created_at&order=created_at.asc`
    );
    const errors = Array.isArray(recentErrors) ? recentErrors : [];

    const alerts: string[] = [];

    if (errors.length > SPIKE_THRESHOLD) {
      alerts.push(`${errors.length} errors in the last check window (usually under ${SPIKE_THRESHOLD}) -- something may be actively breaking right now.`);
    }

    if (errors.length > 0) {
      const newMessages = [...new Set(errors.map((e: any) => e.message))];
      for (const msg of newMessages) {
        const priorOccurrence = await dbFetch(
          `error_logs?message=eq.${encodeURIComponent(msg as string)}&created_at=lt.${encodeURIComponent(lastChecked)}&select=id&limit=1`
        );
        const isGenuinelyNew = !Array.isArray(priorOccurrence) || priorOccurrence.length === 0;
        if (isGenuinelyNew) {
          alerts.push(`New error type, never seen before: "${(msg as string).slice(0, 150)}"`);
        }
      }
    }

    if (alerts.length === 0) {
      // Nothing to alert on -- safe to advance immediately, there's nothing that could be lost.
      await dbWrite("app_config", "POST", { key: CONFIG_KEY, value: new Date().toISOString(), updated_at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal");
      return new Response(JSON.stringify({ checked: errors.length, alerted: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = alerts.slice(0, 3).join(" ") + (alerts.length > 3 ? ` (+${alerts.length - 3} more)` : "");
    const admins = await dbFetch(`profiles?is_admin=eq.true&select=user_id`);
    const adminIds = (Array.isArray(admins) ? admins : []).map((a: any) => a.user_id);
    if (adminIds.length === 0) {
      console.error("error-alert-monitor: no admin users found to notify");
      // Deliberately NOT advancing the timestamp -- no admins to tell yet doesn't mean these
      // errors have been handled; leave them for the next run to retry.
      return new Response(JSON.stringify({ checked: errors.length, alerted: false, reason: "no admins found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const pushRes = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        serverCallerId: null,
        userIds: adminIds,
        title: "HOBS Companion: error activity detected",
        body,
        notificationType: "error_alert",
        data: { type: "error_alert" },
      }),
    });
    const pushResult = await pushRes.json().catch(() => ({}));
    if (!pushRes.ok) {
      console.error("error-alert-monitor: send-push-notification failed", pushRes.status, JSON.stringify(pushResult));
      // Deliberately NOT advancing the timestamp here -- the alert was never actually
      // delivered, so the next run needs to see these same errors again and retry, not skip
      // past them as if they'd been handled.
      return new Response(JSON.stringify({ checked: errors.length, alerted: false, pushError: pushResult, pushStatus: pushRes.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Only advance the timestamp once the alert has genuinely, successfully been delivered.
    await dbWrite("app_config", "POST", { key: CONFIG_KEY, value: new Date().toISOString(), updated_at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal");

    return new Response(JSON.stringify({ checked: errors.length, alerted: true, alerts }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("error-alert-monitor error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
