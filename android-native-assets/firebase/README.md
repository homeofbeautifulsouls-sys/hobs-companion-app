# google-services.json

Firebase config for push notifications (project: hobs-companion).

Real gap found August 22, 2026: this had never been saved to the persistent repo either, the
same pattern as AndroidManifest.xml, package.json, and the signing keystore. Unlike the
keystore, this one wasn't a true crisis if lost -- it's re-downloadable anytime from the
Firebase Console (Project Settings -> your Android app -> google-services.json) -- but there's
no reason to rely on that when it's this easy to just keep a copy here.

On every Android rebuild, copy this file to android/app/google-services.json.
