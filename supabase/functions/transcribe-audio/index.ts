// Real audio transcription for the journal mic feature, replacing the on-device Android
// speech-recognition approach that hit a hard platform limitation (sessions cutting off after
// a few seconds of silence, no way around it from the client). This function receives an
// audio recording captured client-side (via MediaRecorder, which has no such cutoff), sends
// it for transcription, and returns the resulting text.
//
// Switched from AssemblyAI to Groq's own Whisper endpoint, per direct report that
// transcription was taking a long time -- confirmed directly, AssemblyAI's API is a genuinely
// slower shape for this: a 3-step async flow (upload, submit, then poll every 1.5s for up to
// 30s) versus Groq's single, synchronous, OpenAI-compatible call that real, independent
// benchmarks put at roughly 8-12 seconds for a full HOUR of audio -- an ordinary journal
// recording of a minute or two should come back in a couple of seconds, not tens of seconds.
// Groq's Whisper free tier requires no credit card either, the same real constraint that led
// to AssemblyAI over OpenAI's own Whisper API in the first place, so this isn't a quality or
// budget compromise -- HOBS already has a real, working Groq key configured for this project.

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Transcription is not configured yet." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is a real, authenticated HOBS user before spending any transcription
    // minutes on their behalf -- this endpoint should never be reachable by an anonymous caller.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userCheckRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY ?? "" },
    });
    if (!userCheckRes.ok) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const base64Audio = body.audio;
    const mimeType = body.mimeType || "audio/webm";
    if (!base64Audio) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    // A single, synchronous multipart call -- no upload step, no job id, no polling.
    const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";

    // Real, direct fix, per explicit instruction that journaling needs to genuinely handle
    // Hindi, English, and Hinglish (code-switched Hindi-English within one recording) --
    // confirmed directly, Whisper's own language parameter only ever accepts one single
    // language at a time, there's no real "either of these" mode to ask for. Auto-detection
    // handles genuine code-switching reasonably well on its own (Whisper's multilingual
    // training includes real code-switched speech), but auto-detection alone is exactly what
    // produced the earlier real Icelandic failure -- so this doesn't just trust whatever
    // language it guesses. Requests verbose_json specifically to get the real detected
    // language back, and only trusts that result when it's actually one of this app's two real,
    // expected languages; anything else (a implausible guess like Icelandic again) is treated
    // as a real detection failure and retried once, forcing English as a safe, sensible
    // default, rather than ever surfacing a wrong-language hallucination again.
    async function callGroqWhisper(forceLanguage: string | null) {
      const formData = new FormData();
      formData.append("file", new Blob([bytes], { type: mimeType }), `recording.${extension}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "verbose_json");
      if (forceLanguage) formData.append("language", forceLanguage);
      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false as const, status: res.status, errText };
      }
      const json = await res.json();
      return { ok: true as const, text: json.text || "", language: json.language || null };
    }

    const PLAUSIBLE_LANGUAGES = ["english", "hindi"]; // Groq/Whisper's verbose_json names, not ISO codes

    let attempt = await callGroqWhisper(null); // auto-detect first, so real Hindi/Hinglish isn't forced into English
    if (!attempt.ok) {
      console.error("Groq transcription error:", attempt.status, attempt.errText);
      return new Response(JSON.stringify({ error: "Couldn't transcribe that — please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const detected = (attempt.language || "").toLowerCase();
    if (detected && !PLAUSIBLE_LANGUAGES.includes(detected)) {
      // A real detection failure, not a real third language -- retry once, forced to English.
      const retry = await callGroqWhisper("en");
      if (retry.ok) attempt = retry;
      // If the retry itself fails, deliberately keep the first (implausible) result rather than
      // fail the whole request -- a wrong-language guess a person can still see and redo is
      // better than losing the recording outright.
    }

    return new Response(JSON.stringify({ text: attempt.ok ? attempt.text : "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("transcribe-audio error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
