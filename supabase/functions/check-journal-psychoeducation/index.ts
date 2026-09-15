// check-journal-psychoeducation
//
// Step 7 of the memory/safety build spec (docs/BOB-MEMORY-SAFETY-BUILD-SPEC.md, Part 3).
// Runs on journal entries, alongside (never instead of) the existing check-journal-risk crisis
// classifier -- this is a completely separate, additive tier for non-death depression/anxiety
// signals and physical-symptom routing, tracked the moment they appear, no minimum
// repetition threshold, per the locked design.
//
// Real, important boundary: this function only ever CLASSIFIES. It never diagnoses, and the
// actual informational content about what a flag might mean lives in the app's own existing
// tests (PHQ-9, GAD-7, PSQI) and mascot tip copy, never generated here as clinical explanation.
//
// Auth: requires a valid Supabase user JWT, same posture as check-journal-risk -- any signed-in
// user can call this for their own journal text.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function logUnavailability(reason: string, detail: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({ message: `check-journal-psychoeducation: unavailable (${reason})`, stack: detail, created_at: new Date().toISOString() }),
    });
  } catch { /* logging the failure shouldn't itself be able to throw */ }
}

// Real clinical grounding, already researched and locked in the build spec -- not invented here.
const PROMPT = `You are a careful reader for a mental health app's journal feature. You will be shown a single journal entry. Your only job is classification -- you never diagnose, never explain clinical reasoning to the person, just flag real signals for the app to route appropriately.

Judge for these, independently:

1. depressionSignal: real signs of low mood, anhedonia (loss of interest/pleasure), hopelessness, worthlessness, fatigue tied to mood -- not just one hard day, but a real pattern or intensity worth noticing.

2. anxietySignal: real signs of persistent worry, dread, racing thoughts, physical anxiety symptoms (racing heart, tension) tied to anxious thinking -- not just one stressful moment.

3. messyComboSignal: signals that don't cleanly fit depression or anxiety alone -- burnout, acute situational stress (exam stress, a specific deadline), overwhelm that's more circumstantial than a mood pattern.

4. physicalRouting: real physical-symptom patterns, specifically:
   - "gp": fatigue combined with low mood, palpitations combined with anxiety, or poor concentration combined with tiredness -- patterns that can genuinely reflect a nutrient deficiency (Vitamin D, B12, iron) or thyroid issue a GP should actually check, not just "feeling bad."
   - "psychiatrist_sleep": real, specific sleep complaints (insomnia, unable to fall or stay asleep, sleep disruption) as a distinct, named issue -- not just "tired."
   - null: neither specific pattern is present.

Read for real signal, not just a single low-energy word -- someone having one hard day is not the same as a real pattern.

Respond with ONLY a JSON object, nothing else: {"depressionSignal": true/false, "anxietySignal": true/false, "messyComboSignal": true/false, "physicalRouting": "gp"/"psychiatrist_sleep"/null}`;

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing auth" }), { status: 401, headers: corsHeaders });
    }
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: "invalid auth" }), { status: 401, headers: corsHeaders });
    }

    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "text is required" }), { status: 400, headers: corsHeaders });
    }
    if (!GROQ_API_KEY) {
      await logUnavailability("no_api_key", "GROQ_API_KEY not configured");
      return new Response(JSON.stringify({ classifierAvailable: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b",
        max_tokens: 2000,
        reasoning_effort: "medium",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: text.slice(0, 4000) },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      await logUnavailability("api_error", `HTTP ${res.status}: ${errBody.slice(0, 500)}`);
      return new Response(JSON.stringify({ classifierAvailable: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await res.json();
    let parsed;
    try {
      parsed = JSON.parse((result?.choices?.[0]?.message?.content || "{}").trim());
    } catch {
      await logUnavailability("malformed_response", (result?.choices?.[0]?.message?.content || "").slice(0, 300));
      return new Response(JSON.stringify({ classifierAvailable: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      classifierAvailable: true,
      depressionSignal: parsed.depressionSignal === true,
      anxietySignal: parsed.anxietySignal === true,
      messyComboSignal: parsed.messyComboSignal === true,
      physicalRouting: parsed.physicalRouting === "gp" || parsed.physicalRouting === "psychiatrist_sleep" ? parsed.physicalRouting : null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("check-journal-psychoeducation error:", err);
    await logUnavailability("exception", String(err));
    return new Response(JSON.stringify({ classifierAvailable: false, error: String(err) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
