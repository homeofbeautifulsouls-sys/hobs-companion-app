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
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
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
