// whatsapp-webhook
//
// Real receiver for Meta's WhatsApp webhook. We don't actually need incoming message
// handling for our use case (we only send outbound alerts) -- but the Callback URL field in
// Meta's dashboard is verified by an actual GET request with a challenge that must be echoed
// back correctly, and this can't be filled in with a made-up value; it needs a real endpoint
// behind it or "Verify and save" fails immediately.
//
// GET: Meta's one-time verification handshake. Checks hub.verify_token against our own real
// secret and echoes back hub.challenge if it matches, per Meta's documented requirement.
// POST: real incoming events (messages, delivery status). We don't act on these for now --
// logged only, in case they're useful later -- but the endpoint must return 200 or Meta will
// retry and eventually disable the subscription.

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("whatsapp-webhook: received event:", JSON.stringify(body));
    } catch (err) {
      console.error("whatsapp-webhook: failed to parse incoming event:", err);
    }
    // Always 200, regardless of whether we did anything with it -- Meta disables the
    // subscription after repeated non-200 responses.
    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});
