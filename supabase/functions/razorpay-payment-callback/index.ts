// Required by Razorpay's own documented WebView integration pattern (their standard
// popup/handler-based checkout is designed for a real browser tab, not an embedded WebView, and
// per their docs doesn't reliably work there): https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/webview/
// This is the callback_url their checkout POSTs to after a payment attempt, when redirect:true
// is set. Its only job is to send the WebView back to a real, working page in-app -- it does NOT
// verify or record the payment itself. Verification stays exactly where it already correctly
// was: razorpay-webhook, called server-to-server directly by Razorpay after independently
// verifying their own signature, is the only thing that has ever been allowed to mark a donation
// as actually paid, and that doesn't change here. Trusting this callback's own POST body for
// that would be a real security regression -- a client-reachable URL is not proof of payment.
Deno.serve(async (req: Request) => {
  // Razorpay may POST (form-encoded, per their docs) or the WebView may end up GET-ing this on
  // a retry/refresh -- handle both rather than erroring on the one their docs don't fully spell out.
  const location = "https://app.homeofbeautifulsouls.com/donate.html?payment_attempted=1";
  return new Response(null, { status: 302, headers: { Location: location } });
});
