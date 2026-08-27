// Keeps donate.html's static <head> meta tags (og:title, og:description, og:image, twitter:*)
// in sync with whatever donation campaign is currently active. This exists because donate.html
// loads its campaign data client-side via JS -- but link unfurlers (WhatsApp, iMessage,
// Facebook, Slack) read the raw HTML <head> BEFORE any JS runs, so a campaign change would never
// show up in a shared-link preview unless it's baked into the actual file on disk. Called from
// the admin panel right after a campaign is saved. Reads the current active campaign, then
// updates donate.html in two places: (1) commits to GitHub via the Contents API, kept as a real
// change history/audit trail, and (2) pushes the same corrected file directly to the live site
// on Hostinger, via the exact same TUS upload pattern already proven working in
// database-backup-offsite -- because the app has been hosted on Hostinger since a real
// migration, and a GitHub-only commit never reaches the live site at all.
//
// Real incident, Aug 27, 2026: this function originally only committed to GitHub. It was written
// back when the site was hosted on GitHub Pages, which served directly from the repo -- so a
// GitHub commit alone actually worked, once. After the migration to Hostinger, a separate
// "remove GitHub Pages dependency" audit updated URLs and hardcoded links everywhere else in the
// app, but missed this function specifically, since it doesn't reference a URL directly -- it
// just silently kept committing to a repo the live site no longer reads from at all. A real
// campaign change sat live-incorrect on the actual donate page (and in every WhatsApp link
// preview built from it) until this was caught and fixed by hand.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GITHUB_PAT = Deno.env.get("GITHUB_PAT");
const HOSTINGER_API_TOKEN = Deno.env.get("HOSTINGER_API_TOKEN");
const HOSTINGER_USERNAME = "u533396600";
const HOSTINGER_LIVE_DOMAIN = "app.homeofbeautifulsouls.com";
const REPO = "homeofbeautifulsouls-sys/hobs-companion-app";
const FILE_PATH = "donate.html";

