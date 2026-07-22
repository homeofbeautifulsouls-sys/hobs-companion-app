// Keeps donate.html's static <head> meta tags (og:title, og:description, og:image, twitter:*)
// in sync with whatever donation campaign is currently active. This exists because GitHub Pages
// is pure static hosting and donate.html loads its campaign data client-side via JS -- but link
// unfurlers (WhatsApp, iMessage, Facebook, Slack) read the raw HTML <head> BEFORE any JS runs,
// so a campaign photo set in the admin panel would never show up in a shared-link preview unless
// it's baked into the actual file on disk. Called from the admin panel right after a campaign is
// saved. Reads the current active campaign, then commits an updated donate.html straight to the
// repo via GitHub's Contents API (get file -> patch just the meta block -> PUT with the prior
// sha). Best-effort: if this fails, the campaign itself is still saved fine in Supabase and the
// live donate page still works correctly via its own JS -- only the link-preview image lags
// until this succeeds (a retry, or the next save, fixes it).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GITHUB_PAT = Deno.env.get("GITHUB_PAT");
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
    const description = rawDescription.length <= 300 ? rawDescription : rawDescription.slice(0, rawDescription.lastIndexOf(" ", 297)) + "…";
    // Falls back to the app's own logo (already hosted on the same repo) if no campaign
    // photo has been set, so a share preview is never blank even before any image is uploaded.
    const imageUrl = (campaign && campaign.image_url) || "https://homeofbeautifulsouls-sys.github.io/hobs-companion-app/logo.png";

    // 2. Fetch the current donate.html + its sha (required by GitHub to update an existing file).
    const ghHeaders = { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json" };
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, { headers: ghHeaders });
    if (!getRes.ok) {
      return new Response(JSON.stringify({ error: "Could not fetch donate.html from GitHub", detail: await getRes.text() }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const getJson = await getRes.json();
    const sha = getJson.sha;
    const rawBytes = Uint8Array.from(atob(getJson.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
    const currentContent = new TextDecoder("utf-8").decode(rawBytes);

    // 3. Replace just the meta-tag block. Matches the existing og:title/og:description lines
    // exactly as they are today, plus adds og:image/twitter:* if they aren't present yet.
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

    // 4. Commit the update.
    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Update donate.html meta tags for campaign: ${title}`,
        content: bytesToBase64(new TextEncoder().encode(newContent)),
        sha,
      }),
    });
    if (!putRes.ok) {
      return new Response(JSON.stringify({ error: "Could not commit donate.html update", detail: await putRes.text() }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, changed: true, title, imageUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
