# Native splash screen images

Every splash.png variant here is a solid color (#FFF8F0), deliberately -- matching the app's
own real background color (the same one used by #authOverlay in index.html) exactly.

Why: Android's native cold-start splash (Theme.SplashScreen, referenced in styles.xml's
AppTheme.NoActionBarLaunch) shows before any JS runs at all, completely separate from anything
in index.html -- including the "optimistic boot" fix that skips the in-app loading spinner for
returning users. That JS-level fix can't touch this native layer at all. These splash images
previously showed a distinct "Bob" mascot image here, which read as its own separate loading
screen moment even for a fast, already-logged-in app open.

Replacing the image with a solid color matching the app's real background makes this native
screen visually disappear into the app itself -- there's still a brief OS-level cold-start
window (this can't be fully eliminated on modern Android), but it no longer looks like a
distinct "loading" moment, just an instant, seamless open.

On every Android rebuild, these files must be copied into
android/app/src/main/res/drawable*/splash.png -- do not let a from-scratch Capacitor asset
regeneration silently restore the original mascot image.
