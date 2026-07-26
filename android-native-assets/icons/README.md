# HOBS Companion App Icon — Persistent Assets

## Why this folder exists
The native Android build environment is fully ephemeral — every session that builds a new APK
starts from `npx cap add android`, which scaffolds a completely fresh Android project and
regenerates Capacitor's *default* icon. Custom native files (MainActivity.java, AndroidManifest.xml,
etc.) get overlaid back on top from documented sources each time, but the app icon was never on
that list until now — so every rebuild was silently reverting to the generic default icon, even
though it had been correctly set in an earlier session. This folder is the fix: a permanent,
version-controlled copy of the real icon, so any future session can restore it in one step.

## How to reapply these in a fresh build
After `npx cap add android` and before running the build, copy these files into place:

```
cp android-native-assets/icons/mipmap-mdpi/*.png    android/app/src/main/res/mipmap-mdpi/
cp android-native-assets/icons/mipmap-hdpi/*.png    android/app/src/main/res/mipmap-hdpi/
cp android-native-assets/icons/mipmap-xhdpi/*.png   android/app/src/main/res/mipmap-xhdpi/
cp android-native-assets/icons/mipmap-xxhdpi/*.png  android/app/src/main/res/mipmap-xxhdpi/
cp android-native-assets/icons/mipmap-xxxhdpi/*.png android/app/src/main/res/mipmap-xxxhdpi/
cp android-native-assets/icons/ic_launcher_background.xml android/app/src/main/res/values/
```

This should be added to the same "overlay these custom files after scaffolding" step used for
MainActivity.java, AndroidManifest.xml, styles.xml, variables.gradle, and the two build.gradle
files — treat it as one more required file in that list, not a separate one-off step.

## What's in each file
- `mipmap-{density}/ic_launcher.png` and `ic_launcher_round.png` — legacy pre-Android-8 icons,
  a plain square crop of Bob (the elephant mascot) at 48/72/96/144/192px.
- `mipmap-{density}/ic_launcher_foreground.png` — the adaptive-icon (Android 8+) foreground
  layer, 108/162/216/324/432px canvases with the same Bob crop scaled to 78% and centered with
  transparent padding, so the face stays inside the safe zone regardless of which mask shape
  (circle/squircle/rounded square) a given launcher applies.
- `ic_launcher_background.xml` — the adaptive-icon background color, `#82BCD9`, sampled directly
  from the sky in the source image rather than left as Capacitor's default white.
- `SOURCE_master_icon_crop.png` — the 780x780 square crop of the full character illustration
  this was all generated from. If the icon ever needs regenerating at different crop/zoom, start
  from this file (or from the full original character illustration if an even earlier stage is
  needed) rather than re-cropping from scratch.

## Verification, if redoing this in a new session
Don't just trust that the files copied — AAPT2 renames every resource to a short obfuscated
filename in a release build, so `find` won't locate `ic_launcher.png` by name inside a built APK.
Verify with `aapt dump badging` (shows the actual `application-icon` path) and
`aapt dump --values resources` (resolves that path's resource ID to its real packaged filename
and, for the background, its actual compiled color value) — cross-check the compiled background
color matches `#ff82bcd9` and that the foreground PNG's alpha channel has real transparent
padding (a solid full-bleed alpha channel would mean the old default snuck back in).
