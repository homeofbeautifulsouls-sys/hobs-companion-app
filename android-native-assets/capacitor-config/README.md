# capacitor.config.ts

Never persisted before -- following the same pattern as every other native asset gap found this
session, saving this now, proactively, rather than after it's lost.

Contains the real architectural fix for the "split-second flash on open" issue: launchAutoHide
is set to false, holding the native splash screen open until the app's own JS explicitly calls
SplashScreen.hide() -- only once the boot decision is fully made and the images the first
visible screen needs are confirmed loaded (see hideNativeSplashWhenReady() in index.html).

On every Android rebuild, copy this file to the project root as capacitor.config.ts before
running npx cap sync.
