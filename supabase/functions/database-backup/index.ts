// database-backup: exports the critical, user-generated-content tables as JSON snapshots into
// Supabase Storage. Built because this project is on the free plan, which doesn't support
// Supabase's own Point-in-Time Recovery -- this is a genuine, working substitute rather than
// leaving the app with zero backup coverage at all. Triggered daily via pg_cron.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// The critical, genuinely irreplaceable user-generated tables -- journal entries, tasks,
// profiles, bookings, calendar connections, payment records, test results. Deliberately
// excludes purely derivational/log tables (notification_log, etc.) to keep backups focused
// and fast.
const TABLES_TO_BACKUP = [
  "profiles", "entries", "tasks", "subtasks", "expert_bookings", "donations",
  "donation_campaigns", "test_results", "professional_calendar_connections",
  "professional_busy_blocks", "session_calendar_events", "calendar_change_requests",
];

async function fetchAllRows(table: string): Promise<any[]> {
  const rows: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${offset}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Fetch failed for ${table}: ${res.status} ${errText}`);
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Same shared-secret pattern already used for other cron-triggered functions in this project.
  const providedSecret = req.headers.get("x-scheduler-secret");
  const expectedSecret = Deno.env.get("SCHEDULER_SECRET");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const results: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const table of TABLES_TO_BACKUP) {
      try {
        const rows = await fetchAllRows(table);
        const body = JSON.stringify({ table, exported_at: new Date().toISOString(), row_count: rows.length, rows }, null, 0);
        const uploadRes = await fetch(
          `${SUPABASE_URL}/storage/v1/object/database-backups/${timestamp}/${table}.json`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body,
          },
        );
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          errors[table] = `Upload failed: ${uploadRes.status} ${errText}`;
          continue;
        }
        results[table] = rows.length;
      } catch (err) {
        errors[table] = err instanceof Error ? err.message : String(err);
      }
    }

    const success = Object.keys(errors).length === 0;
    return new Response(
      JSON.stringify({ success, timestamp, tables_backed_up: results, errors: Object.keys(errors).length ? errors : undefined }),
      { status: success ? 200 : 207, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
