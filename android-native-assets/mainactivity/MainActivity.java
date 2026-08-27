package com.hobsfoundation.companion;

import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

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
  }
}
