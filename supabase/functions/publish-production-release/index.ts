// publish-production-release
//
// Real, full automation for getting an already-built production bundle live to all users, per
// explicit, repeated instruction: upload, create the release, and roll it out -- not stopping
// at a draft. Reuses the same real authentication already proven to work in
// play-console-status and the write-permission test that confirmed real upload access.
//
// Takes the already-built AAB as the raw request body (built and verified separately, the same
// rigorous way every release has been this whole session -- signature checked, package name
// confirmed, smoke tested) and a version code, then does the real, complete sequence: create an
// edit, upload the bundle to it (the real /upload URI with uploadType=media, confirmed correct
// after the earlier 400 error), attach it to a release on the production track at 100% rollout,
// and commit the edit -- the one, real, irreversible step that actually makes it live.
//
// Real safety kept, not removed: every step's result is checked before proceeding to the next,
// and if anything fails before the final commit, the edit is deleted rather than left in a
// half-done state -- so a bad step still can't accidentally reach users, only a step that
// genuinely succeeded all the way through gets committed live.

const PACKAGE_NAME = "com.hobsfoundation.companion";

function base64UrlEncode(data: string | ArrayBuffer): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function getAccessToken(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = base64UrlEncode(JSON.stringify(header)) + "." + base64UrlEncode(JSON.stringify(claims));
  const keyData = pemToArrayBuffer(serviceAccount.private_key);
  const cryptoKey = await crypto.subtle.importKey("pkcs8", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedJwt));
  const jwt = unsignedJwt + "." + base64UrlEncode(signature);
  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  return (await tokenRes.json()).access_token;
}

Deno.serve(async (req: Request) => {
  const secretHeader = req.headers.get("x-publish-secret");
  const expectedSecret = Deno.env.get("PUBLISH_RELEASE_SECRET");
  if (!expectedSecret || secretHeader !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const url = new URL(req.url);
  const releaseNotes = url.searchParams.get("releaseNotes") || "Bug fixes and improvements.";
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}`;
  let editId: string | null = null;
  const steps: any = {};

  try {
    const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
    if (!raw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not configured");
    const serviceAccount = JSON.parse(raw);
    const accessToken = await getAccessToken(serviceAccount);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // Step 1: create the edit.
    const editRes = await fetch(`${base}/edits`, { method: "POST", headers: authHeaders });
    const editJson = await editRes.json();
    steps.createEdit = { status: editRes.status, ok: editRes.ok };
    if (!editRes.ok) throw new Error("createEdit failed: " + JSON.stringify(editJson));
    editId = editJson.id;

    // Step 2: upload the real bundle (the real /upload URI, uploadType=media -- confirmed
    // correct directly, after an earlier real 400 error taught this).
    const bundleBytes = await req.arrayBuffer();
    const uploadRes = await fetch(`https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE_NAME}/edits/${editId}/bundles?uploadType=media`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/octet-stream" },
      body: bundleBytes,
    });
    const uploadJson = await uploadRes.json();
    steps.uploadBundle = { status: uploadRes.status, ok: uploadRes.ok, versionCode: uploadJson.versionCode, sha256: uploadJson.sha256 };
    if (!uploadRes.ok) throw new Error("uploadBundle failed: " + JSON.stringify(uploadJson));
    const versionCode = uploadJson.versionCode;

    // Step 3: attach it to a real release on the production track, 100% rollout.
    const trackRes = await fetch(`${base}/edits/${editId}/tracks/production`, {
      method: "PUT",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        releases: [{
          name: `Home of Beautiful Souls Foundation`,
          versionCodes: [String(versionCode)],
          releaseNotes: [{ language: "en-US", text: releaseNotes }],
          status: "completed",
        }],
      }),
    });
    const trackJson = await trackRes.json();
    steps.setTrack = { status: trackRes.status, ok: trackRes.ok };
    if (!trackRes.ok) throw new Error("setTrack failed: " + JSON.stringify(trackJson));

    // Step 4: commit -- the one, real, irreversible step. Only reached if every prior step
    // genuinely succeeded.
    const commitRes = await fetch(`${base}/edits/${editId}:commit`, { method: "POST", headers: authHeaders });
    const commitJson = await commitRes.json();
    steps.commit = { status: commitRes.status, ok: commitRes.ok };
    if (!commitRes.ok) throw new Error("commit failed: " + JSON.stringify(commitJson));

    editId = null; // committed successfully -- nothing left to clean up
    return new Response(JSON.stringify({ success: true, versionCode, steps }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err), steps }, null, 2), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  } finally {
    // If anything failed before commit, delete the edit rather than leave it dangling --
    // an uncommitted edit changes nothing live, so this is always safe to do.
    if (editId) {
      try {
        const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")!;
        const serviceAccount = JSON.parse(raw);
        const accessToken = await getAccessToken(serviceAccount);
        await fetch(`${base}/edits/${editId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      } catch (_e) { /* best-effort cleanup */ }
    }
  }
});
