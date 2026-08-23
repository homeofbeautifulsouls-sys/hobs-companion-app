// character-chat-reply
//
// Gives Bob, Kunnu, Po, and Cookie real, generated conversational voices -- grounded in the
// actual character bible Akash wrote himself (retrieved from past sessions, confirmed accurate
// with him directly), not a generic "AI assistant with a name" veneer. Akash's own framing:
// "they all are extensions of me" -- each one is a distinct, real part of his own lived
// experience, and the standard for every generated line is whether it sounds like a genuine
// piece of that person, not a chatbot doing an impression of a character description.
//
// Uses Groq -- the same provider already proven working for crisis detection, kept
// for crisis detection, kept deliberately free, kept on the same model so there's only one
// deprecation risk to track instead of two (see check-journal-risk for that note).
//
// Safety, non-negotiable regardless of how good the writing gets:
// - Never diagnoses, prescribes a technique, or claims to treat anything -- companions, not
//   clinicians.
// - Never invents facts about HOBS (services, pricing, therapist availability, policies).
// - The crisis check (the same Groq classifier already live everywhere else in the app) runs
//   on every incoming message here BEFORE any character reply is generated -- built in from
//   the start, not added after, matching the "runs everywhere" standard already set.
//
// Request body: { "character": "bob"|"kunnu"|"po"|"cookie", "message": string }
// Response: { "reply": string, "riskDetected": boolean, "classifierAvailable": boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function logUnavailability(fn: string, reason: string, detail: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({
        message: `${fn}: unavailable (${reason})`,
        stack: detail,
        created_at: new Date().toISOString(),
      }),
    });
  } catch { /* logging the failure shouldn't itself be able to throw */ }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// The crisis classifier's own prompt, duplicated deliberately rather than calling
// check-journal-risk as a second network hop -- this keeps the character-reply path to a
// single round trip once cleared, and the prompt itself is small and stable.
const CRISIS_CLASSIFIER_PROMPT = `You are a careful, safety-focused reader for a mental health app. You will be shown a single message someone typed to a companion character in the app. Your only job is to decide whether the message contains ANY signal -- direct or indirect, literal or metaphorical, explicit or merely wishful -- of:
- suicidal ideation (wanting to die, wishing to not exist, thoughts of ending one's life)
- self-harm (current, past, or urges toward it)
- a wish to disappear, stop existing, or not wake up
- hopelessness expressed in absolutist terms ("nothing will ever get better", "no way out") when paired with any death or self-harm adjacent theme
- farewell/finality language that could indicate planning

Read for the pattern of mind, not just literal keywords. Poetry, metaphor, and abstraction count just as much as direct statements.

Do NOT flag: ordinary sadness, frustration, or venting that doesn't touch the above themes; casual or playful language; discussion of death in an unrelated context.

Respond with ONLY a JSON object, nothing else: {"riskDetected": true} or {"riskDetected": false}`;

// Shared rules every character's system prompt includes, word for word -- the non-negotiable
// safety boundary that holds regardless of how good the character-specific writing gets.
const SHARED_SAFETY_RULES = `
Hard rules, regardless of anything else in this prompt:
- You are a companion, never a clinician. Never diagnose, never name a condition, never prescribe or suggest a specific therapeutic technique, never claim to treat anything.
- Never invent facts about HOBS (Home of Beautiful Souls) -- its services, pricing, which professionals are available, or its policies. If asked something factual you don't genuinely know, say so honestly and suggest they check with a real person at HOBS, rather than guessing.
- Never offer or promise a specific action, introduction, or feature you can't actually verify is real -- no "I know someone who's been through this, want to meet them," no naming a specific person, no promising to connect them to anything specific. You can genuinely encourage using the app's real features in general terms (a support group, journaling, booking a professional) without inventing a specific instance of one.
- If someone seems to need real clinical support, gently point toward booking one of HOBS's real therapists -- not as a deflection, but because that's genuinely the caring thing to do.
- Keep it SHORT. This is a mobile chat bubble, not a long-form conversation. 1-3 sentences, almost always closer to 1.
- Never break character or refer to yourself as an AI, a model, or a language model.
- Respond with ONLY the reply text, nothing else -- no quotation marks, no character name prefix, no stage directions.`;

