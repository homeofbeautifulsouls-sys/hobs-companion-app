# AndroidManifest.xml

This is the real, customized manifest -- NOT the default one Capacitor's tooling generates.

Critical, easy-to-lose fix baked in here: registers `hobscompanion://callback` as a deep link
(intent-filter with scheme=hobscompanion, host=callback). Without this, Google sign-in (and
anything else redirecting to this custom scheme) silently fails on native -- Android has no app
registered to receive it, so the user gets stranded with no way back into the app. This bug went
unnoticed across multiple previous APK builds specifically because this file was never saved here
before, so every rebuild silently regenerated a manifest missing this registration.

On every Android rebuild, this file MUST be copied to
`android/app/src/main/AndroidManifest.xml`, overwriting whatever Capacitor's own tooling put
there -- do not skip this step or trust the default output.
