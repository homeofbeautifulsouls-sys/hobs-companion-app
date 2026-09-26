// Generic HOBS WhatsApp template sender.
// Called internally (from Postgres triggers via pg_net, or from app code)
// with a shared secret header — never exposed to end users directly.
//
// Body: { to: string, template: string, params: string[], lang?: string }
// "to" is normalized to E.164-without-plus for India (91XXXXXXXXXX).

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  return null; // reject anything that doesn't look like a real Indian mobile number
}

Deno.serve(async (req) => {
  const expectedSecret = Deno.env.get("SCHEDULER_SECRET");
  const gotSecret = req.headers.get("x-scheduler-secret");
  if (!expectedSecret || gotSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const { to, template, params, lang } = body || {};
  if (!to || !template || !Array.isArray(params)) {
    return new Response(JSON.stringify({ error: "missing to/template/params" }), { status: 400 });
  }

  const waTo = normalizePhone(to);
  if (!waTo) {
    return new Response(JSON.stringify({ error: "invalid phone number", raw: to }), { status: 400 });
  }

  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  const sendBody = {
    messaging_product: "whatsapp",
    to: waTo,
    type: "template",
    template: {
      name: template,
      language: { code: lang || "en_US" },
      components: params.length
        ? [
            {
              type: "body",
              parameters: params.map((p: string) => ({ type: "text", text: String(p) })),
            },
          ]
        : [],
    },
  };

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(sendBody),
  });

  const respJson = await res.json();

  // Every attempt is already durably logged by pg_net's own net._http_response
  // table (populated automatically for any caller using net.http_post), so no
  // separate logging call is needed here.

  return new Response(JSON.stringify({ status: res.status, response: respJson }), {
    status: res.status === 200 ? 200 : 502,
    headers: { "Content-Type": "application/json" },
  });
});
