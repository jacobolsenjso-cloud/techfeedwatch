import fs from 'fs';
import path from 'path';

// Gennemgår alle byggede HTML-sider og tjekker at hvert internt link peger på
// noget der faktisk findes i dist/ — eller er dækket af en regel i _redirects.

const DIST = './dist';
const htmlFiles = [];

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

// Alle stier der findes som en rigtig side
const pages = new Set();
for (const f of htmlFiles) {
  let rel = f.replace(/\\/g, '/').replace(/^\.?\/?dist/, '').replace(/index\.html$/, '').replace(/\.html$/, '');
  if (!rel.endsWith('/')) rel += '/';
  pages.add(rel);
}

// Statiske filer i public/ og dist-roden (billeder, xml, txt osv.)
const assets = new Set();
(function walkAssets(dir, base = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walkAssets(path.join(dir, e.name), `${base}/${e.name}`);
    else assets.add(`${base}/${e.name}`);
  }
})(DIST);

// Redirect-regler (understøtter /foo/* wildcards)
const redirectExact = new Set();
const redirectPrefix = [];
if (fs.existsSync('./public/_redirects')) {
  for (const line of fs.readFileSync('./public/_redirects', 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const from = t.split(/\s+/)[0];
    if (from.endsWith('/*')) redirectPrefix.push(from.slice(0, -2));
    else redirectExact.add(from);
  }
}

const covered = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return true;
  const withSlash = clean.endsWith('/') ? clean : clean + '/';
  if (pages.has(withSlash)) return true;
  if (assets.has(clean)) return true;
  if (redirectExact.has(clean) || redirectExact.has(clean.replace(/\/$/, ''))) return true;
  if (redirectPrefix.some((p) => clean.startsWith(p))) return true;
  return false;
};

const broken = new Map();
let checked = 0;

for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf-8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const page = f.replace(/\\/g, '/').replace(/^\.?\/?dist/, '');
  for (const href of hrefs) {
    if (!href.startsWith('/')) continue;      // eksterne og ankre springes over
    if (href.startsWith('//')) continue;
    if (href.includes('${') || href.includes("' +")) continue; // JS-skabeloner, ikke rigtige links
    checked++;
    if (!covered(href)) {
      if (!broken.has(href)) broken.set(href, new Set());
      broken.get(href).add(page);
    }
  }
}

console.log(`Sider gennemgået : ${htmlFiles.length}`);
console.log(`Interne links    : ${checked}`);
console.log(`Unikke brudte    : ${broken.size}\n`);

if (broken.size === 0) {
  console.log('✅ Ingen brudte interne links.');
} else {
  for (const [href, onPages] of [...broken.entries()].sort((a, b) => b[1].size - a[1].size)) {
    const list = [...onPages];
    console.log(`❌ ${href}  (på ${list.length} side(r), fx ${list[0]})`);
  }
}
