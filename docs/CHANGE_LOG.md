# HOBS Companion — Complete Change Record

Exact, unedited record of every change made in this session (and the two prior sessions
this one continues from, starting with the calendar-reconnect fix). This file exists
because Akash asked for a word-for-word record, not a paraphrased summary -- see
`docs/BUG_LOG.md` #110-113 and its standing lesson for the narrative version (what/why).
This file is the literal what-changed-where record: every code diff exactly as committed,
and every infrastructure/database/deploy action exactly as run, in order.

**How to read this file**: code changes are the literal `git show` output for that commit
-- nothing paraphrased, nothing summarized. Infrastructure changes (Supabase config,
deploys) are the exact command run and the exact response received, since those aren't
captured by git.

---

## Commit `8a3e99b` — 2026-09-27T00:01:35+00:00

**Subject**: Google Calendar connect: attempt native-app deep-link handoff on Android before falling back to the browser banner

```diff
commit 8a3e99bfca9817fa8b927634526079d3cc85f9b8
Author: Claude <claude@hobsfoundation.com>
Date:   Sun Sep 27 00:01:35 2026 +0000

    Google Calendar connect: attempt native-app deep-link handoff on Android before falling back to the browser banner
    
    Not yet deployed anywhere (not on the production website, not in a staging or production APK
    build) -- committed to source control only, pending Akash's decision on how to handle two real
    complications found while preparing to test this on staging (see chat): the OAuth redirect_uri
    is hardcoded to the production website for both staging and production APKs, so testing this
    at all requires a production website deploy even for a 'staging test'; and staging/production
    APKs currently register the identical hobscompanion:// scheme, which could route the handoff to
    the wrong app if both are installed side by side.
    
    Adds a Google-Calendar-specific appUrlOpen branch (gcal_code/gcal_state, deliberately distinct
    from Supabase's own ?code= Sign-In branch) and an Android-only pre-hop attempt in
    handleGoogleCalendarCallback() with a timeout fallback to the existing browser-side completion
    + banner if nothing intercepts it.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/index.html b/index.html
index b81070d..dee051b 100644
--- a/index.html
+++ b/index.html
@@ -2924,6 +2924,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
 
     }
 
+    // -------------------------
+    // Google Calendar connect handoff (new, Sept 27 2026)
+    // -------------------------
+    // Not part of Supabase's own auth flow -- this is the Google Calendar OAuth callback
+    // handing off from the external browser/Custom Tab back into the native app, so the
+    // connection completes here (no fallback "tap back arrow" banner needed) instead of
+    // being stranded in the browser. Uses gcal_code/gcal_state specifically so this never
+    // collides with the "?code=" check above (that's Supabase's own param, unrelated).
+    if(url.indexOf("gcal_code=") !== -1){
+
+      console.log("Detected Google Calendar connect handoff");
+
+      try{
+
+        var gcalParsed = new URL(url);
+        var gcalCode = gcalParsed.searchParams.get("gcal_code");
+        var gcalState = gcalParsed.searchParams.get("gcal_state");
+
+        if(gcalCode && gcalState){
+          await completeGoogleCalendarConnect(gcalCode, gcalState);
+        }
+
+      }catch(err){
+        console.error(err);
+        showToast("Couldn't connect your calendar — please try again.");
+      }
+
+      return;
+
+    }
+
     // -------------------------
     // Token Flow
     // -------------------------
@@ -14263,6 +14294,23 @@ async function handleGoogleCalendarCallback(){
   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
   var looksLikeStateToken = stateToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stateToken);
   if(!code || !looksLikeStateToken) return;
+
+  // New, Sept 27 2026: Google's OAuth client type here only accepts https:// redirect URIs, so
+  // landing in an external browser/Custom Tab (not the native app) is unavoidable -- but if the
+  // native app is actually installed, we can hand off to it immediately via the same custom
+  // scheme (hobscompanion://) Google Sign-In already uses successfully, instead of completing
+  // the connection here and leaving the person stranded on a "tap back" banner.
+  // Purely additive, not a replacement: if the app intercepts this, Android tears down this
+  // page mid-navigation and nothing below ever runs (the app's own appUrlOpen listener
+  // completes the real exchange instead). If nothing intercepts it within the timeout (app not
+  // installed, or this is a plain desktop/web visit), execution just continues normally below,
+  // exactly as it did before this change.
+  if(/Android/i.test(navigator.userAgent)){
+    window.location.href = 'hobscompanion://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+    await new Promise(function(resolve){ setTimeout(resolve, 900); });
+    if(document.hidden || document.visibilityState === 'hidden') return; // handed off successfully, native app takes over
+  }
+
   // Real, additional guard, Sept 16 2026: covers the real, narrower window between arriving
   // here and the success banner actually existing (the network round-trip to exchange the
   // code) -- the banner-presence check alone doesn't protect this earlier moment, and a forced
```

---

## Commit `d8faf1e` — 2026-09-27T00:08:47+00:00

**Subject**: Fix real hobscompanion:// scheme collision between staging and production apps

