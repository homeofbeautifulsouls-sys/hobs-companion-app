# hobs-release.keystore

**THE MOST CRITICAL FILE IN THIS ENTIRE REPO. Read this before touching it.**

## Real incident, August 22, 2026
The original signing keystore was never saved here -- it only ever existed in the ephemeral
build environment, across many sessions, without anyone catching it. A sandbox reset wiped it
permanently, with no recovery path found anywhere (not in git history, not in Supabase Storage,
not in any handoff document). This forced every user with the app already installed (at the
time, just Akash's own test devices) to fully uninstall and reinstall to get back on a working
signing key -- a real, avoidable cost that only happened because this file was never persisted.

This is the keystore generated to replace it. **This file must never be lost again.**

## Credentials
- storePass: `hobsbeta2026`
- alias: `hobs`
- keyPass: `hobsbeta2026`

## Fingerprint (for verifying any future build genuinely used this exact key)
- SHA1: `31:59:A0:9C:5F:6F:71:D1:8A:E2:61:4B:B0:64:A6:30:FA:32:BA:95`
- SHA256: `A7:7B:0F:8B:EC:F8:D3:FB:1C:9D:F7:1E:95:5F:77:6D:48:00:2F:8F:77:06:34:C1:BC:AA:EE:5B:A4:8C:3A:65`

## Rule, permanent, no exceptions
On every Android rebuild, this exact file must be copied to
`android/app/hobs-release.keystore` before signing -- never generate a new one, never assume
the ephemeral build environment already has it. Before shipping any APK, verify its actual
signing fingerprint matches the one above (`apksigner verify --print-certs`) -- don't just
trust that the right file was used.

Google Play's own "Play App Signing" feature, once the app is uploaded to Play Console for the
first time, will let Google manage signing going forward and removes this exact risk for any
future key loss -- worth completing that setup once the developer account itself is ready,
specifically so a repeat of this incident becomes structurally impossible, not just avoided by
discipline.
