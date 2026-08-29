package com.hobsfoundation.companion;

import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.WebViewListener;
import com.razorpay.PaymentData;
import com.razorpay.PaymentResultWithDataListener;

// Real gotcha, documented directly in Razorpay's own Android integration guide: declaring this
// TAG constant is required to work around a real compile error ("'TAG' has private access in
// 'androidx.fragment.app.FragmentActivity'") that surfaces specifically because
// PaymentResultWithDataListener's default methods reference a TAG field, and
// Capacitor's BridgeActivity extends FragmentActivity, which already declares its own private
// one. Following their documented workaround exactly rather than guessing at a fix for this.
public class MainActivity extends BridgeActivity implements PaymentResultWithDataListener {
  private static final String TAG = MainActivity.class.getSimpleName();

  // Real fix, Aug 29, 2026: Razorpay's SDK requires the callback interface to be implemented by
  // the Activity itself (Checkout.open(activity, options) delivers results to whichever Activity
  // it was given) -- but the actual pending JS call lives on the plugin object, a separate
  // instance. This is the bridge between the two: the plugin remembers which call is waiting via
  // its callback ID just before opening checkout, and this Activity looks the plugin back up to
  // resolve that exact call once Razorpay's own callback fires.
  private static String pendingPaymentCallbackId = null;
  public static void setPendingPaymentCallbackId(String callbackId) {
    pendingPaymentCallbackId = callbackId;
  }

  @Override
  public void onPaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
    RazorpayNativeCheckoutPlugin plugin = getRazorpayPlugin();
    if (plugin != null && pendingPaymentCallbackId != null) {
      plugin.resolvePaymentSuccess(pendingPaymentCallbackId, razorpayPaymentId, paymentData.getOrderId(), paymentData.getSignature());
      pendingPaymentCallbackId = null;
    }
  }

  @Override
  public void onPaymentError(int code, String description, PaymentData paymentData) {
    RazorpayNativeCheckoutPlugin plugin = getRazorpayPlugin();
    if (plugin != null && pendingPaymentCallbackId != null) {
      plugin.resolvePaymentError(pendingPaymentCallbackId, code, description);
      pendingPaymentCallbackId = null;
    }
  }

  private RazorpayNativeCheckoutPlugin getRazorpayPlugin() {
    PluginHandle handle = getBridge().getPlugin("RazorpayNativeCheckout");
    if (handle == null) return null;
    return (RazorpayNativeCheckoutPlugin) handle.getInstance();
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Real fix, following Capacitor's own documented pattern for custom plugins: must be
    // registered before super.onCreate().
    registerPlugin(RazorpayNativeCheckoutPlugin.class);
    super.onCreate(savedInstanceState);
    // Real fix: the app's own CSS already declares color-scheme: light only, but that alone
    // isn't always reliably respected by Android's native WebView-level "Force Dark" /
    // algorithmic darkening across all Android versions -- this explicitly, natively disables
    // it, which is the robust, guaranteed way to stop the WebView from ever inverting the
    // page's colors (cream background -> black, dark text -> pale gold) regardless of the
    // device's own dark-mode setting or Android version quirks in how well it honors the CSS
    // declaration alone.
    WebSettings settings = getBridge().getWebView().getSettings();
    if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
      WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false);
    }

    // Real fix, Aug 27, 2026, following Razorpay's own documented WebView integration
    // requirements: their checkout depends on cookies (for features like saved cards, and
    // plausibly for basic session/state handling during the checkout flow itself) -- without
    // this, their docs indicate the checkout can fail to work correctly in an embedded WebView.
    // minSdkVersion is 24, already above the LOLLIPOP (API 21) branch below, but keeping both
    // branches exactly as Razorpay's own docs show them rather than "simplifying" away a branch
    // that will never run on this app's actual minimum version -- safer to match their exact
    // documented guidance precisely on something this hard to verify without a real device.
    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.setAcceptCookie(true);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
    }

    // Real fix, Aug 29, 2026: this app targets SDK 36, which means Android itself mandates
    // edge-to-edge display -- there is no opting out. The app's own pages already correctly
    // handle this via CSS (env(safe-area-inset-bottom), used throughout the whole file), which
    // is exactly why only Razorpay's checkout page had its buttons overlapping the system
    // navigation bar: their page has no reason to know about or use that CSS, since it wasn't
    // built with this app's specific edge-to-edge setup in mind.
    //
    // Deliberately NOT a blanket fix (native padding applied unconditionally) -- the app's own
    // pages already reserve this space correctly via CSS, so adding native padding on top of
    // that for every page would double the spacing and visibly break the app's own carefully
    // tuned layouts, which is a real, worse regression than the bug being fixed. Deliberately
    // NOT CSS injection into Razorpay's own page either -- their exact DOM structure isn't
    // something that can be verified from here, and guessing at selectors risks a fix that
    // silently does nothing, or worse, unintended styling side effects on a real payment page.
    //
    // Instead: a real, official, non-intrusive Capacitor extension point --
    // Bridge.addWebViewListener -- fires on every page load without replacing or risking
    // Capacitor's own WebViewClient (which is what actually runs the JS bridge every other
    // feature in this app depends on). Padding is applied directly to the native WebView itself
    // (not CSS), which uniformly pushes everything on that specific page up, including
    // fixed-position elements CSS padding alone wouldn't reach -- and is explicitly reset to
    // zero the moment we're back on this app's own content, so our own pages are never touched
    // by this at all.
    getBridge().addWebViewListener(new WebViewListener() {
      @Override
      public void onPageLoaded(WebView webView) {
        String url = webView.getUrl();
        boolean isRazorpayPage = url != null && url.contains("razorpay.com");
        int bottomPadding = 0;
        if (isRazorpayPage) {
          WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(webView);
          if (insets != null) {
            bottomPadding = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
          }
        }
        webView.setPadding(webView.getPaddingLeft(), webView.getPaddingTop(), webView.getPaddingRight(), bottomPadding);
      }
    });
  }
}
