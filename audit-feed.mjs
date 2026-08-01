import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const problems = [];
const note = (s) => { problems.push(s); console.log('❌ ' + s); };
const ok = (s) => console.log('✅ ' + s);

// --- RSS
{
  const rss = fs.readFileSync(`${DIST}/rss.xml`, 'utf-8');
  const items = (rss.match(/<item>/g) || []).length;
  const badAmp = (rss.match(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g) || []).length;
  const hasTitle = /<title>/.test(rss);
  const hasLink = /<link>/.test(rss);
  const pubDates = (rss.match(/<pubDate>([^<]+)</g) || []).map((m) => m.replace(/<\/?pubDate>?/g, ''));
  const badDates = pubDates.filter((d) => isNaN(new Date(d).getTime())).length;

  console.log(`\n=== RSS: ${items} poster, ${Math.round(rss.length / 1024)} kB`);
  if (!items) note('RSS har ingen poster');
  else ok(`${items} poster`);
  if (badAmp) note(`RSS: ${badAmp} uescapede &`); else ok('escaping i orden');
  if (!hasTitle || !hasLink) note('RSS mangler title eller link'); else ok('title og link til stede');
  if (badDates) note(`RSS: ${badDates} ugyldige pubDate`); else ok(`alle ${pubDates.length} datoer gyldige`);

  // Peger poster på levende sider?
  const links = [...rss.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]).filter((u) => u.includes('/video/'));
  const pages = new Set();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') pages.add(p.replace(/\\/g, '/').replace(/^dist/, '').replace(/index\.html$/, '').replace(/\/$/, ''));
    }
  })(DIST);
  const dead = links.filter((u) => !pages.has(new URL(u).pathname.replace(/\/$/, '')));
  if (dead.length) note(`RSS: ${dead.length} poster peger på sider der ikke findes (fx ${dead[0]})`);
  else ok(`alle ${links.length} artikel-links findes`);
}

// --- Structured data
{
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) files.push(p);
    }
  })(DIST);

  let blocks = 0, invalid = 0, missingType = 0;
  const badFiles = [];
  const typeCount = {};

  for (const f of files) {
    const html = fs.readFileSync(f, 'utf-8');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      blocks++;
      let parsed;
      try { parsed = JSON.parse(m[1]); }
      catch (e) { invalid++; if (badFiles.length < 5) badFiles.push(f + ': ' + e.message.slice(0, 60)); continue; }
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const o of arr) {
        if (!o['@type']) { missingType++; continue; }
        typeCount[o['@type']] = (typeCount[o['@type']] || 0) + 1;
      }
    }
  }

  console.log(`\n=== Structured data: ${blocks} JSON-LD-blokke på ${files.length} sider`);
  if (invalid) { note(`${invalid} blokke er ugyldig JSON`); badFiles.forEach((b) => console.log('     ' + b)); }
  else ok('alle blokke er gyldig JSON');
  if (missingType) note(`${missingType} objekter uden @type`); else ok('alle objekter har @type');
  console.log('   typer: ' + Object.entries(typeCount).map(([k, v]) => `${k} ${v}`).join(', '));

  // Artikelsider skal have både VideoObject og Article
  const sample = files.find((f) => f.includes('video') && f.endsWith('index.html'));
  if (sample) {
    const html = fs.readFileSync(sample, 'utf-8');
    const types = [...html.matchAll(/"@type"\s*:\s*"(\w+)"/g)].map((m) => m[1]);
    const need = ['VideoObject', 'Article', 'BreadcrumbList'];
    const miss = need.filter((t) => !types.includes(t));
    if (miss.length) note(`artikelside mangler schema: ${miss.join(', ')}`);
    else ok('artikelside har VideoObject, Article og BreadcrumbList');
  }
}

console.log(`\n=== ${problems.length} problemer`);
