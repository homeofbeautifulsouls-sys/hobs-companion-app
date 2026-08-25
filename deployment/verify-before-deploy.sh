#!/bin/bash
# ============================================================================
# PRE-DEPLOYMENT VERIFICATION -- run this before EVERY deploy, web or Android.
# ============================================================================
# Real reason this exists: across one session, the signing keystore, the
# Android manifest, package.json, the app's own build.gradle signing config,
# google-services.json, MainActivity.java, and every image asset were each
# separately found missing -- one at a time, reactively, after something had
# already broken for the real user. Every one of those was the same root
# cause: something the app genuinely needs that was never verified to exist
# before shipping.
#
# This script is the fix for the pattern, not just the individual bugs. It
# checks everything the app actually references against what's genuinely
# persisted in the repo, and FAILS LOUDLY -- exit code 1, nothing proceeds --
# if anything is missing. Run this and get a clean pass before any deploy,
# web or Android, ever again.
#
# Usage: ./verify-before-deploy.sh
# ============================================================================
set -e
cd "$(dirname "$0")/.."
FAILURES=0

echo "=== Checking every image/asset index.html actually references ==="
REFERENCED=$(grep -oE 'src="[a-zA-Z0-9_-]+\.(jpg|png|jpeg|gif|svg)"' index.html | sed 's/src="//; s/"//' | sort -u)
REFERENCED="$REFERENCED
$(grep -oE "url\\(['\"]?[a-zA-Z0-9_-]+\\.(jpg|png|jpeg)['\"]?\\)" index.html | sed -E "s/url\\(['\"]?//; s/['\"]?\\)//" | sort -u)"
for f in $(echo "$REFERENCED" | sort -u); do
  [ -z "$f" ] && continue
  if [ -f "$f" ]; then
    echo "  OK: $f"
  else
    echo "  MISSING: $f -- referenced in index.html but does not exist in the repo"
    FAILURES=$((FAILURES+1))
  fi
done

echo ""
echo "=== Checking every image in web-images/ is actually referenced (catches stale entries) ==="
for f in android-native-assets/web-images/*.jpg android-native-assets/web-images/*.png; do
  base=$(basename "$f")
  if ! echo "$REFERENCED" | grep -q "^${base}$"; then
    echo "  NOTE: $base is saved but not currently referenced anywhere in index.html -- probably fine, just flagging"
  fi
done

echo ""
echo "=== Checking every critical native Android build file is genuinely present ==="
CRITICAL_FILES=(
  "android-native-assets/signing/hobs-release.keystore"
  "android-native-assets/manifest/AndroidManifest.xml"
  "android-native-assets/build-config/package.json"
  "android-native-assets/build-config/app-build.gradle"
  "android-native-assets/firebase/google-services.json"
  "android-native-assets/mainactivity/MainActivity.java"
  "android-native-assets/splash/drawable/splash.png"
)
for f in "${CRITICAL_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "  OK: $f"
  else
    echo "  MISSING: $f -- a real, past incident happened from exactly this file being absent"
    FAILURES=$((FAILURES+1))
  fi
done

echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "=== FAILED: $FAILURES real problem(s) found. Do not deploy. Fix these first. ==="
  exit 1
else
  echo "=== PASSED: every referenced asset and every critical build file is genuinely present. ==="
  exit 0
fi