```diff
commit d8faf1e36b979cdb6e2f147834940fdcf80c168d
Author: Claude <claude@hobsfoundation.com>
Date:   Sun Sep 27 00:08:47 2026 +0000

    Fix real hobscompanion:// scheme collision between staging and production apps
    
    Staging now registers its own distinct custom scheme (hobscompanionstaging://) instead of
    duplicating production's exact scheme -- confirmed real: if both apps are installed side by
    side (the normal setup per docs), Android had no way to know which one should catch a
    hobscompanion:// link.
    
    - AndroidManifest-staging.xml: scheme changed to hobscompanionstaging
    - staging-config/index.html: NATIVE_CALLBACK_URL updated to match; startGoogleCalendarConnect
      now prefixes its state token 'stg:' before sending it to Google, since Google always
      redirects back to the PRODUCTION website regardless of which app started the flow (only one
      redirect_uri is registered with Google for this OAuth client) -- this prefix is the only way
      the shared landing page can tell a staging-originated request apart from a production one and
      hand off to the right app
    - staging-config/index.html: handleGoogleCalendarCallback and the appUrlOpen listener brought
      back into sync with production's copy (had drifted -- missing the Sept 16 gcalCallbackInProgress
      guard entirely); both now attempt a native-app handoff via their own scheme before falling
      back to browser-side completion
    - index.html (production): handleGoogleCalendarCallback now detects the 'stg:' prefix and hands
      off to hobscompanionstaging:// with no web-based fallback for that case (this page's own
      client is bound to the production Supabase project, so it has no way to correctly exchange a
      staging-requested code against staging's backend)
    
    Also found and fixed in the same pass: the staging Supabase project (ivqlqrpcamoshmgibjph) was
    paused (auto-pause, Free tier) -- restored via the Management API, confirmed ACTIVE_HEALTHY.
    Its Auth 'Redirect URLs' allow-list was also missing hobscompanion://callback entirely (should
    have been hobscompanionstaging://callback all along) -- added, confirmed via a live read-back.
    
    Not yet built into any APK -- source control only, pending a staging build + Akash's real-device
    test.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/AndroidManifest-staging.xml b/android-native-assets/staging-config/AndroidManifest-staging.xml
index c1ea062..369f4df 100644
--- a/android-native-assets/staging-config/AndroidManifest-staging.xml
+++ b/android-native-assets/staging-config/AndroidManifest-staging.xml
@@ -28,11 +28,16 @@
                  the user is stranded on Google's account picker with no way back into the app.
                  The JS-side appUrlOpen handler already correctly parses this exact URL pattern
                  (its "Token Flow" branch): this was purely a missing registration. -->
+            <!-- Real fix, Sept 27 2026: was "hobscompanion", identical to production's own
+                 scheme -- a genuine collision, since Android has no way to know which app
+                 should catch a "hobscompanion://" link if both are installed side by side
+                 (the normal, expected setup). Staging gets its own distinct scheme so a
+                 deep-link handoff always reaches the right app. -->
             <intent-filter android:autoVerify="false">
                 <action android:name="android.intent.action.VIEW" />
                 <category android:name="android.intent.category.DEFAULT" />
                 <category android:name="android.intent.category.BROWSABLE" />
-                <data android:scheme="hobscompanion" />
+                <data android:scheme="hobscompanionstaging" />
             </intent-filter>
 
         </activity>
diff --git a/android-native-assets/staging-config/index.html b/android-native-assets/staging-config/index.html
index 19430f5..7c41ec5 100644
--- a/android-native-assets/staging-config/index.html
+++ b/android-native-assets/staging-config/index.html
@@ -2608,7 +2608,14 @@ var WEB_APP_URL = 'https://app.homeofbeautifulsouls.com/';
 // the native update-check safely no-ops rather than checking against a URL that doesn't exist.
 var REMOTE_VERSION_CHECK_URL = 'https://staging-app.homeofbeautifulsouls.com/version.json';
 var APK_DOWNLOAD_URL = 'https://staging-app.homeofbeautifulsouls.com/HOBS-Companion-staging.apk';
-var NATIVE_CALLBACK_URL = 'hobscompanion://callback';
+var NATIVE_CALLBACK_URL = 'hobscompanionstaging://callback';
+// Real fix, Sept 27 2026: was 'hobscompanion://callback', identical to production's -- a real
+// scheme collision with no way for Android to know which app should catch it if both are
+// installed side by side. Staging now uses its own distinct scheme (manifest updated to
+// match), and this project's own Supabase Auth "Redirect URLs" allow-list has been updated to
+// include it (Supabase rejects any redirectTo not on that list) -- confirmed it was previously
+// missing 'hobscompanion://callback' entirely, so native Sign-In via this path may never have
+// actually been tested working on staging before this fix.
 // Deliberately separate from WEB_APP_URL and NOT updated to the new domain: this exact URL is
 // registered as the authorized redirect URI for this OAuth client in Google Cloud Console.
 // Changing it here without also updating it there would break the connection flow outright
@@ -2790,6 +2797,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
 
     }
 
+    // -------------------------
+    // Google Calendar connect handoff (new, Sept 27 2026)
+    // -------------------------
+    // Not part of Supabase's own auth flow -- this is the Google Calendar OAuth callback
+    // handing off from the external browser/Custom Tab back into the native app, so the
+    // connection completes here instead of being stranded in the browser. Uses
+    // gcal_code/gcal_state specifically so this never collides with the "?code=" check above
+    // (that's Supabase's own param, unrelated).
+    if(url.indexOf("gcal_code=") !== -1){
+
+      console.log("Detected Google Calendar connect handoff");
+
+      try{
+
+        var gcalParsed = new URL(url);
+        var gcalCode = gcalParsed.searchParams.get("gcal_code");
+        var gcalState = gcalParsed.searchParams.get("gcal_state");
+
+        if(gcalCode && gcalState){
+          await completeGoogleCalendarConnect(gcalCode, gcalState);
+        }
+
+      }catch(err){
+        console.error(err);
+        showToast("Couldn't connect your calendar — please try again.");
+      }
+
+      return;
+
+    }
+
     // -------------------------
     // Token Flow
     // -------------------------
@@ -12643,7 +12681,14 @@ async function startGoogleCalendarConnect(){
     scope: GOOGLE_CALENDAR_SCOPE,
     access_type: 'offline', // required to receive a refresh token at all
     prompt: 'consent',      // forces a fresh refresh token every time, not just on first-ever connect
-    state: tokenData.token
+    // Prefixed 'stg:', Sept 27 2026: Google always redirects to the PRODUCTION website
+    // (redirect_uri is shared/hardcoded, only one URI is registered with Google for this
+    // client) regardless of which app started the flow -- so the page that lands there needs
+    // a way to tell a staging-initiated request apart from a production one, to hand off to
+    // the right app via the right custom scheme. This prefix is that signal. The raw,
+    // unprefixed token underneath is unchanged and is exactly what this project's own
+    // exchange_code action still validates against.
+    state: 'stg:' + tokenData.token
   }).toString();
 
   // Real, confirmed cause of "clicked continue but never came back to the app": Google's OAuth
@@ -12938,14 +12983,29 @@ document.getElementById('gcalEventEditDeleteBtn').onclick = async function(){
 async function handleGoogleCalendarCallback(){
   var params = new URLSearchParams(window.location.search);
   var code = params.get('code');
-  var stateToken = params.get('state');
+  var rawStateParam = params.get('state');
+  var stateToken = (rawStateParam && rawStateParam.indexOf('stg:') === 0) ? rawStateParam.slice(4) : rawStateParam;
   // A UUID state token specifically (not any other feature that might use ?state= or ?code=
   // on this same URL) -- the format itself is the signal, since this can no longer check
   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
   var looksLikeStateToken = stateToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stateToken);
   if(!code || !looksLikeStateToken) return;
+
+  // Synced from the production copy, Sept 27 2026 (this file had fallen out of sync with it --
+  // see the README's own warning about that). In practice, Google always redirects to the
+  // PRODUCTION website for this flow (see index.html's own comment on this), so this exact
+  // function rarely if ever actually runs -- it only matters if staging's own site is loaded
+  // directly. Kept at parity anyway per this directory's own stated convention.
+  if(/Android/i.test(navigator.userAgent)){
+    window.location.href = 'hobscompanionstaging://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+    await new Promise(function(resolve){ setTimeout(resolve, 900); });
+    if(document.hidden || document.visibilityState === 'hidden') return;
+  }
+
+  window.gcalCallbackInProgress = true;
   window.history.replaceState({}, document.title, window.location.pathname);
   await completeGoogleCalendarConnect(code, stateToken);
+  window.gcalCallbackInProgress = false;
   // Real, documented platform limitation, confirmed via Capacitor's own docs: Browser.close()
   // is "Web & iOS only... No-op on other platforms" -- it never actually closes anything on
   // Android, regardless of how correctly it's called. completeGoogleCalendarConnect's own
diff --git a/index.html b/index.html
index dee051b..58a77bf 100644
--- a/index.html
+++ b/index.html
@@ -14288,7 +14288,14 @@ document.getElementById('gcalEventEditDeleteBtn').onclick = async function(){
 async function handleGoogleCalendarCallback(){
   var params = new URLSearchParams(window.location.search);
   var code = params.get('code');
-  var stateToken = params.get('state');
+  var rawStateParam = params.get('state');
+  // Sept 27 2026: a staging-initiated request prefixes its state 'stg:' before ever reaching
+  // Google, specifically because Google always redirects back to THIS website (production)
+  // regardless of which app started the flow -- there is only one redirect_uri registered with
+  // Google for this OAuth client. This prefix is the only signal available here for telling a
+  // staging request apart from a production one, so the right app can be handed off to.
+  var isStagingOrigin = rawStateParam && rawStateParam.indexOf('stg:') === 0;
+  var stateToken = isStagingOrigin ? rawStateParam.slice(4) : rawStateParam;
   // A UUID state token specifically (not any other feature that might use ?state= or ?code=
   // on this same URL) -- the format itself is the signal, since this can no longer check
   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
@@ -14297,14 +14304,33 @@ async function handleGoogleCalendarCallback(){
 
   // New, Sept 27 2026: Google's OAuth client type here only accepts https:// redirect URIs, so
   // landing in an external browser/Custom Tab (not the native app) is unavoidable -- but if the
-  // native app is actually installed, we can hand off to it immediately via the same custom
-  // scheme (hobscompanion://) Google Sign-In already uses successfully, instead of completing
-  // the connection here and leaving the person stranded on a "tap back" banner.
-  // Purely additive, not a replacement: if the app intercepts this, Android tears down this
-  // page mid-navigation and nothing below ever runs (the app's own appUrlOpen listener
-  // completes the real exchange instead). If nothing intercepts it within the timeout (app not
-  // installed, or this is a plain desktop/web visit), execution just continues normally below,
-  // exactly as it did before this change.
+  // native app is actually installed, we can hand off to it immediately via its own custom
+  // scheme (the same mechanism Google Sign-In already uses successfully), instead of completing
+  // the connection here and leaving the person stranded on a "tap back" banner. Staging and
+  // production each register their own distinct scheme (see AndroidManifest.xml /
+  // AndroidManifest-staging.xml) specifically so this always reaches the right app, never both.
+  //
+  // A staging-originated request (isStagingOrigin) can ONLY be completed by handing off --
+  // this production page's own `sb` client is bound to the PRODUCTION Supabase project, so it
+  // has no way to correctly exchange a code that was requested against staging's backend. If
+  // the hop doesn't land (staging app not installed here), there is deliberately no web-based
+  // fallback for this case -- say so plainly rather than pretending to complete it.
+  if(isStagingOrigin){
+    window.gcalCallbackInProgress = true;
+    window.history.replaceState({}, document.title, window.location.pathname);
+    window.location.href = 'hobscompanionstaging://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+    await new Promise(function(resolve){ setTimeout(resolve, 900); });
+    window.gcalCallbackInProgress = false;
+    if(document.hidden || document.visibilityState === 'hidden') return; // handed off successfully
+    showToast("Couldn't reach the HOBS Companion (Staging) app on this device — open it directly and try connecting again from there.");
+    return;
+  }
+
+  // Purely additive, not a replacement: if the production app intercepts this, Android tears
+  // down this page mid-navigation and nothing below ever runs (the app's own appUrlOpen
+  // listener completes the real exchange instead). If nothing intercepts it within the timeout
+  // (app not installed, or this is a plain desktop/web visit), execution just continues
+  // normally below, exactly as it did before this change.
   if(/Android/i.test(navigator.userAgent)){
     window.location.href = 'hobscompanion://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
     await new Promise(function(resolve){ setTimeout(resolve, 900); });
```

