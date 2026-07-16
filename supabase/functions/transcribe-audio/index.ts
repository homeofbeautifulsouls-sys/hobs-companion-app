// Real audio transcription for the journal mic feature, replacing the on-device Android
// speech-recognition approach that hit a hard platform limitation (sessions cutting off after
// a few seconds of silence, no way around it from the client). This function receives an
// audio recording captured client-side (via MediaRecorder, which has no such cutoff), sends
// it to AssemblyAI for transcription, and returns the resulting text.
//
// Switched from OpenAI Whisper to AssemblyAI specifically because HOBS operates with no
// budget for this: Google Cloud Speech-to-Text requires a billing card on file even for its
// free tier (confirmed directly in Google's own docs), and Whisper has no ongoing free tier
// at all. AssemblyAI's free tier (185 hours/month) requires no card whatsoever, and
// independently benchmarks at or above Whisper's accuracy -- not a quality compromise for
// being free.
//
// AssemblyAI's API is a 3-step async flow, unlike Whisper's single call: upload the audio to
// get a temporary URL, submit that URL to start a transcription job, then poll until it
// completes. Polling is capped (see maxAttempts below) so a stuck job can't hang the request
// forever.
//
// Auth is checked via a direct call to Supabase's own /auth/v1/user endpoint rather than the
// supabase-js SDK -- the esm.sh-imported SDK caused an earlier version of this function to
// fail to boot entirely (confirmed directly: a minimal function with no imports booted fine,
// adding the SDK import alone broke it), so this avoids that dependency altogether.

const ASSEMBLYAI_API_KEY = Deno.env.get("ASSEMBLYAI_API_KEY");
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
    if (!ASSEMBLYAI_API_KEY) {
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
    if (!base64Audio) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    // Step 1: upload the raw audio bytes, get a temporary URL back.
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { Authorization: ASSEMBLYAI_API_KEY },
      body: bytes,
    });
    if (!uploadRes.ok) {
      console.error("AssemblyAI upload error:", uploadRes.status, await uploadRes.text());
      return new Response(JSON.stringify({ error: "Upload failed. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { upload_url } = await uploadRes.json();

    // Step 2: submit that URL to start a transcription job.
    const submitRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: { Authorization: ASSEMBLYAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ audio_url: upload_url }),
    });
    if (!submitRes.ok) {
      console.error("AssemblyAI submit error:", submitRes.status, await submitRes.text());
      return new Response(JSON.stringify({ error: "Transcription failed to start. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { id: transcriptId } = await submitRes.json();

    // Step 3: poll until the job completes (or errors, or we give up after ~30s).
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { Authorization: ASSEMBLYAI_API_KEY },
      });
      const pollData = await pollRes.json();
      if (pollData.status === "completed") {
        return new Response(JSON.stringify({ text: pollData.text || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (pollData.status === "error") {
        console.error("AssemblyAI transcription error:", pollData.error);
        return new Response(JSON.stringify({ error: "Transcription failed. Please try again." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // else: status is 'queued' or 'processing' -- keep polling
    }

    return new Response(JSON.stringify({ error: "Transcription is taking longer than expected — please try again." }), {
      status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("transcribe-audio error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
