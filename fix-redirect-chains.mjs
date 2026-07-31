import fs from 'fs';
import path from 'path';

// De oprindelige 465 redirects (gammelt /video/{videoId} -> titel-slug) blev lavet
// før Shorts-sektionen blev nedlagt. 200 af dem peger nu på slugs der ikke findes
// længere, så de sender brugeren 301 -> 404.
//
// Her peges de i stedet direkte på den emne-side, som den slettede Short selv
// blev omdirigeret til. Ét hop, ingen blindgyde.
//
// Kør: node fix-redirect-chains.mjs

const REDIRECTS = 'public/_redirects';
const DIST = 'dist';

// Hvilke sider findes rent faktisk efter build?
const pages = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') {
      const rel = p.replace(/\\/g, '/').replace(/^dist/, '').replace(/index\.html$/, '');
      pages.add(rel.replace(/\/$/, '') || '/');
    }
  }
})(DIST);

const norm = (u) => (u || '').split('#')[0].replace(/\/$/, '') || '/';
const exists = (u) => pages.has(norm(u));

const lines = fs.readFileSync(REDIRECTS, 'utf-8').split(/\r?\n/);

// Byg opslag: slettet slug -> emne-side (fra Shorts-blokken)
const shortToTag = new Map();
for (const line of lines) {
  const m = line.trim().match(/^(\/video\/\S+)\s+(\/tag\/\S+)\s+301$/);
  if (m) shortToTag.set(norm(m[1]), m[2]);
}

let fixed = 0, stillDead = 0;
const out = lines.map((line) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return line;

  const parts = t.split(/\s+/);
  if (parts.length < 3) return line;
  const [from, to, code] = parts;
  if (from.includes('*') || to.includes(':splat')) return line;
  if (exists(to)) return line;                       // målet er fint

  const target = shortToTag.get(norm(to));
  if (target) {
    fixed++;
    return `${from} ${target} ${code}`;
  }
  stillDead++;
  console.log(`⚠️  Uløst: ${from} -> ${to}`);
  return line;
});

fs.writeFileSync(REDIRECTS, out.join('\n'));
console.log(`\n✅ Rettede ${fixed} redirects der pegede på slettede Shorts.`);
if (stillDead) console.log(`⚠️  ${stillDead} kunne ikke løses automatisk.`);
