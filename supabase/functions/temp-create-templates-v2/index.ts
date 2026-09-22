// TEMPORARY, one-time-use -- creates the finalized, revised templates incorporating all real
// feedback: 3 distinct SOS templates (not one generic one), updated professional-assigned
// (sunflower, encouraging), updated disconnect (with the real reason), updated agreement
// (with real content).

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WABA_ID = "1101168369517284";

const templates = [
  {
    name: "hobs_sos_panic_attack",
    category: "UTILITY",
    language: "en_US",
    body: "{{1}} is having a panic attack and needs support now.\n📍 {{2}}\n\n*Do:*\n✅ Stay calm, sit with them\n✅ Short, simple sentences\n✅ Ask \"What do you need right now?\"\n✅ Guide slow breathing (in 4, hold 4, out 6)\n\n*Don't:*\n❌ Don't say \"calm down\" or \"it'll pass\"\n❌ Don't leave them alone\n❌ Don't crowd or rush them",
    example: ["Priya Shah", "https://maps.google.com/?q=23.0225,72.5714"],
  },
  {
    name: "hobs_sos_self_harm",
    category: "UTILITY",
    language: "en_US",
    body: "{{1}} is having thoughts of self-harm and needs support now.\n📍 {{2}}\n\n*Do:*\n✅ Stay calm, don't react with shock\n✅ Just listen — don't try to fix it\n✅ Say \"I'm here, you're not alone\"\n✅ Stay with them\n\n*Don't say:*\n❌ \"You're strong, you'll get through this\"\n❌ \"Others have it worse\"\n❌ \"This too shall pass\"\n❌ Don't offer solutions or lecture",
    example: ["Priya Shah", "https://maps.google.com/?q=23.0225,72.5714"],
  },
  {
    name: "hobs_sos_suicidal_thoughts",
    category: "UTILITY",
    language: "en_US",
    body: "URGENT: {{1}} is having thoughts of suicide and needs support now.\n📍 {{2}}\n\n*Do:*\n✅ Ask directly: \"Are you thinking of suicide?\"\n✅ Just listen — don't try to fix it\n✅ Stay with them, don't leave alone\n✅ Call 112 or Vandrevala 9999666555 if in danger\n\n*Don't say:*\n❌ \"It's all in your head\"\n❌ \"You have so much to live for\"\n❌ \"Others have it worse\"\n❌ Don't promise secrecy",
    example: ["Priya Shah", "https://maps.google.com/?q=23.0225,72.5714"],
  },
  {
    name: "hobs_professional_assigned_v2",
    category: "UTILITY",
    language: "en_US",
    body: "🌻 Great news, {{1}}! You've been connected with {{2}}, your {{3}}.\n\nReady to take the first step? Book your first session in the app today — we're here for you every step of the way. 🌻",
    example: ["Priya Shah", "Dr. Anisha Chaubey", "Therapist"],
  },
  {
    name: "hobs_disconnect_request_v2",
    category: "UTILITY",
    language: "en_US",
    body: "{{1}} has requested to disconnect from {{2}}.\n\nReason given: \"{{3}}\"\n\nPlease review and respond in the app.",
    example: ["Priya Shah", "Dr. Anisha Chaubey", "Scheduling conflicts with new work hours"],
  },
  {
    name: "hobs_agreement_signed_v2",
    category: "UTILITY",
    language: "en_US",
    body: "{{1}} has signed their No-Suicide Agreement with {{2}}.\n\nEmergency contacts on file:\n{{3}}\n\nOpen the app to view the full agreement and address.",
    example: ["Priya Shah", "Dr. Anisha Chaubey", "1) Raj Shah - 9876543210  2) Meera Shah - 9876543211"],
  },
];

Deno.serve(async (_req) => {
  const results: any[] = [];
  for (const t of templates) {
    const res = await fetch(`https://graph.facebook.com/v23.0/${WABA_ID}/message_templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: t.name,
        language: t.language,
        category: t.category,
        components: [
          {
            type: "BODY",
            text: t.body,
            example: { body_text: [t.example] },
          },
        ],
      }),
    });
    const json = await res.json();
    results.push({ name: t.name, status: res.status, response: json });
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
