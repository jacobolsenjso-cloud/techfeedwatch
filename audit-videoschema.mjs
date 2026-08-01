import fs from 'fs';
import path from 'path';

// Validerer hvert VideoObject på sitet mod Googles krav:
//   påkrævet:  name, thumbnailUrl, uploadDate, description
//   anbefalet: contentUrl ELLER embedUrl
// https://developers.google.com/search/docs/appearance/structured-data/video

const DIST = 'dist';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(DIST);

const REQUIRED = ['name', 'thumbnailUrl', 'uploadDate', 'description'];
let total = 0;
const bad = [];

const isEmpty = (v) =>
  v === undefined || v === null || v === '' ||
  (Array.isArray(v) && (v.length === 0 || v.every((x) => !x)));

for (const f of files) {
  const html = fs.readFileSync(f, 'utf-8');
  const page = f.replace(/\\/g, '/').replace(/^dist/, '').replace(/index\.html$/, '');

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    const arr = Array.isArray(parsed) ? parsed : [parsed];

    for (const o of arr) {
      if (o['@type'] !== 'VideoObject') continue;
      total++;

      const missing = REQUIRED.filter((k) => isEmpty(o[k]));
      if (isEmpty(o.contentUrl) && isEmpty(o.embedUrl)) missing.push('contentUrl/embedUrl');

      // uploadDate skal være en gyldig ISO-dato
      if (!isEmpty(o.uploadDate) && isNaN(new Date(o.uploadDate).getTime())) missing.push('uploadDate ugyldig');

      if (missing.length) bad.push({ page, missing });
    }
  }
}

console.log(`VideoObject-blokke i alt : ${total}`);
console.log(`Med problemer            : ${bad.length}\n`);
bad.slice(0, 20).forEach((b) => console.log(`❌ ${b.page}\n     mangler: ${b.missing.join(', ')}`));

// Findes der VideoObject uden for artikelsiderne? (fx i et værktøj)
const outside = bad.filter((b) => !b.page.startsWith('/video/'));
if (outside.length) console.log(`\n⚠️  ${outside.length} af dem ligger uden for /video/`);
if (!bad.length) console.log('✅ Alle VideoObjects opfylder Googles krav.');
