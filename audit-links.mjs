import fs from 'fs';
import path from 'path';

// To ting der aldrig er blevet tjekket:
//  1) eksterne links — de kan være døde uden at nogen opdager det
//  2) YouTube-miniaturer — maxresdefault findes ikke for alle videoer
//
// Kør: node audit-links.mjs

const DIST = 'dist';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(DIST);

// --- Saml eksterne links ---
const external = new Map();   // url -> antal sider
for (const f of files) {
  const html = fs.readFileSync(f, 'utf-8');
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (u.includes('techfeedwatch.com')) continue;
    const clean = u.split('#')[0];
    external.set(clean, (external.get(clean) || 0) + 1);
  }
}

const urls = [...external.entries()].sort((a, b) => b[1] - a[1]);
console.log(`Unikke eksterne links: ${urls.length}\n`);

const check = async (url) => {
  try {
    // HEAD først; nogle servere afviser HEAD, så fald tilbage til GET
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (r.status === 405 || r.status === 403 || r.status === 501) {
      r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000) });
    }
    return r.status;
  } catch (e) {
    return 'FEJL: ' + (e.name === 'TimeoutError' ? 'timeout' : e.message.slice(0, 40));
  }
};

const broken = [];
let i = 0;
for (const [url, count] of urls) {
  i++;
  const status = await check(url);
  const bad = typeof status === 'string' || status >= 400;
  if (bad) {
    broken.push({ url, count, status });
    console.log(`❌ ${String(status).padEnd(16)} ${url}  (på ${count} sider)`);
  }
  if (i % 10 === 0) process.stdout.write(`   ...${i}/${urls.length}\n`);
}

console.log(`\n=== ${broken.length} brudte eksterne links af ${urls.length}\n`);

// --- Miniaturer ---
// Artiklerne bruger maxresdefault i schema og på lead-kortet, mqdefault i grids.
// maxresdefault findes ikke for alle videoer og giver da et gråt 120x90-billede.
const videos = fs.readdirSync('src/content/videos').filter((f) => f.endsWith('.md'));
const ids = videos.map((f) => {
  const c = fs.readFileSync(`src/content/videos/${f}`, 'utf-8');
  return (c.match(/youtubeId:\s*"(.*?)"/) || [])[1];
}).filter(Boolean);

console.log(`Tjekker ${ids.length} miniaturer (maxresdefault)...`);
let missingMax = 0;
const missingList = [];
for (let k = 0; k < ids.length; k++) {
  const id = ids[k];
  try {
    const r = await fetch(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`, { method: 'GET', signal: AbortSignal.timeout(10000) });
    // YouTube svarer 404 hvis maxres ikke findes
    if (!r.ok) { missingMax++; missingList.push(id); }
  } catch { missingMax++; missingList.push(id); }
  if ((k + 1) % 50 === 0) process.stdout.write(`   ...${k + 1}/${ids.length}\n`);
}

console.log(`\n=== ${missingMax} af ${ids.length} videoer mangler maxresdefault`);
fs.writeFileSync('audit-links.json', JSON.stringify({ broken, missingMax, missingList }, null, 1));