function escapeAttr(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Same proven TUS pattern as database-backup-offsite: get domain-scoped upload credentials,
// then a raw two-call TUS upload (create, then send bytes) rather than a client library --
// small file, no need for resumability, and a library was the actual source of resource-limit
// issues seen elsewhere in this codebase. Retries the data-carrying step specifically, since a
// real transient HTTP2 error was observed there during testing and this runs unattended.
async function uploadToHostingerLive(filename: string, bytes: Uint8Array): Promise<{ ok: boolean; detail: string }> {
  if (!HOSTINGER_API_TOKEN) return { ok: false, detail: "HOSTINGER_API_TOKEN not configured" };
  try {
    const credRes = await fetch("https://developers.hostinger.com/api/hosting/v1/files/upload-urls", {
      method: "POST",
      headers: { Authorization: `Bearer ${HOSTINGER_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ username: HOSTINGER_USERNAME, domain: HOSTINGER_LIVE_DOMAIN }),
    });
    if (!credRes.ok) return { ok: false, detail: `Could not get upload credentials: ${credRes.status}` };
    const creds = await credRes.json();

    // override=true is what makes this an in-place update of the existing live file, not a
    // rejected duplicate-name upload.
    const uploadUrlWithFile = `${creds.url.replace(/\/$/, "")}/${filename}?override=true`;
    const authHeaders = { "X-Auth": creds.auth_key, "X-Auth-Rest": creds.rest_auth_key };

    const createRes = await fetch(uploadUrlWithFile, {
      method: "POST",
      headers: { ...authHeaders, "Tus-Resumable": "1.0.0", "upload-length": String(bytes.length), "upload-offset": "0" },
    });
    if (createRes.status !== 201) return { ok: false, detail: `Create failed: ${createRes.status}` };

    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const patchRes = await fetch(uploadUrlWithFile, {
          method: "PATCH",
          headers: {
            ...authHeaders,
            "Content-Type": "application/offset+octet-stream",
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": "0",
          },
          body: bytes,
        });
        if (patchRes.ok) return { ok: true, detail: attempt > 1 ? `OK (succeeded on attempt ${attempt})` : "OK" };
        lastError = `Upload failed: ${patchRes.status} ${await patchRes.text()}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
    return { ok: false, detail: `Failed after 3 attempts: ${lastError}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Get the current active campaign straight from Supabase (source of truth), not from
    // whatever the caller claims -- so this can never drift from what donate.html itself shows.
    const campaignRes = await fetch(
      `${SUPABASE_URL}/rest/v1/donation_campaigns?select=title,description,image_url&is_active=eq.true&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const campaigns = await campaignRes.json();
    const campaign = campaigns && campaigns[0];

    const title = campaign ? campaign.title : "Support Home of Beautiful Souls Foundation";
    const rawDescription = campaign ? (campaign.description || "Help us continue making mental health support accessible.") : "Help us continue making mental health support accessible.";
    const plainDescription = rawDescription.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\n+/g, " ").trim();
    const description = plainDescription.length <= 300 ? plainDescription : plainDescription.slice(0, plainDescription.lastIndexOf(" ", 297)) + "…";
    // Falls back to the app's own logo if no campaign photo has been set, so a share preview
    // is never blank even before any image is uploaded.
    const imageUrl = (campaign && campaign.image_url) || "https://app.homeofbeautifulsouls.com/logo.png";

    // 2. Fetch the current donate.html + its sha from GitHub (required by GitHub to update an
    // existing file) -- this is the shared source of truth both destinations get updated from.
    const ghHeaders = { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json" };
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, { headers: ghHeaders });
    if (!getRes.ok) {
      return new Response(JSON.stringify({ error: "Could not fetch donate.html from GitHub", detail: await getRes.text() }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const getJson = await getRes.json();
    const sha = getJson.sha;
    const rawBytes = Uint8Array.from(atob(getJson.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
    const currentContent = new TextDecoder("utf-8").decode(rawBytes);

    // 3. Replace just the meta-tag block.
    const metaBlock =
      `<meta property="og:title" content="${escapeAttr(title)}">\n` +
      `<meta property="og:description" content="${escapeAttr(description)}">\n` +
      `<meta property="og:image" content="${escapeAttr(imageUrl)}">\n` +
      `<meta property="og:type" content="website">\n` +
      `<meta name="twitter:card" content="summary_large_image">\n` +
      `<meta name="twitter:title" content="${escapeAttr(title)}">\n` +
      `<meta name="twitter:description" content="${escapeAttr(description)}">\n` +
      `<meta name="twitter:image" content="${escapeAttr(imageUrl)}">`;

    const metaTagRegex = /<meta property="og:title"[\s\S]*?<meta name="twitter:image" content="[^"]*">/;
    let newContent;
    if (metaTagRegex.test(currentContent)) {
      newContent = currentContent.replace(metaTagRegex, metaBlock);
    } else {
      // First run ever, or the block was edited manually since -- insert right after <title>.
      newContent = currentContent.replace(/<\/title>/, `</title>\n${metaBlock}`);
    }

    if (newContent === currentContent) {
      return new Response(JSON.stringify({ success: true, changed: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const newBytes = new TextEncoder().encode(newContent);

    // 4. Commit to GitHub -- kept as a real, readable change history, but no longer the only
    // place this update lands.
    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Update donate.html meta tags for campaign: ${title}`,
        content: bytesToBase64(newBytes),
        sha,
      }),
    });
    const githubResult = putRes.ok
      ? { ok: true, detail: "OK" }
      : { ok: false, detail: `Could not commit to GitHub: ${putRes.status} ${await putRes.text()}` };

    // 5. Push the same corrected file to the actual live site. This is the step that was
    // missing entirely before -- without it, the live page (and every link preview built from
    // it) never reflects a campaign change no matter how well step 4 succeeds.
    const liveResult = await uploadToHostingerLive(FILE_PATH, newBytes);

    // Real success means the live site actually changed -- that's the one that matters for what
    // anyone sees. GitHub failing is logged but doesn't fail the whole call, since it's a
    // history record, not the thing users or link previews ever read from.
    return new Response(
      JSON.stringify({ success: liveResult.ok, changed: true, title, imageUrl, github: githubResult, live: liveResult }),
      { status: liveResult.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
