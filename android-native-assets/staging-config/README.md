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
6. **Do not copy `google-services.json`** into this build -- it's registered against the
   production package name only, and `app-build-staging.gradle`'s conditional guard skips the
   Google Services plugin entirely when that file is absent (confirmed: this is the actual,
   correct way to disable it, not a workaround). This means push notifications won't work in a
   staging build until/unless a second Firebase Android app is registered for the staging
   package -- not needed for testing anything that doesn't depend on push.
7. Deploy with the same Hostinger MCP mechanism `deployment/deploy-to-hostinger.sh` uses, pointed
   at `staging-app.homeofbeautifulsouls.com` instead -- the script's own file list is
   production-filename-specific (`HOBS-Companion.apk`, `HOBS-Companion-v*.apk`), so either invoke
   the same underlying MCP call directly for a one-off staging deploy (as was done here), or
   extend the script with a `--staging` mode if this becomes routine enough to warrant it.

## The one real, known limitation of this staging setup

**Push notifications never work on a staging build** -- `google-services.json` is registered
against the production package name only, and including it for a mismatched staging package fails
the build outright. Beyond that: leave `@capacitor/push-notifications` entirely out of the
staging build's own `package.json` (do not just omit the config file and keep the plugin) --
Firebase auto-initializes at app launch by default, and a staging build with the plugin's
Firebase-dependent code compiled in but no valid config for it to read crashed the app
immediately on open (real incident, confirmed via the compiled `.dex`, see BUG_LOG #70). Removing
the plugin from the dependency list itself, not just skipping the config file, is what actually
fixes this -- confirmed by checking the resulting `.dex` has zero Firebase-related classes at all.

The Google Sign-In custom URL scheme (`hobscompanion://callback`) is currently identical between
production and staging. With both apps installed on the same device, Android's handling of two
apps claiming the same custom scheme is untested and could misroute. Not fixed yet since it
wasn't relevant to the alarm feature test this was built for -- email/password login is
unaffected either way. Worth a distinct scheme (e.g. `hobscompanionstaging://callback`) plus a
matching Google Cloud Console redirect URI registration before Google Sign-In is something that
needs testing on staging specifically.
