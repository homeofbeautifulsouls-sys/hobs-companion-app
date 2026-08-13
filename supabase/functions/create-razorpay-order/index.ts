const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function getCallerIdFromJWT(authHeader: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authHeader },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.id || null;
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

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function createRazorpayOrder(amountRupees: number, notes: Record<string, string>) {
  const amountPaise = Math.round(amountRupees * 100);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: `hobs_${Date.now()}`, notes }),
  });
  const json = await res.json();
  return { ok: res.ok, amountPaise, json };
}

async function fetchExistingRazorpayOrder(orderId: string) {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`) },
  });
  const json = await res.json();
  // "created" or "attempted" both mean this order is still genuinely open for payment --
  // "paid" means it's already done (shouldn't be reused for a new attempt).
  return { ok: res.ok, json, isStillOpen: res.ok && (json.status === "created" || json.status === "attempted") };
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const purpose = body.purpose || "donation"; // default keeps existing donate.html calls working unchanged

    // Zero-side-effect ping for a keep-warm cron -- returns immediately, touches neither the
    // database nor Razorpay's API. Real bug found and fixed via direct timing: this function was
    // taking 2s+ on a cold start vs 0.5-0.7s warm, and a real user's tap was sometimes the one
    // that woke it up from cold. A periodic ping keeps an instance warm so real requests don't.
    if (purpose === "ping") {
      return new Response(JSON.stringify({ warm: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (purpose === "donation") {
      const { campaign_id, amount, donor_name, user_id } = body;
      if (!campaign_id || !amount || Number(amount) <= 0) {
        return new Response(JSON.stringify({ error: "campaign_id and a positive amount are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const campaigns = await dbFetch(`donation_campaigns?id=eq.${campaign_id}&is_active=eq.true&select=id`);
      if (!Array.isArray(campaigns) || campaigns.length === 0) {
        return new Response(JSON.stringify({ error: "This campaign is not currently accepting donations" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const order = await createRazorpayOrder(Number(amount), { purpose, campaign_id, donor_name: donor_name || "" });
      if (!order.ok) {
        return new Response(JSON.stringify({ error: "Could not create Razorpay order", detail: order.json }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const insert = await dbWrite("donations", "POST", {
        campaign_id, donor_name: donor_name || null, amount: Number(amount),
        payment_confirmed: false, user_id: user_id || null,
        razorpay_order_id: order.json.id, payment_method: "razorpay",
      });
      if (!insert.ok) {
        return new Response(JSON.stringify({ error: "Could not save donation record", detail: insert.data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ order_id: order.json.id, amount: order.amountPaise, currency: "INR", key_id: RAZORPAY_KEY_ID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (purpose === "booking_payment" || purpose === "cancellation_charge") {
      const { booking_id, user_id } = body;
      if (!booking_id || !user_id) {
        return new Response(JSON.stringify({ error: "booking_id and user_id are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Real security fix: previously trusted user_id as supplied by the browser, with no
      // verification the caller actually WAS that person -- confirmed directly, and fixed here
      // rather than trusting the client at all. Donations stay unauthenticated by design (a
      // public donation page shouldn't require login); real money tied to a specific person's
      // booking requires proof they actually are that person.
      const authHeader = req.headers.get("Authorization") ?? "";
      const callerId = await getCallerIdFromJWT(authHeader);
      if (!callerId) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (callerId !== user_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const bookings = await dbFetch(`expert_bookings?id=eq.${booking_id}&user_id=eq.${user_id}&select=id,amount_due,cancellation_amount_due,expert_name,payment_confirmed,cancellation_charge_owed,razorpay_order_id,cancellation_razorpay_order_id`);
      if (!Array.isArray(bookings) || bookings.length === 0) {
        return new Response(JSON.stringify({ error: "Booking not found for this user" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const booking = bookings[0];
      const amountField = purpose === "booking_payment" ? "amount_due" : "cancellation_amount_due";
      const amount = booking[amountField];
      if (amount === null || amount === undefined || Number(amount) <= 0) {
        return new Response(JSON.stringify({ error: "The amount for this payment hasn't been set yet -- please check with your admin" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency check: if this exact booking+purpose already has an outstanding order that
      // Razorpay confirms is still genuinely open (not yet paid), reuse it rather than creating
      // a second one and orphaning the first.
      const isBookingPayment = purpose === "booking_payment";
      const alreadyPaid = isBookingPayment ? booking.payment_confirmed === true : booking.cancellation_charge_owed === false;
      const existingOrderId = isBookingPayment ? booking.razorpay_order_id : booking.cancellation_razorpay_order_id;
      if (!alreadyPaid && existingOrderId) {
        const existing = await fetchExistingRazorpayOrder(existingOrderId);
        if (existing.isStillOpen) {
          return new Response(JSON.stringify({ order_id: existing.json.id, amount: existing.json.amount, currency: existing.json.currency, key_id: RAZORPAY_KEY_ID }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const order = await createRazorpayOrder(Number(amount), { purpose, booking_id, expert_name: booking.expert_name || "" });
      if (!order.ok) {
        return new Response(JSON.stringify({ error: "Could not create Razorpay order", detail: order.json }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const orderIdField = purpose === "booking_payment" ? "razorpay_order_id" : "cancellation_razorpay_order_id";
      const update = await dbWrite(`expert_bookings?id=eq.${booking_id}`, "PATCH", { [orderIdField]: order.json.id });
      if (!update.ok) {
        return new Response(JSON.stringify({ error: "Could not save booking payment record", detail: update.data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ order_id: order.json.id, amount: order.amountPaise, currency: "INR", key_id: RAZORPAY_KEY_ID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown purpose: " + purpose }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-razorpay-order error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
