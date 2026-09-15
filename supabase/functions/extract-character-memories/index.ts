// extract-character-memories
//
// Step 6 of the memory/safety build spec (docs/BOB-MEMORY-SAFETY-BUILD-SPEC.md, Part 1.5).
// Runs weekly via pg_cron. Finds ordinary (non-significant) character_messages that have aged
// out of the active 40-message window AND are at least 7 days old, and EXTRACTS them -- real
// quotes, names, and specific instances preserved verbatim, only genuine filler and redundant
// back-and-forth trimmed. This is explicitly NOT abstractive summarization -- see the prompt
// below, and the real, locked distinction in the build spec: compression loses nuance,
// extraction doesn't.
//
// Never touches anything flagged is_significant -- those stay verbatim forever, unconditionally,
// regardless of age, per the guaranteed-recall design already built in character-chat-reply.
// Never deletes the original raw rows -- "everything, forever, no pruning" is a locked, real
// decision from earlier in this project; extraction adds a secondary, condensed representation
// alongside the untouched originals, it doesn't replace them.
//
// Auth: shared secret, same pattern as every other scheduled function in this project.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const EXTRACTION_PROMPT = `You will be shown a real batch of ordinary conversation messages between a person and their companion character, in order. Your job is EXTRACTION, not summarization -- these are genuinely different things.

Summarization rewrites into a shorter gist, and loses specifics along the way. Extraction keeps the real substance -- exact quotes, names, specific events, specific details -- and only trims genuine filler: small talk, greetings, redundant back-and-forth that doesn't carry real information. If you are ever unsure whether something is filler or substance, treat it as substance and keep it.

Produce a structured record with these real, distinct parts:
- keyQuotes: an array of the actual, real, exact phrases the person used for anything specific or worth remembering -- verbatim, not paraphrased. Empty array if genuinely nothing rises to this.
- namedThings: an array of specific people, places, activities, or things mentioned by name.
- topic: a short, plain description of what this batch of messages was actually about.

Respond with ONLY a JSON object, nothing else: {"keyQuotes": [...], "namedThings": [...], "topic": "..."}`;

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
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function runSql(query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_extraction_eligibility`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-scheduler-secret" };
  try {
    const schedulerSecret = req.headers.get("x-scheduler-secret");
    if (schedulerSecret !== SCHEDULER_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Find eligible groups (user_id, character) via the dedicated Postgres function -- see the
    // migration that created exec_extraction_eligibility for the real window-function query.
    const groups = await runSql("");
    let processedGroups = 0;
    let processedMessages = 0;
    let errors = 0;

    for (const group of groups || []) {
      try {
        const eligibleRows = await dbFetch(
          `character_messages?user_id=eq.${group.user_id}&character=eq.${group.character}&is_significant=eq.false&is_extracted=eq.false&order=created_at.asc&select=id,role,text,created_at`
        );
        // Re-derive eligibility precisely here (the group-level function only tells us WHICH
        // user+character pairs have at least one eligible message, not exactly which rows --
        // recency rank and age are re-checked per row against the real current state).
        const totalForPair = await dbFetch(
          `character_messages?user_id=eq.${group.user_id}&character=eq.${group.character}&select=id&order=created_at.desc`
        );
        const recentIds = new Set((totalForPair || []).slice(0, 40).map((r: any) => r.id));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const eligible = (eligibleRows || []).filter((r: any) => !recentIds.has(r.id) && new Date(r.created_at) < sevenDaysAgo);
        if (eligible.length === 0) continue;

        const transcript = eligible.map((r: any) => `${r.role === "user" ? "Them" : "Character"}: ${r.text}`).join("\n");
        const extractRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-oss-safeguard-20b",
            max_tokens: 2000,
            reasoning_effort: "low",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: EXTRACTION_PROMPT },
              { role: "user", content: transcript.slice(0, 15000) },
            ],
          }),
        });
        if (!extractRes.ok) { errors++; continue; }
        const extractResult = await extractRes.json();
        const parsed = JSON.parse((extractResult?.choices?.[0]?.message?.content || "{}").trim());
        const extractedContent = JSON.stringify({
          topic: parsed.topic || "",
          keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
          namedThings: Array.isArray(parsed.namedThings) ? parsed.namedThings : [],
        });

        const writeRes = await dbWrite("character_extractions", "POST", {
          user_id: group.user_id,
          character: group.character,
          extracted_content: extractedContent,
          source_message_ids: eligible.map((r: any) => r.id),
          source_date_range_start: eligible[0].created_at,
          source_date_range_end: eligible[eligible.length - 1].created_at,
        });
        if (!writeRes.ok) { errors++; continue; }

        for (const row of eligible) {
          await dbWrite(`character_messages?id=eq.${row.id}`, "PATCH", { is_extracted: true });
        }
        processedGroups++;
        processedMessages += eligible.length;
      } catch (groupErr) {
        errors++;
        console.error("extract-character-memories: group failed", group, groupErr);
      }
    }

    return new Response(JSON.stringify({ processedGroups, processedMessages, errors }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-character-memories error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
