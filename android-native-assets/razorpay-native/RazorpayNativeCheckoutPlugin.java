package com.hobsfoundation.companion;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.razorpay.Checkout;
import org.json.JSONObject;

// Real fix, Aug 29, 2026: replaces the web-based checkout.js flow for in-app payments (donations,
// session payments, cancellation charges) with Razorpay's actual native Android SDK. The
// underlying problem the web-based approach could never fully solve inside this app's own
// WebView: Checkout.open() here launches a genuinely separate native Activity that never touches
// this app's WebView or its running JS state at all -- unlike the web version, which (even with
// Razorpay's own WebView-specific redirect pattern) still meant navigating this app's own
// single-page WebView away from itself, leaving it out of sync with whatever was still visible
// on screen. Closing or completing the native checkout hands a clean result straight back to
// this plugin -- nothing to resync, because nothing was ever disturbed in the first place.
//
// donate.html is deliberately untouched and keeps using the web-based checkout.js approach --
// it runs in a real browser tab, which is the environment that approach was actually built for,
// and it was never the thing that was broken.
@CapacitorPlugin(name = "RazorpayNativeCheckout")
public class RazorpayNativeCheckoutPlugin extends Plugin {

  @PluginMethod
  public void open(PluginCall call) {
    String key = call.getString("key");
    String orderId = call.getString("order_id");
    Integer amount = call.getInt("amount");
    if (key == null || orderId == null || amount == null) {
      call.reject("key, order_id, and amount are required");
      return;
    }

    try {
      JSONObject options = new JSONObject();
      options.put("key", key);
      options.put("amount", amount);
      options.put("currency", call.getString("currency", "INR"));
      options.put("order_id", orderId);
      options.put("name", "Home of Beautiful Souls Foundation");
      String description = call.getString("description");
      if (description != null) options.put("description", description);

      JSObject prefill = call.getObject("prefill");
      if (prefill != null) {
        JSONObject prefillJson = new JSONObject();
        String email = prefill.getString("email");
        String name = prefill.getString("name");
        if (email != null) prefillJson.put("email", email);
        if (name != null) prefillJson.put("name", name);
        options.put("prefill", prefillJson);
      }

      JSONObject theme = new JSONObject();
      theme.put("color", "#6690D6");
      options.put("theme", theme);

      // Kept as a normal, resolvable outcome for cancel/failure (not a rejected promise) --
      // dismissing a payment sheet is an ordinary thing a person does, not an application error.
      bridge.saveCall(call);
      MainActivity.setPendingPaymentCallbackId(call.getCallbackId());

      Checkout checkout = new Checkout();
      checkout.setKeyID(key);
      checkout.open(getActivity(), options);
    } catch (Exception e) {
      call.reject("Could not start payment: " + e.getMessage());
    }
  }

  public void resolvePaymentSuccess(String callbackId, String paymentId, String orderId, String signature) {
    PluginCall savedCall = bridge.getSavedCall(callbackId);
    if (savedCall == null) return;
    JSObject result = new JSObject();
    result.put("success", true);
    result.put("razorpay_payment_id", paymentId);
    result.put("razorpay_order_id", orderId != null ? orderId : "");
    result.put("razorpay_signature", signature != null ? signature : "");
    savedCall.resolve(result);
    bridge.releaseCall(savedCall);
  }

  public void resolvePaymentError(String callbackId, int code, String description) {
    PluginCall savedCall = bridge.getSavedCall(callbackId);
    if (savedCall == null) return;
    JSObject result = new JSObject();
    result.put("success", false);
    result.put("code", code);
    result.put("description", description != null ? description : "");
    savedCall.resolve(result);
    bridge.releaseCall(savedCall);
  }
}