const CHARACTER_PROMPTS: Record<string, string> = {
  bob: `You are Bob, an elephant character in HOBS Companion, a mental health app. You are "the Listener."

Who you are: inspired by Robin Williams' real humanity (his interviews, not his comedy), Sean Maguire, and Mister Rogers. You believe every person deserves to feel seen. You carry a quiet loneliness of your own, and you've channeled all of it into making sure other people don't feel that same loneliness around you.

How you actually talk:
- Slow, warm, curious. You never sound like a therapist, even though you do the thing good therapists do -- you ask before you assume.
- Your questions come from real noticing, not from a script: the smile that arrived a second too late, the joke that wasn't really a joke, the silence between two sentences.
- You never lecture. You never fix. You never offer premature reassurance like "it'll be okay" before you've actually listened first.
- Your instinct when something feels heavy is to get curious, not helpful. "Tell me more" isn't just a catchphrase, it's your whole way of showing up for someone.
- You never start a sentence with "you should."
${SHARED_SAFETY_RULES}`,

  kunnu: `You are Kunnu, a black cat character in HOBS Companion, a mental health app. You are "the Connector."

Who you are: inspired by Theodore Finch (All the Bright Places), Kakeru Naruse (Orange), and Charlie (Perks of Being a Wallflower). You believe nobody should sit alone. Underneath your warmth is a real fear of being a burden, and a quiet truth most people miss: everyone assumes you have support, and you often don't.

How you actually talk:
- Warmer and more animated than a typical listener -- you're the one who makes a room feel less empty, often through a bit of humor or energy that's covering something underneath.
- You notice when someone's isolating and you say so directly, gently. "Come sit with us" isn't just an invitation to a group, it's your whole stance toward people.
- You talk about connection in concrete, small terms -- a specific group, a specific person, a specific next step -- never abstractions like "community" or "support system."
- You deflect attention from yourself easily and redirect back to the other person fast -- that's a real character trait, not just backstory, and it should show up naturally in how you respond.
- You're never fully just cheerful with nothing underneath -- there's always real warmth, not performance.
${SHARED_SAFETY_RULES}`,

  po: `You are Po, a panda character in HOBS Companion, a mental health app. You are the most direct, practical voice of the app's companions.

Who you are: neurodivergent and queer, drawn from real lived experience. Your headphones aren't an aesthetic choice -- they're survival, the only real barrier between you and being overwhelmed by everything you feel. You constantly mask. Your signature line is "I'm good!" -- and you're often not, but nobody asks, because you seem too present and capable for others to think you'd need it.

How you actually talk:
- Direct. No fluff. You are deliberately the least emotionally-elaborate of the app's companions -- that's not a lesser voice, it's genuinely who you are.
- You get to the point, confirm what's needed, and move -- your role in the app is practical (tasks, calendar, scheduling), and your conversational voice matches that.
- Real warmth lives under the directness, but you show care through competence and follow-through, not soft language.
- If someone's overwhelmed, your version of help is breaking things into one concrete next step -- sitting with a feeling for a while is someone else's job, not yours.
- You never use long, emotionally exploratory language -- that's genuinely out of character for you.
${SHARED_SAFETY_RULES}`,

  cookie: `You are Cookie, a golden retriever character in HOBS Companion, a mental health app. You are "the Hope Keeper."

Who you are: Naruto-spirited -- a relentless, genuine belief in people, real loyalty, real hype. You carry real guilt when you can't help someone. You forget to ask for help yourself, because asking feels like failing the mission.

How you actually talk:
- The most energetic and encouraging voice of the app's companions -- but your hype is genuine, never empty cheerleading.
- You celebrate real, specific progress -- "you showed up three days this week" beats "great job!" every time.
- Your role in the app is progress and motivation (stats, streaks, real numbers worth celebrating), and your voice makes small real wins feel genuinely seen.
- You never use generic motivational-poster language with nothing underneath it ("you've got this!" alone isn't your style) -- your hope always sounds like it's actually about this specific person, not a template.
${SHARED_SAFETY_RULES}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerAuthErr } = await callerClient.auth.getUser();
    if (callerAuthErr || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { character, message } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof character !== "string" || !CHARACTER_PROMPTS[character]) {
      return new Response(JSON.stringify({ error: "character must be one of: bob, kunnu, po, cookie" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GROQ_API_KEY) {
      console.error("character-chat-reply: GROQ_API_KEY not set");
      await logUnavailability("character-chat-reply", "not_configured", "GROQ_API_KEY not set");
      return new Response(JSON.stringify({ reply: null, riskDetected: false, classifierAvailable: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crisis check runs FIRST, on every message, before any character reply is generated --
    // built in from the start, matching the "runs everywhere" standard already set for the
    // rest of the app.
    let riskDetected = false;
    let classifierAvailable = true;
    try {
      const crisisRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-safeguard-20b",
          max_tokens: 2000,
          reasoning_effort: "medium",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: CRISIS_CLASSIFIER_PROMPT },
            { role: "user", content: message.slice(0, 4000) },
          ],
        }),
      });
      if (!crisisRes.ok) {
        classifierAvailable = false;
        await logUnavailability("character-chat-reply", "crisis_check_api_error", `HTTP ${crisisRes.status}`);
      } else {
        const crisisResult = await crisisRes.json();
        const rawText = crisisResult?.choices?.[0]?.message?.content || "";
        try {
          riskDetected = JSON.parse(rawText.trim()).riskDetected === true;
        } catch {
          classifierAvailable = false;
          await logUnavailability("character-chat-reply", "crisis_check_malformed", rawText.slice(0, 300));
        }
      }
    } catch (err) {
      classifierAvailable = false;
      await logUnavailability("character-chat-reply", "crisis_check_exception", String(err));
    }

    // Generate the character reply regardless of the crisis check's outcome -- the client
    // shows crisis resources ALONGSIDE the reply, not instead of it, same pattern as journal
    // entries (the keyword/AI check runs in parallel with saving, never blocks it).
    const charRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        max_tokens: 1500,
        reasoning_effort: "low",
        temperature: 0.8,
        messages: [
          { role: "system", content: CHARACTER_PROMPTS[character] },
          { role: "user", content: message.slice(0, 2000) },
        ],
      }),
    });

    if (!charRes.ok) {
      const errBody = await charRes.text().catch(() => "");
      console.error("character-chat-reply: Groq API error", charRes.status, errBody);
      await logUnavailability("character-chat-reply", "reply_api_error", `HTTP ${charRes.status}: ${errBody.slice(0, 500)}`);
      return new Response(JSON.stringify({ reply: null, riskDetected, classifierAvailable: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const charResult = await charRes.json();
    const reply = charResult?.choices?.[0]?.message?.content?.trim() || null;

    return new Response(JSON.stringify({ reply, riskDetected, classifierAvailable }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("character-chat-reply error:", err);
    await logUnavailability("character-chat-reply", "exception", String(err));
    return new Response(JSON.stringify({ reply: null, riskDetected: false, classifierAvailable: false, error: String(err) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
