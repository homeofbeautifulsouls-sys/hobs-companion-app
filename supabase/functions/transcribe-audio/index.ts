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
    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: mimeType }), `recording.${extension}`);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");

    const transcribeRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!transcribeRes.ok) {
      console.error("Groq transcription error:", transcribeRes.status, await transcribeRes.text());
      return new Response(JSON.stringify({ error: "Couldn't transcribe that — please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await transcribeRes.json();
    return new Response(JSON.stringify({ text: result.text || "" }), {
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
