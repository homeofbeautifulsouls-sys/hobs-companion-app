# Web/app image assets

Real bug found August 25, 2026: every image in the app (Bob, the character avatars, the HOBS
logo, background images) went missing on both the live website and every APK built since the
sandbox reset -- these files were never included in the copy step when rebuilding the Android
project or deploying to the website, even though they were safely sitting in the repo root the
whole time. The gap was simply forgetting to copy them, not losing them.

These are also tracked directly in the repo root (bob.jpg, logo.png, etc.) -- this folder exists
specifically so the Android build and Hostinger deployment steps have one clear, complete list
to copy from, rather than relying on memory of which files matter.

On every Android rebuild, copy every file in this folder into www/ before building.
On every Hostinger deployment, copy every file in this folder into the site directory before
zipping and deploying -- deployments are a full directory replace, not a merge, so leaving any
of these out will make them 404 on the live site even if they were there before.

Known gap, not yet fixed: calmroom-bg.jpg is referenced in index.html but doesn't exist
anywhere -- a real, separate missing asset, not a copy-step oversight like the others.
