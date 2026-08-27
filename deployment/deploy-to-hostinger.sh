#!/bin/bash
# Real, working Hostinger deployment mechanism -- found August 25, 2026 after this exact
# problem cost significant time across multiple sessions. The direct REST file-upload API
# doesn't seem to be genuinely exposed for shared/cloud hosting; the real, working path is
# Hostinger's own official MCP server package, run locally, which handles the actual TUS
# resumable-upload protocol internally so nothing about that protocol needs to be hand-built.
#
# Usage: ./deploy-to-hostinger.sh <domain> <path-to-site-directory>
# Example: ./deploy-to-hostinger.sh app.homeofbeautifulsouls.com /home/claude/hobs-repo

set -e
DOMAIN="$1"
SITE_DIR="$2"
if [ -z "$DOMAIN" ] || [ -z "$SITE_DIR" ]; then
  echo "Usage: ./deploy-to-hostinger.sh <domain> <path-to-site-directory>"
  exit 1
fi

# Install the real, official Hostinger MCP server if not already present
if ! command -v hostinger-api-mcp &> /dev/null; then
  npm install -g hostinger-api-mcp
fi

# Real, confirmed gap found August 26, 2026: this script never included the live APK at all.
# Deploys are a full directory replace, not a merge (documented above and in MASTER.md) -- so
# any past web-only deploy through this exact script would have silently 404'd the live APK,
# even though nothing about that deploy had anything to do with the app itself. Fixed by always
# including whichever APK-related file(s) actually exist in SITE_DIR: the stable
# HOBS-Companion.apk (what index.html's own APK_DOWNLOAD_URL constant points at, so the in-app
# "Update" banner keeps working without a code change every release) and any versioned
# HOBS-Companion-v*.apk files (the convention adopted after BUG_LOG #25, so a fresh direct
# download never collides with a stale, same-named file already cached by Chrome's download
# manager).
#
# Build the deployment archive from exactly the files that belong on the live site --
# add to this list if the site ever gains new top-level files.
TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
STAGE_DIR="/tmp/hostinger_deploy_stage_${TIMESTAMP}"
mkdir -p "$STAGE_DIR"
for f in index.html version.json donate.html privacy-policy.html terms-of-service.html delete-account.html supabase.min.js fonts.css HOBS-Companion.apk; do
  [ -f "$SITE_DIR/$f" ] && cp "$SITE_DIR/$f" "$STAGE_DIR/"
done
# Real bug found Aug 27, 2026: under `set -e`, this line's nonzero exit (when no APK file
# happens to exist locally, which is true for every ordinary web-only deploy) silently killed
# the entire script before it ever reached Hostinger -- no error message, since stderr was also
# suppressed, making it look like nothing happened at all rather than a clear failure. The `||
# true` is what makes "no APK to deploy this time" the normal, expected case it actually is,
# rather than a fatal error.
cp "$SITE_DIR"/HOBS-Companion-v*.apk "$STAGE_DIR/" 2>/dev/null || true
[ -d "$SITE_DIR/fonts" ] && cp -r "$SITE_DIR/fonts" "$STAGE_DIR/"
# Real bug found August 25, 2026: every image went missing from both the website and every APK
# after the sandbox reset because this list never included them. android-native-assets/web-images/
# is the authoritative, complete list -- always copy every file in it.
if [ -d "$SITE_DIR/android-native-assets/web-images" ]; then
  cp "$SITE_DIR"/android-native-assets/web-images/*.jpg "$STAGE_DIR/" 2>/dev/null
  cp "$SITE_DIR"/android-native-assets/web-images/*.png "$STAGE_DIR/" 2>/dev/null
fi

ZIPFILE="/tmp/site_deploy_${TIMESTAMP}.zip"
(cd "$STAGE_DIR" && zip -r "$ZIPFILE" . -x ".*" > /dev/null)

# Start the MCP server, initialize a session, and deploy -- all in one shell so the
# background process survives long enough to actually complete the deployment.
export HOSTINGER_API_TOKEN="${HOSTINGER_API_TOKEN}"
(hostinger-api-mcp --http --port 8100 > /tmp/hostinger_mcp.log 2>&1 &)
sleep 3

INIT_RESPONSE=$(curl -s -i -X POST "http://127.0.0.1:8100/" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"hobs-deploy","version":"1.0"}}}')
SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "^mcp-session-id:" | sed 's/mcp-session-id: //i' | tr -d '\r')

echo "Deploying $ZIPFILE to $DOMAIN..."
curl -s -X POST "http://127.0.0.1:8100/" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"hosting_deployStaticWebsite\",\"arguments\":{\"domain\":\"$DOMAIN\",\"archivePath\":\"$ZIPFILE\",\"removeArchive\":false}}}"
echo ""
echo "Verify manually before trusting this: curl the live domain and confirm the expected content is actually there -- 'Request accepted' means the deploy was queued, not necessarily that it's already live."
