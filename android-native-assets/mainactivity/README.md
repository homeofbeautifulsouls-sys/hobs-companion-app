# MainActivity.java

Contains the Force Dark suppression fix (August 2026) -- without this, Android's native
WebView-level "algorithmic darkening" can invert the app's colors (cream background -> black,
dark text -> pale gold), regardless of the app's own CSS declaring color-scheme: light only.

This was never saved here before -- the same recurring gap as every other native asset this
session. On every Android rebuild, copy this file to
android/app/src/main/java/com/hobsfoundation/companion/MainActivity.java. Requires the
androidx.webkit dependency, already present in the persisted app-build.gradle.
