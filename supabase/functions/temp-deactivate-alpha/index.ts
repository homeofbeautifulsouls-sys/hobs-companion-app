// TEMPORARY, one-time-use -- deactivates the alpha/closed testing track by clearing its
// release, per direct, urgent instruction, after confirming via real research that testers
// remaining enrolled in a testing track is exactly why real users keep receiving an old
// version (74/"3.54") no matter how many times they reinstall -- uninstalling never opts
// anyone out, only the developer ending the test, or the tester manually leaving, does.
// Real, practical, developer-side fix: end it from here, once, for everyone, rather than ask
// every real user to find and click a "leave testing" link themselves.

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

Deno.serve(async (_req: Request) => {
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}`;
  const steps: any = {};
  let editId: string | null = null;

  try {
    const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")!;
    const serviceAccount = JSON.parse(raw);
    const accessToken = await getAccessToken(serviceAccount);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const editRes = await fetch(`${base}/edits`, { method: "POST", headers: authHeaders });
    const editJson = await editRes.json();
    steps.createEdit = { status: editRes.status, ok: editRes.ok };
    if (!editRes.ok) throw new Error("createEdit failed: " + JSON.stringify(editJson));
    editId = editJson.id;

    // Check current alpha track state first, for a real before/after record.
    const beforeRes = await fetch(`${base}/edits/${editId}/tracks/alpha`, { headers: authHeaders });
    steps.alphaBefore = await beforeRes.json();

    // Clear the release entirely -- an empty releases array is how the API represents "no
    // active release on this track."
    const updateRes = await fetch(`${base}/edits/${editId}/tracks/alpha`, {
      method: "PUT",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ releases: [] }),
    });
    const updateText = await updateRes.text();
    let updateJson: any = null;
    try { updateJson = updateText ? JSON.parse(updateText) : null; } catch (_e) { updateJson = { rawText: updateText }; }
    steps.updateAlpha = { status: updateRes.status, ok: updateRes.ok, response: updateJson };
    if (!updateRes.ok) throw new Error("updateAlpha failed: " + updateText);

    const commitRes = await fetch(`${base}/edits/${editId}:commit`, { method: "POST", headers: authHeaders });
    const commitJson = await commitRes.json();
    steps.commit = { status: commitRes.status, ok: commitRes.ok };
    if (!commitRes.ok) throw new Error("commit failed: " + JSON.stringify(commitJson));

    editId = null;
    return new Response(JSON.stringify({ success: true, steps }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err), steps }, null, 2), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  } finally {
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
