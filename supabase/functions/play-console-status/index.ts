// Real integration with the Google Play Developer API (Android Publisher API), using the
// service account granted access to the HOBS Companion app in Play Console. Authenticates via
// a signed JWT (RS256, using the service account's own private key -- no external library
// needed, Deno's built-in Web Crypto API handles RSA signing directly), exchanges it for a
// real OAuth2 access token, then reads real track/release status. Track info specifically
// requires an open "edit" session per Android Publisher API's own design (even for reads) --
// this deliberately never calls edits.commit, so nothing it does can ever change what's live;
// the edit is explicitly deleted at the end of every call, success or failure, so no abandoned
// edit sessions are ever left behind blocking a future real edit.

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
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedJwt));
  const jwt = unsignedJwt + "." + base64UrlEncode(signature);

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let editId: string | null = null;
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}`;

  try {
    const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
    if (!raw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not configured");
    const serviceAccount = JSON.parse(raw);
    const accessToken = await getAccessToken(serviceAccount);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // Open a real edit session -- required by this API even for reads, never committed.
    const editRes = await fetch(`${base}/edits`, { method: "POST", headers: authHeaders });
    if (!editRes.ok) throw new Error(`Could not open edit session: ${editRes.status} ${await editRes.text()}`);
    const editJson = await editRes.json();
    editId = editJson.id;

    const tracksRes = await fetch(`${base}/edits/${editId}/tracks`, { headers: authHeaders });
    const tracksJson = tracksRes.ok ? await tracksRes.json() : { error: await tracksRes.text() };

    // Reviews are a separate, top-level resource -- doesn't need the edit session.
    const reviewsRes = await fetch(`${base}/reviews?maxResults=5`, { headers: authHeaders });
    const reviewsJson = reviewsRes.ok ? await reviewsRes.json() : { error: `${reviewsRes.status}` };

    return new Response(JSON.stringify({ success: true, tracks: tracksJson.track || tracksJson, reviewCount: reviewsJson.reviews ? reviewsJson.reviews.length : 0 }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } finally {
    // Always clean up the edit session, success or failure, so nothing is ever left dangling.
    if (editId) {
      try {
        const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")!;
        const serviceAccount = JSON.parse(raw);
        const accessToken = await getAccessToken(serviceAccount);
        await fetch(`${base}/edits/${editId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      } catch (_) { /* best-effort cleanup */ }
    }
  }
});
