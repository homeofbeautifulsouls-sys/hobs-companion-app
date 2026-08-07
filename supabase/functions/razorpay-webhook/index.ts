// Real payment confirmation happens here, verified server-side, never trusted from the client
// alone -- a client-reported "success" callback can be spoofed, interrupted, or simply
// never fire even after a real successful payment. Verifies Razorpay's HMAC-SHA256 signature
// against the raw request body before touching anything, using the webhook secret configured
// in Razorpay's dashboard (a separate secret from the API key/secret pair).

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function dbWrite(path: string, method: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (!RAZORPAY_WEBHOOK_SECRET) {
      // Fail loudly rather than silently accepting unverifiable webhooks -- if this secret
      // isn't configured yet, nothing should be trusted as "paid" on its say-so.
      console.error("RAZORPAY_WEBHOOK_SECRET is not set -- rejecting all webhook calls until it is.");
      return new Response(JSON.stringify({ error: "Webhook not yet configured" }), { status: 503 });
    }

    // Signature must be verified against the exact raw body bytes, before any JSON parsing --
    // re-serializing the parsed object could produce different bytes and break verification.
    const rawBody = await req.text();
    const receivedSignature = req.headers.get("x-razorpay-signature") || "";
    const expectedSignature = await hmacSha256Hex(RAZORPAY_WEBHOOK_SECRET, rawBody);
    if (receivedSignature !== expectedSignature) {
      console.error("Webhook signature mismatch -- rejecting. This request did not genuinely come from Razorpay.");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // payment.captured is the real "money has actually settled" event. order.paid fires
    // alongside it for the same successful payment -- only acting on payment.captured avoids
    // doing this twice for one real payment.
    if (eventType !== "payment.captured") {
      return new Response(JSON.stringify({ received: true, ignored: eventType }), { status: 200 });
    }

    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!orderId || !paymentId) {
      return new Response(JSON.stringify({ error: "Malformed payload -- missing order_id or payment_id" }), { status: 400 });
    }

    const donations = await dbFetch(`donations?razorpay_order_id=eq.${orderId}&select=id,payment_confirmed`);
    if (Array.isArray(donations) && donations.length > 0) {
      const donationRow = donations[0];
      if (donationRow.payment_confirmed) {
        return new Response(JSON.stringify({ received: true, already_confirmed: true }), { status: 200 });
      }
      const updateResult = await dbWrite(`donations?id=eq.${donationRow.id}`, "PATCH", {
        payment_confirmed: true, razorpay_payment_id: paymentId, razorpay_signature: receivedSignature,
      });
      if (!updateResult.ok) {
        return new Response(JSON.stringify({ error: "Could not update donation record", detail: updateResult.data }), { status: 500 });
      }
      return new Response(JSON.stringify({ received: true, confirmed: true, type: "donation" }), { status: 200 });
    }

    // Not a donation -- check expert_bookings for either a regular session payment or a
    // separate cancellation charge (two different order_id columns on the same table, since a
    // booking can have both a real session payment AND, later, a separate cancellation charge).
    const bookingsBySessionPay = await dbFetch(`expert_bookings?razorpay_order_id=eq.${orderId}&select=id,payment_confirmed`);
    if (Array.isArray(bookingsBySessionPay) && bookingsBySessionPay.length > 0) {
      const row = bookingsBySessionPay[0];
      if (row.payment_confirmed) {
        return new Response(JSON.stringify({ received: true, already_confirmed: true }), { status: 200 });
      }
      const updateResult = await dbWrite(`expert_bookings?id=eq.${row.id}`, "PATCH", {
        payment_confirmed: true, razorpay_payment_id: paymentId, razorpay_signature: receivedSignature,
      });
      if (!updateResult.ok) {
        return new Response(JSON.stringify({ error: "Could not update booking record", detail: updateResult.data }), { status: 500 });
      }
      return new Response(JSON.stringify({ received: true, confirmed: true, type: "booking_payment" }), { status: 200 });
    }

    const bookingsByCancelCharge = await dbFetch(`expert_bookings?cancellation_razorpay_order_id=eq.${orderId}&select=id,cancellation_charge_owed`);
    if (Array.isArray(bookingsByCancelCharge) && bookingsByCancelCharge.length > 0) {
      const row = bookingsByCancelCharge[0];
      if (row.cancellation_charge_owed === false) {
        return new Response(JSON.stringify({ received: true, already_confirmed: true }), { status: 200 });
      }
      const updateResult = await dbWrite(`expert_bookings?id=eq.${row.id}`, "PATCH", {
        cancellation_charge_owed: false, razorpay_payment_id: paymentId, razorpay_signature: receivedSignature,
      });
      if (!updateResult.ok) {
        return new Response(JSON.stringify({ error: "Could not update cancellation charge record", detail: updateResult.data }), { status: 500 });
      }
      return new Response(JSON.stringify({ received: true, confirmed: true, type: "cancellation_charge" }), { status: 200 });
    }

    console.error("No matching donation or booking row for Razorpay order:", orderId);
    return new Response(JSON.stringify({ error: "No matching record found for this order" }), { status: 404 });
  } catch (err) {
    console.error("razorpay-webhook error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500 });
  }
});
