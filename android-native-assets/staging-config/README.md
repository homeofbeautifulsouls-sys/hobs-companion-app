# Staging build config (added Aug 26, 2026, after shipping the alarm feature straight to
production and it crashed there -- should have used this the first time)

Real, live staging environment that already existed and should always be used before any
production Android release, especially anything touching native code: `deployment_process`
going forward is staging first, Akash tests on his real device (installs side-by-side with
production, doesn't conflict), only then production.

- Staging site + APK: `https://staging-app.homeofbeautifulsouls.com`
- Staging Supabase project: `ivqlqrpcamoshmgibjph` -- fully separate data from production
- Staging Android package: `com.hobsfoundation.companion.staging` (distinct from production's
  `com.hobsfoundation.companion` -- installs as a completely separate app)

## Files here

- `index.html` -- same app, `SUPABASE_URL`/`SUPABASE_KEY` swapped to the staging project's
  values, and `REMOTE_VERSION_CHECK_URL`/`APK_DOWNLOAD_URL` pointed at the staging site instead
  of production. Everything else identical to the real `index.html` at the repo root -- keep
  these in sync manually (diff against the root `index.html` before every staging build) since
  there's no build-time templating for this swap currently.
- `app-build-staging.gradle` -- same as `android-native-assets/build-config/app-build.gradle`
  but `namespace`/`applicationId` set to the `.staging` suffix.
- `capacitor.config.ts` -- same as `android-native-assets/capacitor-config/capacitor.config.ts`
  but `appId` set to the `.staging` suffix and `appName` labeled "(Staging)" so it's visually
  distinguishable from production on the home screen.
- `AndroidManifest-staging.xml` -- whatever the current experimental native feature under test
  needs (as of this writing: the alarm feature's activity/receivers/permissions from
  `android-native-assets/alarm-feature/`). Update this alongside the production manifest when a
  new native feature is being tested, not after.

## Building a staging APK, from a completely fresh environment

Same as the production recipe in `docs/MASTER.md`, with these differences:
1. Use this directory's `capacitor.config.ts` instead of the production one.
2. Use this directory's `index.html` for `www/index.html` instead of the repo root's.
3. Use this directory's `app-build-staging.gradle` as `android/app/build.gradle`.
4. Use this directory's `AndroidManifest-staging.xml` as the manifest.
5. Copy any experimental native `.java` files into
   `android/app/src/main/java/com/hobsfoundation/companion/staging/` (note the extra `staging`
   path segment Capacitor generates from the `.staging` appId) -- **and fix each file's own
   `package` declaration to `com.hobsfoundation.companion.staging`**, since copying a file into a
   differently-named directory does not change what it declares itself to be; a mismatch here is
   a genuine compile error, not a silent bug.
6. **Copy `google-services.json` in, same as production.** This is stale as of Sept 27-28, 2026
   and was wrong in a real build (`docs/BUG_LOG.md` -- staging build broke on a fresh environment
   because this step was skipped per this file's old instruction): a second Firebase Android app
   for `com.hobsfoundation.companion.staging` was registered in the tracked
   `android-native-assets/firebase/google-services.json` on Sept 20, 2026 for genuine push-notification
   parity with production, and `app-build-staging.gradle` no longer has any guard -- it now
   unconditionally requires the file and throws a `GradleException` if it's missing (same real
   crash-on-launch safety net production's gradle file has, added the same day). Confirm directly
   in the gradle file before trusting this doc again: `grep -A5 "servicesJSON" app-build-staging.gradle`.
7. Deploy with the same Hostinger MCP mechanism `deployment/deploy-to-hostinger.sh` uses, pointed
   at `staging-app.homeofbeautifulsouls.com` instead -- the script's own file list is
   production-filename-specific (`HOBS-Companion.apk`, `HOBS-Companion-v*.apk`), so either invoke
   the same underlying MCP call directly for a one-off staging deploy (as was done here), or
   extend the script with a `--staging` mode if this becomes routine enough to warrant it.

## Update, Sept 20-28 2026: both limitations below are resolved -- kept for history only

**Push notifications**: resolved Sept 20, 2026. A real second Firebase Android app was
registered for `com.hobsfoundation.companion.staging` in the tracked `google-services.json`, and
staging's gradle file was brought to parity with production's (unconditional require, loud
failure if missing -- see step 6 above). The BUG_LOG #70 crash-on-launch this section used to warn
about was real, but was about the plugin being compiled in with *no* config at all, not about
staging having its own config -- that's fixed now, don't re-remove
`@capacitor/push-notifications` from staging's `package.json` based on this old text.

**Scheme collision**: resolved Sept 27, 2026 (`docs/BUG_LOG.md` #109). Staging now uses its own
distinct scheme, `hobscompanionstaging://callback` (not `hobscompanion://callback`), registered
in `AndroidManifest-staging.xml` and matched in this directory's `index.html` /
`NATIVE_CALLBACK_URL`. Both apps can be installed side by side safely now; no Google Cloud
Console changes were needed since the shared `redirect_uri` is still the production website
either way (see `docs/BUG_LOG.md` #108-109 for the full mechanism -- an origin-prefixed `state`
param tells the site which app/scheme to hop back to).