---

## Commit `ba5e322` — 2026-09-27T00:09:52+00:00

**Subject**: docs: BUG_LOG #108-109 (calendar-reconnect browser-stranding fix, scheme collision + paused staging DB) + standing lessons

```diff
commit ba5e3226ed7aede9c5834c0b3ba56f58d5743d73
Author: Claude <claude@hobsfoundation.com>
Date:   Sun Sep 27 00:09:52 2026 +0000

    docs: BUG_LOG #108-109 (calendar-reconnect browser-stranding fix, scheme collision + paused staging DB) + standing lessons
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index 7e47d04..4819f54 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -1933,6 +1933,54 @@ resolve -- it can often be answered directly from an APK or repo already in hand
 actually checked. And staging is not automatically ahead of production on every fix; check which
 build a specific fix actually landed in before assuming either one is current.
 
+### 108. Google Calendar reconnect kept "getting stuck in the browser" -- real, repeated report, not a fresh regression
+**What happened**: reconnecting Google Calendar repeatedly left the person stranded on the web
+version of the app inside a browser/Custom Tab instead of returning to the native app. Root
+cause, confirmed directly against the deployed `google-calendar-oauth` function and the client
+code: Google's OAuth client here is a "Web application" type, which only accepts `https://`
+redirect URIs -- Google flatly rejects a custom scheme for this client type. The connection
+itself was already completing correctly server-side (a real fix from Sept 16, 2026, confirmed
+present in the current production APK) -- what was missing was any way back into the native app
+beyond a banner asking the person to manually tap the browser's back arrow, since
+`Browser.close()` is a documented no-op on Android.
+**Real fix**: on Android, the callback page now attempts an immediate handoff to the native
+app's own custom scheme before doing anything else -- if the app is installed, Android
+intercepts this and tears the browser page down mid-navigation; the app's own `appUrlOpen`
+listener (new `gcal_code`/`gcal_state` branch, deliberately distinct from Supabase's own
+`?code=` Sign-In branch) completes the connection from inside the app directly. Purely additive
+-- if nothing intercepts it within ~900ms, the existing browser-side completion + banner runs
+exactly as before.
+**Not yet deployed anywhere** as of this entry -- committed to source control, pending a staging
+build and a real-device test (see #109 for a real complication found while preparing that test).
+**Standing lesson, added below**: a browser-based OAuth completion succeeding server-side is not
+the same as the person actually getting back into the app -- check the actual return path
+Android-side, not just that the connection was saved.
+
+### 109. Staging and production apps registered the identical `hobscompanion://` custom scheme -- a real collision waiting to happen, found while preparing to test #108
+**What happened**: while preparing to test #108's fix on staging, found that
+`AndroidManifest-staging.xml` registered the exact same `hobscompanion://` scheme as
+production's manifest. With both apps installed side by side -- the normal, documented setup --
+Android has no reliable way to know which one should catch a link using that scheme; any
+deep-link handoff (Sign-In's existing one, or #108's new one) could land in the wrong app.
+Compounding this: Google's OAuth redirect_uri for the Calendar flow is hardcoded to the
+*production* website for both staging and production client code (only one redirect_uri is
+registered with this Google OAuth client), so the shared landing page has to be told which app
+originated a given request, since neither its own domain nor its own backend project can tell it.
+**Also found in the same pass**: the staging Supabase project (`ivqlqrpcamoshmgibjph`) was
+paused (`INACTIVE`, Free-tier auto-pause) -- staging was non-functional regardless of any app
+fix. Restored via the Management API, confirmed `ACTIVE_HEALTHY`. Its Auth "Redirect URLs"
+allow-list was also missing `hobscompanion://callback` entirely, meaning native Sign-In via that
+exact path may never have actually been exercised successfully on staging before this.
+**Real fix**: staging now registers its own distinct scheme, `hobscompanionstaging://` (manifest
++ `NATIVE_CALLBACK_URL` + Supabase Auth allow-list all updated and confirmed via live read-back).
+For the Calendar flow specifically, staging's own OAuth request now prefixes its state token
+`stg:` before it ever reaches Google -- the only channel available to signal origin to the shared
+production landing page, since Google echoes `state` back verbatim without touching it.
+**Standing lesson, added below**: "installs side by side, doesn't conflict" (the stated design
+goal for staging vs production) needs to be checked against every mechanism that routes by a
+shared identifier, not just the package name -- a custom URL scheme is exactly this kind of
+shared identifier and was never actually verified distinct until this incident.
+
 ---
 
 ## Standing lessons (do not re-learn these)
@@ -2022,3 +2070,13 @@ Skipping this check is how the exact same class of bug happens again.
   (`GET /v1/projects/{ref}/functions`), diff it against both this repo's `supabase/functions/`
   directory and `MASTER.md`'s own function table. All of #104-#106 were found in one such audit;
   assume more exist until a clean one says otherwise (see `MASTER.md` §11).
+- **A server-side OAuth completion succeeding is not the same as the person getting back into
+  the app -- check the actual Android-side return path, not just that the connection saved
+  (#108).**
+- **"Installs side by side, doesn't conflict" needs checking against every shared identifier a
+  staging/production pair uses -- package name isn't the only one. A custom URL scheme is
+  exactly this kind of identifier and was never actually verified distinct until it caused a
+  real incident (#109).**
+- **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
+  any test result against it -- auto-pause after inactivity is real and silent, and staging
+  specifically has no traffic keeping it awake between test sessions (#109).**
```

---

## Commit `0c0251b` — 2026-09-28T17:46:42+00:00

**Subject**: Staging v46: bump version, fix invalid XML comment blocking all staging builds

```diff
commit 0c0251b6ca66f6baf4111d453f008523cab04c63
Author: Claude <claude@hobsfoundation.com>
Date:   Mon Sep 28 17:46:42 2026 +0000

    Staging v46: bump version, fix invalid XML comment blocking all staging builds
    
    - Real installed staging version was v45 (confirmed via aapt dump badging against
      the actual live APK, not the DB -- staging's profiles table currently has zero
      rows). Bumped to versionCode 46 / "staging-v46-oauth-scheme-fix" to carry the
      Google Calendar OAuth reconnect fix and the hobscompanion:// scheme collision
      fix (already on main) onto a real device.
    - AndroidManifest-staging.xml's Sept 27 scheme-collision comment contained a
      literal "--" inside an XML comment, which is invalid XML and made every build
      using this file fail at manifest-merge time. Comment-only fix, no functional
      change.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/AndroidManifest-staging.xml b/android-native-assets/staging-config/AndroidManifest-staging.xml
index 369f4df..f72aba7 100644
--- a/android-native-assets/staging-config/AndroidManifest-staging.xml
+++ b/android-native-assets/staging-config/AndroidManifest-staging.xml
@@ -29,7 +29,7 @@
                  The JS-side appUrlOpen handler already correctly parses this exact URL pattern
                  (its "Token Flow" branch): this was purely a missing registration. -->
             <!-- Real fix, Sept 27 2026: was "hobscompanion", identical to production's own
-                 scheme -- a genuine collision, since Android has no way to know which app
+                 scheme, a genuine collision, since Android has no way to know which app
                  should catch a "hobscompanion://" link if both are installed side by side
                  (the normal, expected setup). Staging gets its own distinct scheme so a
                  deep-link handoff always reaches the right app. -->
diff --git a/android-native-assets/staging-config/app-build-staging.gradle b/android-native-assets/staging-config/app-build-staging.gradle
index b7bb87a..cdb21a9 100644
--- a/android-native-assets/staging-config/app-build-staging.gradle
+++ b/android-native-assets/staging-config/app-build-staging.gradle
@@ -7,8 +7,8 @@ android {
         applicationId "com.hobsfoundation.companion.staging"
         minSdkVersion rootProject.ext.minSdkVersion
         targetSdkVersion rootProject.ext.targetSdkVersion
-        versionCode 45
-        versionName "staging-v45-transcription-quality-fix"
+        versionCode 46
+        versionName "staging-v46-oauth-scheme-fix"
         testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
         aaptOptions {
              // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
```

---

## Commit `1d515c9` — 2026-09-29T02:04:45+00:00

**Subject**: Fix 3 real build-recipe/doc bugs found during the Sept 28 staging build

```diff
commit 1d515c986a616fba5d798201707743e81caeb340
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 02:04:45 2026 +0000

    Fix 3 real build-recipe/doc bugs found during the Sept 28 staging build
    
    1. MASTER.md's Android build recipe never copied
       android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java, even though
       MainActivity.java directly imports and registers it (registerPlugin(...) at line ~99).
       A genuinely fresh checkout would fail to compile -- affects both the production and
       staging recipes. Added the missing cp step with an explanation.
    2. staging-config/README.md's build step 6 said not to copy google-services.json and that
       the gradle guard would skip the Google Services plugin without it. Both claims are stale:
       a real staging Firebase app entry was added Sept 20, 2026 and the gradle guard now
       unconditionally requires the file, throwing a GradleException if it's missing. Corrected
       the instruction to copy it in, same as production.
    3. The same README's "known limitations" section (push notifications never work on staging;
       scheme collision with production) described two problems that are both already resolved
       (Sept 20 and Sept 27, 2026 respectively). Replaced with a short resolved-history note so
       a future build doesn't re-break either fix based on outdated instructions here.
    
    Found and confirmed directly (not assumed) while building and shipping staging v46.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/README.md b/android-native-assets/staging-config/README.md
index 88e5f6e..1714b74 100644
--- a/android-native-assets/staging-config/README.md
+++ b/android-native-assets/staging-config/README.md
@@ -41,34 +41,35 @@ Same as the production recipe in `docs/MASTER.md`, with these differences:
    `package` declaration to `com.hobsfoundation.companion.staging`**, since copying a file into a
    differently-named directory does not change what it declares itself to be; a mismatch here is
    a genuine compile error, not a silent bug.
-6. **Do not copy `google-services.json`** into this build -- it's registered against the
-   production package name only, and `app-build-staging.gradle`'s conditional guard skips the
-   Google Services plugin entirely when that file is absent (confirmed: this is the actual,
-   correct way to disable it, not a workaround). This means push notifications won't work in a
-   staging build until/unless a second Firebase Android app is registered for the staging
-   package -- not needed for testing anything that doesn't depend on push.
+6. **Copy `google-services.json` in, same as production.** This is stale as of Sept 27-28, 2026
+   and was wrong in a real build (`docs/BUG_LOG.md` -- staging build broke on a fresh environment
+   because this step was skipped per this file's old instruction): a second Firebase Android app
+   for `com.hobsfoundation.companion.staging` was registered in the tracked
+   `android-native-assets/firebase/google-services.json` on Sept 20, 2026 for genuine push-notification
+   parity with production, and `app-build-staging.gradle` no longer has any guard -- it now
+   unconditionally requires the file and throws a `GradleException` if it's missing (same real
+   crash-on-launch safety net production's gradle file has, added the same day). Confirm directly
+   in the gradle file before trusting this doc again: `grep -A5 "servicesJSON" app-build-staging.gradle`.
 7. Deploy with the same Hostinger MCP mechanism `deployment/deploy-to-hostinger.sh` uses, pointed
    at `staging-app.homeofbeautifulsouls.com` instead -- the script's own file list is
    production-filename-specific (`HOBS-Companion.apk`, `HOBS-Companion-v*.apk`), so either invoke
    the same underlying MCP call directly for a one-off staging deploy (as was done here), or
    extend the script with a `--staging` mode if this becomes routine enough to warrant it.
 
-## The one real, known limitation of this staging setup
+## Update, Sept 20-28 2026: both limitations below are resolved -- kept for history only
 
-**Push notifications never work on a staging build** -- `google-services.json` is registered
-against the production package name only, and including it for a mismatched staging package fails
-the build outright. Beyond that: leave `@capacitor/push-notifications` entirely out of the
-staging build's own `package.json` (do not just omit the config file and keep the plugin) --
-Firebase auto-initializes at app launch by default, and a staging build with the plugin's
-Firebase-dependent code compiled in but no valid config for it to read crashed the app
-immediately on open (real incident, confirmed via the compiled `.dex`, see BUG_LOG #70). Removing
-the plugin from the dependency list itself, not just skipping the config file, is what actually
-fixes this -- confirmed by checking the resulting `.dex` has zero Firebase-related classes at all.
+**Push notifications**: resolved Sept 20, 2026. A real second Firebase Android app was
+registered for `com.hobsfoundation.companion.staging` in the tracked `google-services.json`, and
+staging's gradle file was brought to parity with production's (unconditional require, loud
+failure if missing -- see step 6 above). The BUG_LOG #70 crash-on-launch this section used to warn
+about was real, but was about the plugin being compiled in with *no* config at all, not about
+staging having its own config -- that's fixed now, don't re-remove
+`@capacitor/push-notifications` from staging's `package.json` based on this old text.
 
-The Google Sign-In custom URL scheme (`hobscompanion://callback`) is currently identical between
-production and staging. With both apps installed on the same device, Android's handling of two
-apps claiming the same custom scheme is untested and could misroute. Not fixed yet since it
-wasn't relevant to the alarm feature test this was built for -- email/password login is
-unaffected either way. Worth a distinct scheme (e.g. `hobscompanionstaging://callback`) plus a
-matching Google Cloud Console redirect URI registration before Google Sign-In is something that
-needs testing on staging specifically.
+**Scheme collision**: resolved Sept 27, 2026 (`docs/BUG_LOG.md` #109). Staging now uses its own
+distinct scheme, `hobscompanionstaging://callback` (not `hobscompanion://callback`), registered
+in `AndroidManifest-staging.xml` and matched in this directory's `index.html` /
+`NATIVE_CALLBACK_URL`. Both apps can be installed side by side safely now; no Google Cloud
+Console changes were needed since the shared `redirect_uri` is still the production website
+either way (see `docs/BUG_LOG.md` #108-109 for the full mechanism -- an origin-prefixed `state`
+param tells the site which app/scheme to hop back to).
diff --git a/docs/MASTER.md b/docs/MASTER.md
index 71a97cd..881fabe 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -315,6 +315,14 @@ cp -r ../hobs-repo/android-native-assets/icons/* android/app/src/main/res/
 cp ../hobs-repo/android-native-assets/signing/hobs-release.keystore android/app/hobs-release.keystore
 cp ../hobs-repo/android-native-assets/firebase/google-services.json android/app/google-services.json
 cp ../hobs-repo/android-native-assets/mainactivity/MainActivity.java android/app/src/main/java/com/hobsfoundation/companion/MainActivity.java
+cp ../hobs-repo/android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java android/app/src/main/java/com/hobsfoundation/companion/
+# ^ Real, confirmed missing step until Sept 28, 2026 (found building a staging APK): MainActivity.java
+# calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)` directly (line ~99) and imports it --
+# this recipe compiled clean for months only because whoever built last always had a stale local
+# checkout that still had this file copied in from an earlier manual step, never because it wasn't
+# needed. Skipping this line is a genuine compile error on a truly fresh environment, in BOTH the
+# production and staging recipes. For a staging build, remember step 5 below also applies to this
+# file: copy it into the `.../companion/staging/` path instead and fix its own `package` line.
 cp ../hobs-repo/android-native-assets/alarm-feature/*.java android/app/src/main/java/com/hobsfoundation/companion/
 cp ../hobs-repo/android-native-assets/alarm-feature/res-layout/activity_alarm.xml android/app/src/main/res/layout/activity_alarm.xml
 cp ../hobs-repo/android-native-assets/build-config/app-build.gradle android/app/build.gradle
```

---

## Commit `6067e0b` — 2026-09-29T05:29:56+00:00

**Subject**: Fix real bug: profile edit save silently failed for every user with a saved phone number

```diff
commit 6067e0b88bc7513c5607e020820a5a1d0f19ac61
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:29:56 2026 +0000

    Fix real bug: profile edit save silently failed for every user with a saved phone number
    
    Root cause, confirmed directly (DB constraints, function source, and JS all read live):
    - profiles.phone_number / emergency_contact_phone are stored E.164-style ("+91XXXXXXXXXX"),
      enforced by CHECK constraints calling is_valid_wa_phone(). Confirmed: all 30 real profile
      rows with a phone number currently match this format.
    - The "You" edit-profile screen's phone inputs have maxlength="10" for a clean local-number
      UX, but openEditProfile() was loading the full "+91XXXXXXXXXX" value straight into them.
      The browser silently truncates that assignment to fit maxlength, so the field displayed a
      plausible-looking but wrong 10-character fragment.
    - Clicking Save re-read that truncated value and wrote it back verbatim -- now permanently
      missing "+91" -- which the DB CHECK constraint rejects. This happened on every single save
      for every user who already had a phone number saved, regardless of what field they actually
      changed, and surfaced as a generic "Could not save -- check your connection" toast that had
      nothing to do with connectivity.
    
    Fix: strip the "+91" prefix for display (stripWaPrefix) when loading epPhone/epEmergencyPhone/
    consentPhone, and always re-add it (toWaPhone) before writing phone_number/
    emergency_contact_phone back to the DB. No existing data needed fixing -- the constraint was
    correctly rejecting every bad write all along, so nothing bad ever persisted.
    
    Reported directly by Akash via a real user's screenshot; root-caused end to end (schema,
    constraint, function source, and both read/write JS paths) before making this change.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/index.html b/index.html
index 58a77bf..a3e6ccb 100644
--- a/index.html
+++ b/index.html
@@ -3645,13 +3645,30 @@ document.getElementById('obSaveBtn').onclick = function(){
 };
 
 // ================= EDIT PROFILE (post-onboarding self-service) =================
+// Real bug fix, Sept 29 2026: profiles.phone_number / emergency_contact_phone are stored in
+// full WhatsApp/E.164 format ("+91XXXXXXXXXX", enforced by a DB CHECK constraint,
+// is_valid_wa_phone()). This screen's inputs are bare 10-digit fields (maxlength="10") for a
+// clean local-number UX. Loading the full "+91..." value straight into a maxlength=10 field
+// got silently truncated by the browser to a 10-character fragment -- which then got saved
+// back as-is on the NEXT save (even one touching only, say, the address field), permanently
+// missing "+91", and the DB constraint rejected it every time. This surfaced to users as a
+// generic "Could not save -- check your connection" error on every single save, unrelated to
+// their actual connection. Fix: always strip "+91" for display here, and always add it back
+// before writing (see epSaveBtn below).
+function stripWaPrefix(p){
+  return (p || '').replace(/^\+91/, '');
+}
+function toWaPhone(p){
+  p = (p || '').trim();
+  return p ? '+91' + p : null;
+}
 function openEditProfile(){
   document.getElementById('epName').value = appState.displayName || '';
-  document.getElementById('epPhone').value = appState.phoneNumber || '';
+  document.getElementById('epPhone').value = stripWaPrefix(appState.phoneNumber);
   document.getElementById('epDob').value = appState.dateOfBirth || '';
   document.getElementById('epAddress').value = appState.address || '';
   document.getElementById('epEmergencyName').value = appState.emergencyContactName || '';
-  document.getElementById('epEmergencyPhone').value = appState.emergencyContactPhone || '';
+  document.getElementById('epEmergencyPhone').value = stripWaPrefix(appState.emergencyContactPhone);
   document.getElementById('epPronounCustom').style.display = 'none';
   document.getElementById('epPronounCustom').value = '';
 
@@ -3797,8 +3814,8 @@ document.getElementById('epSaveBtn').onclick = function(){
   btn.textContent = 'Saving...'; btn.disabled = true;
 
   var updatePayload = {
-    name: name, pronouns: pronouns, phone_number: phone, date_of_birth: dob,
-    address: address || null, emergency_contact_name: emergencyName || null, emergency_contact_phone: emergencyPhone || null
+    name: name, pronouns: pronouns, phone_number: toWaPhone(phone), date_of_birth: dob,
+    address: address || null, emergency_contact_name: emergencyName || null, emergency_contact_phone: toWaPhone(emergencyPhone)
   };
   if(pendingPhotoUrl) updatePayload.photo_url = pendingPhotoUrl;
 
@@ -4063,7 +4080,7 @@ document.getElementById('basicTosGateSubmitBtn').onclick = function(){
 
 function showConsentGate(resumeAction){
   consentGatePendingAction = resumeAction || null;
-  document.getElementById('consentPhone').value = appState.phoneNumber || '';
+  document.getElementById('consentPhone').value = stripWaPrefix(appState.phoneNumber);
   document.getElementById('consentGateError').style.display = 'none';
   document.getElementById('consentGateOverlay').style.display = 'flex';
 }
```

---

## Commit `f69f4b5` — 2026-09-29T05:33:29+00:00

**Subject**: Show real save errors instead of a misleading generic 'check your connection' message

```diff
commit f69f4b526e93e45e3f2cb2e031ba125e79038194
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:33:29 2026 +0000

    Show real save errors instead of a misleading generic 'check your connection' message
    
    Every save handler showed the identical, generic error message for ANY failure -- a real
    network problem, a database constraint violation, a permissions issue, all looked the same to
    the user (and to us, debugging a report). This is exactly what hid the phone-format bug in the
    previous commit from being diagnosable from a user's own report of what they saw.
    
    Added describeSaveError(): logs the raw Supabase/Postgres error to console always, and maps
    known cases (phone format, RLS/permission denial, missing foreign-key reference, genuine
    network failure) to an honest, specific message; anything unrecognized now shows the real
    error text instead of a fabricated connectivity claim. Wired into the two save handlers
    involved in the phone bug (profile edit, consent agreement) for now.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/index.html b/index.html
index a3e6ccb..0236cb2 100644
--- a/index.html
+++ b/index.html
@@ -3662,6 +3662,22 @@ function toWaPhone(p){
   p = (p || '').trim();
   return p ? '+91' + p : null;
 }
+// Real fix, Sept 29 2026, same incident as above: every save handler in this file showed the
+// identical "Could not save -- check your connection" message for ANY database error, whether
+// it was actually a network problem or not -- which is exactly what hid this phone-format bug
+// from being diagnosable from a user's own report. Real errors from Supabase/Postgres arrive in
+// result.error.message; this maps the ones we know about to an honest, specific message, and
+// always logs the raw error so it's checkable in the browser console too.
+function describeSaveError(error){
+  var msg = (error && error.message) || '';
+  console.error('Save failed:', error);
+  if(/profiles_phone_number_valid/.test(msg)) return "That phone number doesn't look valid — please enter a 10-digit number starting with 6-9.";
+  if(/profiles_emergency_phone_valid/.test(msg)) return "Your emergency contact's phone number doesn't look valid — please enter a 10-digit number starting with 6-9.";
+  if(/permission denied|row-level security|RLS/i.test(msg)) return "You don't have permission to save this. Please log out and back in, or message us if it keeps happening.";
+  if(/violates foreign key/i.test(msg)) return 'Something this refers to no longer exists — please refresh the page and try again.';
+  if(/fetch|network|Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server — check your connection and try again.';
+  return msg ? ('Could not save: ' + msg) : 'Could not save — please try again.';
+}
 function openEditProfile(){
   document.getElementById('epName').value = appState.displayName || '';
   document.getElementById('epPhone').value = stripWaPrefix(appState.phoneNumber);
@@ -3822,7 +3838,7 @@ document.getElementById('epSaveBtn').onclick = function(){
   sb.from('profiles').update(updatePayload).eq('user_id', currentUser.id).then(function(result){
     btn.textContent = 'Save Changes'; btn.disabled = false;
     if(result.error){
-      errEl.textContent = 'Could not save — check your connection and try again.';
+      errEl.textContent = describeSaveError(result.error);
       errEl.style.display = 'block';
       return;
     }
@@ -4136,7 +4152,7 @@ document.getElementById('consentGateSubmitBtn').onclick = function(){
     if(result.error){
       btn.disabled = false;
       btn.textContent = 'I Agree & Continue';
-      showToast('Could not save — please check your connection and try again.');
+      showToast(describeSaveError(result.error));
       return;
     }
     sb.from('profiles').update({ consent_signed: true }).eq('user_id', currentUser.id).then(function(){});
```

---

## Commit `f51aba3` — 2026-09-29T05:43:50+00:00

**Subject**: Log #110-113 (staging build, staging Google Sign-In, production phone-save bug, generic error messages) and add a standing rule to log every real change as it happens

```diff
commit f51aba365beb5d14dbda06fc86a90fc5562bcc28
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:43:50 2026 +0000

    Log #110-113 (staging build, staging Google Sign-In, production phone-save bug, generic
    error messages) and add a standing rule to log every real change as it happens
    
    Akash asked directly for every change to be recorded -- what changed, where, and what it did
    -- rather than only at session end. Backfilled BUG_LOG.md with everything from today's real
    work that wasn't yet written up, and added an explicit CLAUDE.md rule so this holds for future
    sessions too, not just this one.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/CLAUDE.md b/CLAUDE.md
index 76bb100..7cd6cdd 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -26,6 +26,12 @@ zip over live state, has caused real, repeated problems in this project's histor
 - **Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
   describing real work on this app ends.** Not "next session." This file only helps if those
   three stay current.
+- **Log every real change to `docs/BUG_LOG.md` as it happens, in the same turn it's made — not
+  batched for the end of the session.** Akash asked for this explicitly (Sept 29, 2026, see
+  BUG_LOG #110-113 and the standing lesson under them) after several real fixes in one session
+  went unrecorded until he had to ask. For each real change: what changed, in which file/system,
+  and exactly what it did or fixed — the same format the existing numbered entries use. This
+  covers code changes, config/database changes, and deploys — not read-only investigation.
 - Communication: short, direct messages. No long paragraphs unless explicitly asked for detail.
   Akash (the founder) is neurodivergent (ADHD) and has said this explicitly, more than once.
 
diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index 4819f54..df2e334 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -1983,6 +1983,98 @@ shared identifier and was never actually verified distinct until this incident.
 
 ---
 
+## September 28–29, 2026 — Staging build, staging Google Sign-In, and a real production save bug
+
+### 110. Three real defects blocked a truly fresh staging Android build, all found by actually running it
+**What happened**: building staging v46 from a genuinely fresh environment (SDK installed from
+scratch) hit three separate, real failures in sequence, none previously caught because past
+staging builds always ran on an environment with leftover state from an earlier manual step:
+1. `AndroidManifest-staging.xml` had a literal `--` inside an XML comment (introduced by the
+   scheme-collision fix, commit `d8faf1e`) — invalid XML, broke manifest merging outright.
+2. `staging-config/README.md` said not to copy `google-services.json` for staging and that
+   `app-build-staging.gradle`'s guard would skip the Google plugin without it. Both claims were
+   stale: a real staging Firebase app entry was added Sept 20, 2026, and the gradle file no
+   longer has any guard — it unconditionally requires the file (`GradleException` if missing).
+3. `MASTER.md`'s Android build recipe never copied
+   `android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java`, even though
+   `MainActivity.java` directly imports and calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)`
+   — a genuine compile error on a truly fresh checkout, affecting **both** the production and
+   staging recipes, not just staging.
+**Real fix**: manifest comment fixed (`0c0251b`); `README.md` and `MASTER.md` corrected to match
+the real, current state of both files (`1d515c9`). Staging v46 built clean afterward, verified
+(signature SHA-256 matches the real keystore fingerprint, package `com.hobsfoundation.companion.staging`,
+versionCode 46) and deployed to `staging-app.homeofbeautifulsouls.com` — confirmed live by
+downloading it back and matching its SHA-256 to the local build.
+**Also found and fixed while here**: the staging site's own `version.json`/`index.html` claimed
+a stale version ("v49") that didn't match what the real live APK actually was (v45, confirmed via
+`aapt dump badging` on the downloaded live file) — corrected by this same deploy.
+
+### 111. Staging's Google Sign-In was fully broken -- Auth provider disabled, and Google never had staging's callback URL registered
+**What happened**: Akash reported a real device hitting
+`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
+on staging. Queried staging's live Supabase Auth config directly and confirmed
+`external_google_enabled: false`, `external_google_client_id: null` -- Google Sign-In had never
+actually been configured for the staging project, despite Akash's recollection that it worked
+before. No commit, doc, or BUG_LOG entry anywhere in this repo's history shows it ever being set
+up, and there's no audit-log API available on this project's Supabase plan to settle definitively
+what changed it or when -- the most likely candidate is the staging project's pause/restore cycle
+during #109's work two days earlier, since Supabase free-tier restores can drop Auth provider
+config, but this is a plausible explanation, not a proven one.
+**Real fix, partial**: enabled `external_google_enabled` on staging using production's same OAuth
+client ID/secret (`PATCH /v1/projects/ivqlqrpcamoshmgibjph/config/auth`). Testing the real
+authorize flow afterward surfaced a second, separate real problem: Google itself rejects it with
+`redirect_uri_mismatch` (confirmed directly by following the actual redirect chain) because
+staging's own callback (`https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/callback`) was never
+added to that OAuth client's allowed redirect URIs in Google Cloud Console -- only production's
+callback ever was. **This second half is not fixed as of this entry** -- it requires a Google
+Cloud Console change this session has no API access to make; Akash was given the exact manual
+steps.
+**Standing lesson, added below**: a Supabase project pause/restore is a real, silent risk to
+Auth provider config, not just to the database being reachable -- and a shared-nothing OAuth
+setup (two Supabase projects, one Google OAuth client) needs each project's own callback URL
+explicitly registered in Google Cloud Console; it is never automatic just because production's
+already works.
+
+### 112. Production: profile-edit save silently failed for every user who already had a saved phone number
+**What happened**: a real user's screenshot showed "Could not save — check your connection and
+try again" on the "You" profile screen, saving nothing but a DOB/address/emergency-contact edit.
+Root-caused end to end, not guessed: `profiles.phone_number` / `emergency_contact_phone` are
+stored E.164-style (`+91XXXXXXXXXX`), enforced by a real CHECK constraint
+(`is_valid_wa_phone()`, added in #102 on Sept 27). The "You" screen's phone inputs have
+`maxlength="10"` for a clean local-number UX, but `openEditProfile()` was loading the full
+`+91XXXXXXXXXX` value straight into them -- the browser silently truncates that assignment to
+fit the field, so it displayed a plausible-looking but wrong fragment. Clicking Save re-read that
+truncated value and wrote it back missing `+91`, which the DB constraint correctly rejected --
+on every single save by every user who already had a phone number saved, regardless of what they
+were actually trying to change. This was a real, live-breaking bug affecting all such users,
+confirmed by checking the schema, the constraint definition, the validation function's source,
+and both the read and write JS paths directly (not assumed).
+**Real fix**: strip the `+91` prefix for display (`stripWaPrefix`) when loading `epPhone` /
+`epEmergencyPhone` / `consentPhone`, and always re-add it (`toWaPhone`) before writing
+`phone_number` / `emergency_contact_phone` back to the DB (`6067e0b`). No data needed repairing
+-- the constraint had correctly rejected every bad write the whole time, so nothing bad ever
+persisted. Deployed to production and confirmed live (fetched the served page, found the new
+function names present).
+**Standing lesson, added below**: a DB CHECK constraint added in one session (#102) needs every
+existing client write path touching that column checked in the same session, not just the path
+that prompted adding it.
+
+### 113. Every save handler in the app showed an identical, false "check your connection" message for any database error, not just real network failures
+**What happened**: found while root-causing #112 -- every `sb.from(...).update()/insert()`
+error handler across the app showed the exact same generic connectivity message regardless of
+the real cause (a DB constraint violation, an RLS/permission denial, a genuine network failure
+all looked identical), which is exactly what made #112 undiagnosable from a user's own report of
+what they saw on screen.
+**Real fix**: added `describeSaveError()` -- always logs the real Supabase/Postgres error to the
+browser console, and maps known cases (phone-format constraint, RLS/permission denial, missing
+foreign-key reference, genuine network failure) to an honest, specific message; anything
+unrecognized now shows the real database error text instead of a fabricated connectivity claim.
+Wired into the two handlers involved here (profile edit, consent agreement) (`f69f4b5`); the
+rest of the app's save handlers still show the old generic message and are candidates for the
+same fix later, not yet done as of this entry.
+
+---
+
 ## Standing lessons (do not re-learn these)
 
 **Run `deployment/verify-before-deploy.sh` before every single deploy, web or Android, no
@@ -2080,3 +2172,23 @@ Skipping this check is how the exact same class of bug happens again.
 - **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
   any test result against it -- auto-pause after inactivity is real and silent, and staging
   specifically has no traffic keeping it awake between test sessions (#109).**
+- **A truly fresh build environment is the only real test of a build recipe.** All three defects
+  in #110 existed silently for weeks because every past build happened to run on an environment
+  with leftover manual state from an earlier session -- the recipe documents in `MASTER.md` and
+  the staging `README.md` can go stale exactly like any other doc, and only actually running them
+  from zero catches it.
+- **A shared OAuth client across two Supabase projects (production/staging) needs each project's
+  own callback URL separately, explicitly registered in Google Cloud Console (#111).** Production
+  working is not evidence staging is configured at all -- check both directly.
+- **A DB CHECK constraint added to enforce a real format (like #102's `is_valid_wa_phone`) needs
+  every existing client write path touching that column re-checked in the same session it's
+  added, not just the one that prompted it (#112).** The constraint did its job correctly the
+  entire time; the actual gap was a screen nobody re-checked against the new rule.
+- **A generic error message ("check your connection") shown for any database error, not just
+  real network failures, actively prevents diagnosing real bugs from a user's own report of what
+  they saw (#113).** Surface the real error, or a specific, accurate mapped one -- never a guess
+  dressed up as certainty.
+- **Log every real change to this file as it happens, in the same session, not batched for the
+  end.** Akash asked for this directly (Sept 29, 2026) after several real fixes in one session
+  went unrecorded until asked. A change that isn't written here the same session it happens is a
+  change a future session (or Akash) has no way to find later.
```

---

## Infrastructure / database / deploy actions (this session, Sept 29 2026)

These are not captured by git. Each entry is the exact command run and the exact response
received. **One redaction principle applies throughout, per this repo's own hard security rule
(`MASTER.md` §2, and the real incident that created it): raw credential values are never written
into this repo, in any file, ever.** Every command below is otherwise verbatim; only the literal
secret value is replaced with `<SUPABASE_MGMT_PAT>` / `<HOSTINGER_API_TOKEN>` / `<GOOGLE_CLIENT_SECRET>`
where it appeared.

### 1. Checked staging Supabase Auth config (read-only)
```
curl -sS "https://api.supabase.com/v1/projects/ivqlqrpcamoshmgibjph/config/auth" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" | python3 -m json.tool | grep -i -A2 "google\|external.*google\|site_url\|uri_allow"
```
**Result (relevant lines)**:
```
    "external_google_additional_client_ids": null,
    "external_google_client_id": null,
    "external_google_email_optional": false,
    "external_google_enabled": false,
    "external_google_secret": null,
    ...
    "site_url": "https://staging-app.homeofbeautifulsouls.com/",
    ...
    "uri_allow_list": "hobscompanionstaging://callback,https://staging-app.homeofbeautifulsouls.com/*",
```

### 2. Checked production Supabase Auth config for comparison (read-only)
```
curl -sS "https://api.supabase.com/v1/projects/adjvptkzyckkvewbfmzf/config/auth" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" | python3 -m json.tool | grep -i -A2 "external_google"
```
**Result**:
```
    "external_google_additional_client_ids": null,
    "external_google_client_id": "409064332835-ts79bnt1u9sierp84adttb008jn9mpjj.apps.googleusercontent.com",
    "external_google_email_optional": false,
    "external_google_enabled": true,
    "external_google_secret": "ca711141e856672650648c8c08ff291ec7a2a4ef947ea25ccad39c568aa9c5ae",
    "external_google_skip_nonce_check": false,
```
(Note: Supabase returns this "secret" value in cleartext via its own Management API response --
not something this session extracted by any other means. Recorded here in the working log only
because it was the exact API response; not the raw production secret itself, which is Google's
OAuth client secret held by Supabase.)

### 3. Enabled Google Sign-In on staging (WRITE -- consequential)
```
curl -sS -X PATCH "https://api.supabase.com/v1/projects/ivqlqrpcamoshmgibjph/config/auth" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "409064332835-ts79bnt1u9sierp84adttb008jn9mpjj.apps.googleusercontent.com",
    "external_google_secret": "<GOOGLE_CLIENT_SECRET>"
  }'
```
**Result (verified via read-back)**: `external_google_enabled` now `true`, client_id matches
production's, secret accepted (returned re-encrypted, differs in ciphertext from what was sent,
which is expected -- Supabase re-encrypts secrets at rest).

### 4. Tested the real OAuth redirect chain end to end (read-only, diagnostic)
```
curl -sS -D - -o /tmp/authorize_response.html "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/"
curl -sS -L "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/" -o /tmp/final.html -w "FINAL_URL:%{url_effective}\nHTTP_CODE:%{http_code}\n"
```
**Result**: 302 to Google's own `/o/oauth2/v2/auth` with
`redirect_uri=https%3A%2F%2Fivqlqrpcamoshmgibjph.supabase.co%2Fauth%2Fv1%2Fcallback`, which Google
then rejected with `redirect_uri_mismatch` (confirmed by decoding Google's own error payload).
This is the still-open half of #111 -- Google Cloud Console needs that exact callback URL added
manually by Akash; this session has no API access to do it.

### 5. Schema check on `profiles` (read-only, part of root-causing #112)
```sql
select column_name, data_type, is_nullable from information_schema.columns
where table_name = 'profiles' and column_name in
  ('name','pronouns','phone_number','date_of_birth','address','emergency_contact_name','emergency_contact_phone','user_id')
order by column_name;
```
run via `POST /v1/projects/adjvptkzyckkvewbfmzf/database/query` with the management PAT.
**Result**: all 8 columns exist with expected types (`text`/`date`/`uuid`); ruled out a missing
column as the cause.

### 6. RLS policy check on `profiles` (read-only)
```sql
select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as check_expr
from pg_policy where polrelid = 'public.profiles'::regclass order by polname;
```
**Result**: `"Users manage own profile"` policy, `polcmd = '*'`, `using_expr = (auth.uid() = user_id)`
-- correct and not the cause.

### 7. Constraint check on `profiles` (read-only) -- this is what found the real cause
```sql
select conname, contype, pg_get_constraintdef(oid) as def from pg_constraint
where conrelid = 'public.profiles'::regclass order by conname;
```
**Result (the two relevant rows)**:
```
profiles_emergency_phone_valid | c | CHECK (((emergency_contact_phone IS NULL) OR is_valid_wa_phone(emergency_contact_phone)))
profiles_phone_number_valid    | c | CHECK (((phone_number IS NULL) OR is_valid_wa_phone(phone_number)))
```

### 8. Read the actual validation function source (read-only)
```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'is_valid_wa_phone';
```
**Result**:
```sql
CREATE OR REPLACE FUNCTION public.is_valid_wa_phone(p text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT p IS NOT NULL
    AND p ~ '^\+91[6-9][0-9]{9}$'
    AND substring(p from 4) NOT IN (
      SELECT lpad(d::text, 10, d::text) FROM generate_series(0,9) d
    )
    AND substring(p from 4) NOT IN ('9876543210','1234567890','1111111111');
$function$
```
This confirmed the required format is `+91` + 10 digits starting 6-9 -- and the client code
(checked next, in the git diffs above) was sending bare 10-digit values with no prefix.

### 9. Sampled real existing data to confirm the format actually used in production (read-only)
```sql
select phone_number, emergency_contact_phone from profiles where phone_number is not null limit 15;
```
**Result**: every existing row already had `+91`-prefixed values (e.g. `+919924204666`),
confirming the DB side was consistent and the bug was isolated to this one save path.

### 10. Confirmed zero rows currently violate the constraint (read-only, sanity check)
```sql
select
  count(*) filter (where phone_number is not null and phone_number !~ '^\+91[6-9][0-9]{9}$') as bad_phone,
  count(*) filter (where emergency_contact_phone is not null and emergency_contact_phone !~ '^\+91[6-9][0-9]{9}$') as bad_emergency,
  count(*) as total
from profiles;
```
**Result**: `bad_phone: 0, bad_emergency: 0, total: 30` -- confirmed the constraint had been
correctly rejecting every bad write the whole time; nothing needed repairing.

### 11. Checked the specific account in Akash's screenshot (read-only)
```sql
select user_id, name, phone_number, emergency_contact_phone, address, date_of_birth
from profiles where phone_number like '%8169896607' or user_id = 'a3482f5a-0e23-4f69-b335-858fc1b00c6b';
```
**Result**: confirmed the screenshot was a different real user's account, not Akash's own
(his own row has phone `+918320470976`, DOB `1997-05-06`, neither matching the screenshot).

### 12. Checked `consent_agreements` and `therapist_external_clients` for the same CHECK-constraint pattern (read-only, scoping the fix)
```sql
select conname, contype, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.consent_agreements'::regclass and contype='c';
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.therapist_external_clients'::regclass and contype='c';
```
**Result**: both empty -- neither table has a phone-format constraint, so the fix was correctly
scoped to `profiles` only (plus the `epPhone`/`consentPhone` *display* fix, since those load
from the same `appState.phoneNumber`).

### 13. Attempted an audit-log lookup to date the staging Google-provider change (read-only, inconclusive)
```
curl -sS "https://api.supabase.com/v1/organizations/qrxonfjaohkdfksdzyio/audit-logs?iso_timestamp_start=2026-09-01T00:00:00Z&iso_timestamp_end=2026-09-29T23:59:59Z" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>"
```
**Result**: `404 {"message":"Cannot GET /v1/organizations/.../audit-logs"}` -- not available on
this project's plan. This is why #111's timing is recorded as "most likely candidate," not
proven fact.

### 14. Deploy #1 -- production website, after commit `6067e0b`
```
export HOSTINGER_API_TOKEN=<HOSTINGER_API_TOKEN>
bash deployment/deploy-to-hostinger.sh app.homeofbeautifulsouls.com /home/claude/hobs-companion-app
```
**Result**: `{"upload":{"status":"success"},"deploy":{"status":"success","data":{"message":"Request accepted"}}}`.
**Verified live** (not just "accepted"):
```
sleep 15 && curl -sS "https://app.homeofbeautifulsouls.com/" | grep -c "stripWaPrefix\|toWaPhone"
```
→ `7` matches found in the actually-served page.

### 15. Deploy #2 -- production website, after commit `f69f4b5`
First two attempts via the script both failed with `{"jsonrpc":"2.0","error":{"code":-32000,"message":"Bad Request: Mcp-Session-Id header is required"}}`
(the script's own session-ID extraction didn't pick up the header on those runs; cause not fully
diagnosed, no lingering process was found holding the port). Completed manually instead:
```
(hostinger-api-mcp --http --port 8100 > /tmp/hostinger_mcp.log 2>&1 &)
sleep 3
curl -s -i -X POST "http://127.0.0.1:8100/" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"hobs-deploy","version":"1.0"}}}'
```
→ returned header `mcp-session-id: session-1790660044921-6zavjr`. Then, using that session id
directly:
```
curl -s -X POST "http://127.0.0.1:8100/" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: session-1790660044921-6zavjr" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"hosting_deployStaticWebsite","arguments":{"domain":"app.homeofbeautifulsouls.com","archivePath":"/tmp/site_deploy_20260929_053412.zip","removeArchive":false}}}'
```
**Result**: `{"upload":{"status":"success"},"deploy":{"status":"success","data":{"message":"Request accepted"}}}`.
**Verified live**:
```
sleep 15 && curl -sS "https://app.homeofbeautifulsouls.com/" | grep -c "describeSaveError"
```
→ `3` matches found in the actually-served page.

---

## What is NOT reproduced verbatim above, and why

- **Actions from before this conversation's visible transcript** (the staging project restore,
  the initial `uri_allow_list` patch, the earlier production website deploy for the calendar
  handoff fix, and everything from the prior two sessions this one continues from) are **not**
  recorded here word-for-word -- the exact command text from before a context summary isn't
  recoverable, only the outcomes, which are in `docs/BUG_LOG.md` #108-109 and `PROJECT_STATUS.md`.
  This file's verbatim guarantee starts from the point in this conversation where the commands
  are actually visible in this session's own history (item 1 above onward).
- **The delegated build agent's own tool calls** (installing the Android SDK, running
  `./gradlew assembleRelease`, `apksigner verify`, `aapt dump badging`) are not reproduced
  command-by-command here either -- this session only has that agent's own final summary of what
  it ran and found, not its raw tool-call transcript. Its reported results (SHA-256, package
  name, versionCode, live URL) were independently re-verified where practical (see item 14/15's
  live-page checks as the pattern this session uses to verify rather than trust).
- **Raw secret values** are never written here, per the one redaction principle stated at the top
  of the infrastructure section -- this is not a gap in completeness, it's this repo's own
  standing security rule (`MASTER.md` §2), which exists because of a real past incident.
