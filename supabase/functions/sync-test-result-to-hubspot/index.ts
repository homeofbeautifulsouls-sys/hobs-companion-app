// Sends a completed test result into HubSpot, matching the same real mechanism the website's
// own free screening form already uses (create/find a Contact by email, attach the result) --
// but as a Note on the contact rather than overwriting a single field, so a client's result
// history stays intact across multiple tests over time instead of each new one erasing the last.
//
// Deliberately does NOT attempt to recompute each test's actual numeric score server-side --
// several tests use reverse-scored items and per-test band thresholds, and replicating that
// exactly for all 16 test types here would be real, error-prone duplication of logic that
// already lives correctly in the app itself. Reports the test name, the elevated flag (already
// reliably computed and stored), and the self-harm flag if set -- genuinely useful signal
// without risking a subtly wrong recomputed score sitting in the CRM.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const HUBSPOT_API_TOKEN = Deno.env.get("HUBSPOT_API_TOKEN");

const TEST_NAMES: Record<string, string> = {
  pss10: "Perceived Stress Scale (PSS-10)",
  slsi: "Student Life Stress Inventory (SLSI)",
  scs: "Social Connectedness Scale (SCS)",
  aps: "Academic Procrastination Scale (APS)",
  phq9: "Depression Screening (PHQ-9)",
  gad7: "Anxiety Screening (GAD-7)",
  dass: "Depression, Anxiety & Stress Scales (DASS-42)",
  psqi: "Sleep Quality Screening (PSQI)",
  pcl5: "Trauma & Stress Response Screening (PCL-5)",
  bigfive: "Personality Screening (Big Five)",
  afi: "Attentional Function Index (AFI)",
  cfq: "Cognitive Failures Questionnaire (CFQ)",
  ders: "Difficulties in Emotion Regulation Scale (DERS)",
  ucla20: "Loneliness Screening (UCLA-20)",
  burnout: "Workplace Burnout Screening (CBI)",
  taws: "Work Stress Screening (TAWS)",
};

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function hubspot(path: string, method: string, body?: unknown) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${HUBSPOT_API_TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const schedulerSecret = req.headers.get("x-scheduler-secret");
    if (schedulerSecret !== Deno.env.get("SCHEDULER_SECRET")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { user_id, test_key, elevated, self_harm_flagged, created_at } = body;
    if (!user_id || !test_key) {
      return new Response(JSON.stringify({ error: "user_id and test_key required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auth users' email isn't in the profiles REST view -- fetch via the admin auth endpoint.
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    const userData = await userRes.json();
    const email = userData?.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "Could not resolve a real email for this user -- skipping HubSpot sync" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const profileArr = await dbFetch(`profiles?user_id=eq.${user_id}&select=name`);
    const clientName = (Array.isArray(profileArr) && profileArr[0]?.name) || email;

    // Find or create the Contact by email, same matching logic the website's own form uses.
    const searchResult = await hubspot("/crm/v3/objects/contacts/search", "POST", {
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      limit: 1,
    });
    let contactId = searchResult.ok && searchResult.json.results?.[0]?.id;

    if (!contactId) {
      const nameParts = String(clientName).trim().split(" ");
      const createResult = await hubspot("/crm/v3/objects/contacts", "POST", {
        properties: {
          email,
          firstname: nameParts[0] || "",
          lastname: nameParts.slice(1).join(" ") || "",
        },
      });
      if (!createResult.ok) {
        return new Response(JSON.stringify({ error: "Could not create HubSpot contact", detail: createResult.json }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      contactId = createResult.json.id;
    }

    const testName = TEST_NAMES[test_key] || test_key;
    const resultDate = created_at ? new Date(created_at) : new Date();
    const dateLabel = resultDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const noteLines = [
      "=== HOBS Companion App — Test Result ===",
      `Test: ${testName}`,
      `Date: ${dateLabel}`,
      `Result: ${elevated ? "Elevated — may benefit from follow-up" : "Not elevated"}`,
    ];
    if (self_harm_flagged) {
      noteLines.push("⚠ Self-harm indicator flagged on this screening — please review directly with the client.");
    }
    const noteBody = noteLines.join("\n");

    const noteResult = await hubspot("/crm/v3/objects/notes", "POST", {
      properties: {
        hs_timestamp: resultDate.toISOString(),
        hs_note_body: noteBody,
      },
      associations: [
        { to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] },
      ],
    });

    if (!noteResult.ok) {
      return new Response(JSON.stringify({ error: "Could not create HubSpot note", detail: noteResult.json }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, contact_id: contactId, note_id: noteResult.json.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("sync-test-result-to-hubspot error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
