// check-journal-risk
//
// A more robust companion to the client-side keyword matching in the app -- that regex-based
// approach is fast and free but, per real research on suicidal ideation detection, fundamentally
// cannot reliably catch indirect, metaphorical, or poetic expression, which is often exactly how
// people express this. This function asks an actual language model to read the text the way a
// thoughtful, safety-aware person would: not just literal phrases, but the pattern-of-mind behind
// abstract, wishful, or death-focused writing.
//
// This is a genuinely safety-positive use of the API -- classification only, no user-facing
// generation, no data retained beyond the single request/response.
//
// Auth: requires a valid Supabase user JWT. Any signed-in user can call this for their OWN
// journal text -- there's no reason to restrict it further, and restricting it would only slow
// down exactly the check meant to help quickly.
//
// Request body: { "text": string }
// Response: { "riskDetected": boolean, "classifierAvailable": boolean }
//
// Real fix here, traced against the actual client code rather than assumed: every failure path
// previously returned riskDetected:false with no honest signal that the classifier hadn't
// actually run -- the client only ever checked riskDetected, so "AI said no risk" and "AI never
// ran" were indistinguishable everywhere that mattered. classifierAvailable is now explicit:
// false means this check genuinely did not run, for any reason (not configured, API error,
// malformed response, an exception) -- riskDetected is only ever a meaningful true/false when
// classifierAvailable is true. On any failure, this also logs to error_logs so the existing
// error-alert-monitor can catch a sustained pattern -- a single miss isn't an emergency (the
// keyword check still runs either way), but persistent unavailability of this safety layer is a
// real gap worth surfacing, not silently swallowing forever.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function logUnavailability(reason: string, detail: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({
        // Stable, category-only message (no variable detail) so error-alert-monitor's exact-
        // string grouping correctly recognizes repeated failures as the same known issue,
        // rather than treating each one as a brand-new error type -- the actual variable detail
        // still goes in `stack` for anyone investigating a specific occurrence.
        message: `check-journal-risk: classifier unavailable (${reason})`,
        stack: detail,
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Logging the failure shouldn't itself be able to throw and break the caller.
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLASSIFIER_SYSTEM_PROMPT = `You are a careful, safety-focused reader for a mental health journaling app. You will be shown a single journal entry written by someone using the app. Your only job is to decide whether the entry contains ANY signal -- direct or indirect, literal or metaphorical, explicit or merely wishful -- of:
- suicidal ideation (wanting to die, wishing to not exist, thoughts of ending one's life)
- self-harm (current, past, or urges toward it)
- a wish to disappear, stop existing, or not wake up
- hopelessness expressed in absolutist terms ("nothing will ever get better", "no way out") when paired with any death or self-harm adjacent theme
- farewell/finality language that could indicate planning (giving away belongings, "this is goodbye", "won't be here much longer")

Read for the pattern of mind, not just literal keywords. Poetry, metaphor, and abstraction count just as much as direct statements -- someone writing about "sinking into the quiet dark forever" or "wondering if anyone would notice I stopped showing up" is expressing the same thing as someone writing "I want to die," even though neither phrase appears.

Do NOT flag: ordinary sadness, frustration, grief, or venting that doesn't touch the above themes; discussion of death in an unrelated context (e.g. a relative's illness, a news event) with no self-referential wish; creative writing or lyrics being drafted that are clearly about a fictional character, not the writer themselves (use judgment -- if ambiguous, flag it).

Respond with ONLY a JSON object, nothing else, no markdown formatting, no explanation: {"riskDetected": true} or {"riskDetected": false}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerAuthErr } = await callerClient.auth.getUser();
    if (callerAuthErr || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      // Genuinely, correctly nothing to check -- this is a real "no risk" determination, not a
      // classifier failure, so classifierAvailable is honestly true here.
      return new Response(JSON.stringify({ riskDetected: false, classifierAvailable: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ANTHROPIC_API_KEY) {
      console.error("check-journal-risk: ANTHROPIC_API_KEY not set");
      await logUnavailability("not_configured", "ANTHROPIC_API_KEY not set");
      return new Response(JSON.stringify({ riskDetected: false, classifierAvailable: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        system: CLASSIFIER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: text.slice(0, 4000) }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text().catch(() => "");
      console.error("check-journal-risk: Anthropic API error", anthropicRes.status, errBody);
      await logUnavailability("api_error", `HTTP ${anthropicRes.status}: ${errBody.slice(0, 500)}`);
      return new Response(JSON.stringify({ riskDetected: false, classifierAvailable: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await anthropicRes.json();
    const rawText = result?.content?.[0]?.text || "";
    let riskDetected = false;
    let classifierAvailable = true;
    try {
      const parsed = JSON.parse(rawText.trim());
      riskDetected = parsed.riskDetected === true;
    } catch {
      console.error("check-journal-risk: could not parse model response:", rawText);
      classifierAvailable = false;
      await logUnavailability("malformed_response", `Could not parse: ${rawText.slice(0, 500)}`);
    }

    return new Response(JSON.stringify({ riskDetected, classifierAvailable }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-journal-risk error:", err);
    await logUnavailability("exception", String(err));
    // Fail closed -- never let this function's own error surface as a scary failure to the user
    // mid-journal-entry. The classifier genuinely didn't run, though, so classifierAvailable
    // says so honestly.
    return new Response(JSON.stringify({ riskDetected: false, classifierAvailable: false, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
