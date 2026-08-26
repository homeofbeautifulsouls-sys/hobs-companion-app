// uptime-monitor
//
// Self-hosted cross-check: a Supabase-scheduled function that watches Hostinger's actual
// reachability from outside -- exactly the class of failure that turned tonight's GitHub Pages
// incident into a multi-hour problem, since nothing was watching from outside the thing that
// was actually down.
//
// Honest, known limitation, by design of this approach (chosen deliberately over an external
// service): if Supabase itself is down, this checker is down with it, and nothing runs. This
// doesn't cover a Supabase-side outage -- only Hostinger/the web app's reachability. Covering
// that fully would need a genuinely external, third-party watcher instead.
//
// Checks both production (app.) and staging (staging-app.) -- staging isn't urgent to users,
// but knowing it's broken before trying to use it for testing is still useful.
//
// Alerts only on a STATE CHANGE (was up, now down / was down, now back up) -- not on every
// single check while something is already known to be down, which would just be repeated noise
// for the same, already-acknowledged problem.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET");

const TARGETS = [
  { name: "Production (app.homeofbeautifulsouls.com)", url: "https://app.homeofbeautifulsouls.com/index.html", configKey: "uptime_status_production" },
  { name: "Staging (staging-app.homeofbeautifulsouls.com)", url: "https://staging-app.homeofbeautifulsouls.com/index.html", configKey: "uptime_status_staging" },
];

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

async function checkTarget(url: string): Promise<{ up: boolean; detail: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeoutId);
    // A real HTML response containing the app's own build marker is required -- not just any
    // 200, since a host can return 200 with an error page (confirmed as a real failure mode
    // this same session: GitHub's own "Unicorn" 500 page, and Hostinger's generic error pages,
    // can both arrive with a non-200 status OR sometimes wrapped oddly -- checking real content
    // is more honest than trusting the status code alone).
    if (!res.ok) return { up: false, detail: `HTTP ${res.status}` };
    const body = await res.text();
    if (!body.includes("CURRENT_BUILD")) return { up: false, detail: "200 OK but response doesn't look like the real app" };
    return { up: true, detail: "OK" };
  } catch (err) {
    clearTimeout(timeoutId);
    return { up: false, detail: `Unreachable: ${String(err)}` };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const schedulerSecret = req.headers.get("x-scheduler-secret");
    if (schedulerSecret !== SCHEDULER_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];
    const stateChanges = [];
    const pendingStatusWrites: { configKey: string; newStatus: string }[] = [];

    for (const target of TARGETS) {
      const result = await checkTarget(target.url);
      const priorRows = await dbFetch(`app_config?key=eq.${target.configKey}&select=value`);
      const priorStatus = Array.isArray(priorRows) && priorRows[0] ? priorRows[0].value : "unknown";
      const newStatus = result.up ? "up" : "down";

      if (priorStatus !== newStatus && priorStatus !== "unknown") {
        if (newStatus === "down") {
          stateChanges.push(`🔴 ${target.name} just went DOWN: ${result.detail}`);
        } else {
          stateChanges.push(`🟢 ${target.name} is back UP.`);
        }
      }

      pendingStatusWrites.push({ configKey: target.configKey, newStatus });
      results.push({ target: target.name, ...result });
    }

    async function commitPendingStatusWrites(){
      for (const w of pendingStatusWrites) {
        await dbWrite("app_config", "POST", { key: w.configKey, value: w.newStatus, updated_at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal");
      }
    }

    if (stateChanges.length === 0) {
      // No transition to tell anyone about -- safe to commit immediately, nothing could be lost.
      await commitPendingStatusWrites();
      return new Response(JSON.stringify({ results, stateChanges }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admins = await dbFetch(`profiles?is_admin=eq.true&select=user_id`);
    const adminIds = (Array.isArray(admins) ? admins : []).map((a: any) => a.user_id);
    if (adminIds.length > 0) {
      const pushRes = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          serverCallerId: null,
          userIds: adminIds,
          title: "HOBS Companion: uptime status change",
          body: stateChanges.join(" "),
          notificationType: "uptime_alert",
          data: { type: "uptime_alert" },
        }),
      });
      const pushResult = await pushRes.json().catch(() => ({}));
      if (!pushRes.ok) {
        console.error("uptime-monitor: send-push-notification failed", pushRes.status, JSON.stringify(pushResult));
        // Deliberately NOT committing the status writes -- the alert was never actually
        // delivered, so the next run needs to see the same prior status and detect this same
        // transition again, rather than silently treating it as already handled.
        return new Response(JSON.stringify({ results, stateChanges, alertDelivered: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      console.error("uptime-monitor: no admin users found to notify");
      // Same reasoning -- nobody was actually told, so don't commit yet.
      return new Response(JSON.stringify({ results, stateChanges, alertDelivered: false, reason: "no admins found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Only commit the new statuses once the alert has genuinely, successfully been delivered.
    await commitPendingStatusWrites();

    return new Response(JSON.stringify({ results, stateChanges, alertDelivered: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("uptime-monitor error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
