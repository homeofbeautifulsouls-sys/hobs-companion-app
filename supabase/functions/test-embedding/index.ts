// test-embedding
//
// Scratch test of Supabase's built-in gte-small embedding model (used to validate the semantic
// search / memory embedding approach before it was wired into extract-character-memories /
// character-chat-reply for real). No longer load-bearing for anything. verify_jwt: true, so not
// publicly exposed, but was live with no committed source until the Sept 27, 2026 audit found
// it the same way send-whatsapp-template was found -- deployed directly via the Management API,
// never committed. Pulled into version control for the same reason; not otherwise changed.

Deno.serve(async (req) => {
  try {
    const { input } = await req.json();
    // @ts-ignore -- Supabase.ai is a Deno-runtime global injected by Supabase Edge Functions,
    // not a real importable type in this repo's local TS environment.
    const session = new Supabase.ai.Session("gte-small");
    const output = await session.run(input, { mean_pool: true, normalize: true });
    return new Response(JSON.stringify({ ok: true, length: output.length, sample: output.slice(0, 5) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
