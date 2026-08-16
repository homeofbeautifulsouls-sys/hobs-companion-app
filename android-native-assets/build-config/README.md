# package.json / package-lock.json

The real, persistent record of which Capacitor plugins this Android build actually needs.

Real bug this fixes: this file had never been saved to the repo before -- it only ever existed
in the ephemeral build environment. Every plugin this project uses (including ones that already
worked -- app, browser, push-notifications) was at risk of being silently lost if a future
session ever rebuilt hobs-android-build from scratch using only the officially persisted
android-native-assets folder, since there was no persisted record of which plugins to install.

Confirmed via a real, live bug: @capacitor/filesystem and @capacitor/share were needed by
index.html's shareImageFromCanvas() function (written assuming they existed) but were never
actually installed -- causing every native "share as image" attempt to silently fail with
"Couldn't share the image on this device right now."

On every Android rebuild: copy this package.json into hobs-android-build/, run `npm install`,
then `npx cap sync android` to regenerate the native plugin registration -- do not skip this or
assume the ephemeral environment already has the right plugins installed.
