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

async function dbWrite(path: string, method: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function sendAlarmPush(userId: string, title: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({
      serverCallerId: null,
      userId,
      title: "Alarm",
      body: title,
      data: { type: "task_alarm" },
      notificationType: "task_alarm",
    }),
  });
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const schedulerSecret = req.headers.get("x-scheduler-secret");
    if (schedulerSecret !== SCHEDULER_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const nowIso = new Date().toISOString();
    const results: unknown[] = [];

    const dueTasks = await dbFetch(`tasks?alarm_at=lte.${nowIso}&alarm_notified=eq.false&alarm_at=not.is.null&select=id,user_id,title`);
    for (const t of (Array.isArray(dueTasks) ? dueTasks : [])) {
      await sendAlarmPush(t.user_id, t.title);
      await dbWrite(`tasks?id=eq.${t.id}`, "PATCH", { alarm_notified: true });
      results.push({ type: "task", id: t.id, title: t.title });
    }

    const dueSubtasks = await dbFetch(`subtasks?alarm_at=lte.${nowIso}&alarm_notified=eq.false&alarm_at=not.is.null&select=id,user_id,title`);
    for (const s of (Array.isArray(dueSubtasks) ? dueSubtasks : [])) {
      await sendAlarmPush(s.user_id, s.title);
      await dbWrite(`subtasks?id=eq.${s.id}`, "PATCH", { alarm_notified: true });
      results.push({ type: "subtask", id: s.id, title: s.title });
    }

    return new Response(JSON.stringify({ sent: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-task-alarms error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
