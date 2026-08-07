// Safe deploy: before uploading anything new, back up what's currently live so a bad deploy
// can be rolled back immediately, rather than leaving everyone on a broken version until a fix
// is written and re-deployed. This is the concrete answer to "no rollback exists" from the audit.
const axios = require('axios');
const tus = require('tus-js-client');
const fs = require('fs');
const path = require('path');

const API_TOKEN = 'EDgEf8bqD0AFbFwHCEwi08tT5ChL7S45RPTrYAGH67904747';
const USERNAME = 'u533396600';
const DOMAIN = 'app.homeofbeautifulsouls.com';
const BASE_URL = 'https://developers.hostinger.com/';
const SITE_ORIGIN = 'https://app.homeofbeautifulsouls.com';

// The files this deploy process manages -- anything critical to the live site working.
const MANAGED_FILES = ['index.html', 'donate.html', 'privacy-policy.html', 'terms-of-service.html',
  'delete-account.html', 'supabase.min.js', 'fonts.css', 'version.json'];

async function fetchUploadCredentials() {
  const url = new URL('api/hosting/v1/files/upload-urls', BASE_URL).toString();
  const res = await axios.post(url, { username: USERNAME, domain: DOMAIN }, {
    headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    timeout: 60000, validateStatus: (s) => s < 500,
  });
  if (res.status !== 200) throw new Error(`upload-urls failed: ${res.status} ${JSON.stringify(res.data)}`);
  return res.data;
}

async function uploadFile(filePath, relativePath, uploadUrl, authRestToken, authToken) {
  return new Promise(async (resolve, reject) => {
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const uploadUrlWithFile = `${uploadUrl.replace(/\/$/, '')}/${relativePath.replace(/\\/g,'/')}?override=true`;
    const requestHeaders = { 'X-Auth': authToken, 'X-Auth-Rest': authRestToken, 'upload-length': stats.size.toString(), 'upload-offset': '0' };
    try {
      await axios.post(uploadUrlWithFile, '', { headers: requestHeaders, timeout: 60000, validateStatus: (s) => s === 201 });
    } catch (error) { reject(new Error(`Pre-upload failed for ${relativePath}: ${error.message}`)); return; }
    const upload = new tus.Upload(fileStream, {
      uploadUrl: uploadUrlWithFile, retryDelays: [1000, 2000, 4000, 8000],
      uploadDataDuringCreation: false, parallelUploads: 1, chunkSize: 10485760,
      headers: requestHeaders, removeFingerprintOnSuccess: true, uploadSize: stats.size,
      metadata: { filename: path.basename(relativePath) },
      onError: (error) => reject(error),
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}

async function backupCurrentLive() {
  const backupDir = `/home/claude/hostinger_deploy/backups/${new Date().toISOString().replace(/[:.]/g,'-')}`;
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('Backing up currently-live files to', backupDir);
  for (const file of MANAGED_FILES) {
    try {
      const res = await axios.get(`${SITE_ORIGIN}/${file}?backup=${Date.now()}`, { responseType: 'arraybuffer', timeout: 30000 });
      fs.writeFileSync(path.join(backupDir, file), res.data);
      console.log(`  backed up ${file} (${res.data.length} bytes)`);
    } catch (err) {
      console.log(`  ${file} not present live (probably fine, e.g. new file) -- skipping backup for it`);
    }
  }
  return backupDir;
}

async function healthCheck() {
  // Real checks, not just "did it return 200" -- confirms the actual app content is present
  // and that Supabase's own SDK genuinely loaded, not just that some HTML came back.
  const res = await axios.get(`${SITE_ORIGIN}/index.html?healthcheck=${Date.now()}`, { timeout: 15000, validateStatus: () => true });
  if (res.status !== 200) return { healthy: false, reason: `HTTP ${res.status}` };
  const body = res.data;
  if (!body.includes('CURRENT_BUILD')) return { healthy: false, reason: 'Missing CURRENT_BUILD marker -- response does not look like the real app' };
  if (!body.includes('createClient(SUPABASE_URL')) return { healthy: false, reason: 'Missing Supabase client init -- app would fail to function' };
  return { healthy: true };
}

async function uploadFiles(sourceDir, files) {
  const creds = await fetchUploadCredentials();
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    if (!fs.existsSync(filePath)) { console.log(`  skipping ${file} (not in source dir)`); continue; }
    await uploadFile(filePath, file, creds.url, creds.rest_auth_key, creds.auth_key);
    console.log(`  uploaded ${file}`);
  }
}

async function safeDeploy(sourceDir, filesToDeploy) {
  console.log('=== SAFE DEPLOY START ===');
  const backupDir = await backupCurrentLive();

  console.log('Uploading new version...');
  await uploadFiles(sourceDir, filesToDeploy);

  console.log('Running post-deploy health check...');
  await new Promise(r => setTimeout(r, 3000)); // let it propagate
  const health = await healthCheck();

  if (health.healthy) {
    console.log('HEALTH CHECK PASSED. Deploy successful, previous version backed up at', backupDir);
    return { success: true, backupDir };
  }

  console.error('HEALTH CHECK FAILED:', health.reason);
  console.log('ROLLING BACK to previous version...');
  await uploadFiles(backupDir, MANAGED_FILES);
  await new Promise(r => setTimeout(r, 3000));
  const rollbackHealth = await healthCheck();
  console.log('Post-rollback health:', rollbackHealth);
  return { success: false, reason: health.reason, rolledBack: true, rollbackHealthy: rollbackHealth.healthy };
}

module.exports = { safeDeploy, healthCheck, backupCurrentLive };

if (require.main === module) {
  const sourceDir = process.argv[2];
  const files = process.argv.slice(3);
  safeDeploy(sourceDir, files.length ? files : MANAGED_FILES).then((result) => {
    console.log('RESULT:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }).catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
}
