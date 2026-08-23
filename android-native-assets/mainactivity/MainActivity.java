package com.hobsfoundation.companion;

import android.os.Bundle;
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
  }
}
