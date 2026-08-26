import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hobsfoundation.companion',
  appName: 'HOBS Companion',
  webDir: 'www',
  // Deliberately no `server: { url: ... }` here. The whole point of this change is that the
  // app's UI is bundled locally and loads instantly regardless of any remote host's status --
  // the previous setup pointed this at GitHub Pages, which is exactly the single point of
  // failure being removed. Dynamic data still goes over the network to Supabase; the UI itself
  // does not depend on any server being reachable just to open.
  android: {
    allowMixedContent: false,
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
