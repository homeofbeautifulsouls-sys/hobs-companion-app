import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hobsfoundation.companion.staging',
  appName: 'HOBS Companion (Staging)',
  webDir: 'www',
  // Deliberately no `server: { url: ... }` here. The whole point of this change is that the
  // app's UI is bundled locally and loads instantly regardless of any remote host's status --
  // the previous setup pointed this at GitHub Pages, which is exactly the single point of
  // failure being removed. Dynamic data still goes over the network to Supabase; the UI itself
  // does not depend on any server being reachable just to open.
  android: {
    allowMixedContent: false,
  },
  // Real fix, Aug 27, 2026: an earlier allowNavigation attempt for razorpay.com alone was
  // reverted after Capacitor's real default behavior turned out to be the opposite of what was
  // assumed (external URLs are auto-opened in the real browser by default; allowNavigation
  // traps a domain inside the WebView instead of letting that happen). That revert alone didn't
  // fix payment either, because the actual root cause was Razorpay's checkout itself being
  // designed for a real browser tab, not an embedded WebView -- see their own documented WebView
  // integration guidance. The real fix switches to their WebView-specific callback_url/redirect
  // pattern (see openDonateModal in index.html and razorpay-payment-callback), and *that*
  // pattern genuinely does need both domains listed here: razorpay.com so the checkout process
  // itself can render inside the WebView rather than kicking out to an external browser
  // mid-flow, and the app's own domain so the final redirect back after payment also stays
  // in-app instead of also kicking out externally at that last step.
  server: {
    allowNavigation: ['*.razorpay.com', 'app.homeofbeautifulsouls.com'],
  },
  plugins: {
    // Real architectural fix, replacing many rounds of patching individual visible glitches:
    // rather than letting the native splash disappear automatically the moment the WebView
    // first paints (which always leaves some window, however small, where a genuinely
    // incomplete or transitional state can be visible), this holds it open until the app's own
    // JS explicitly calls SplashScreen.hide() -- only once the boot decision is fully made and
    // the images the very first visible screen needs are confirmed loaded. This guarantees
    // there is nothing to see in between; the splash simply gives way directly to the final,
    // correct, fully-ready screen.
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
