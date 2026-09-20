// Tjekker at interne links peger på noget, der findes.
//
// Hvorfor filen findes: audit-links.mjs tjekker kun EKSTERNE links og
// YouTube-miniaturer. Ingen tjekkede de interne. Målt 20/9-2026: guiderne har
// 53 unikke interne links, hvoraf 27 peger på værktøjer og 27 på glossarord —
// alle levende i dag. Men slettes et værktøj eller et glossaropslag, dør de
// links stille, og ingen opdager det. Det er et VÆRN mod fremtidige huller,
// ikke en oprydning: kører det uden fund, er det svaret, ikke spild.
//
// Kører mod kildefilerne, ikke mod dist/, så det kan køre i robottens workflow
// uden et byg først.
//
// Kør: node audit-interne-links.mjs        (exit 1 hvis noget er dødt)
import fs from 'fs';
import path from 'path';

const MAPPER = ['src/content/guides', 'src/content/glossary', 'src/content/pages', 'src/content/videos'];

const filnavne = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : []);
const tagSlug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Hvad findes? Slås op i de samme kilder, som sitet selv bygger siderne af.
const findes = {
  video: new Set(filnavne('src/content/videos')),
  glossary: new Set(filnavne('src/content/glossary')),
  guides: new Set(filnavne('src/content/guides')),
  tools: new Set(),
  tag: new Set(),
};
{
  const t = fs.readFileSync('src/lib/tools.ts', 'utf8');
  for (const m of t.matchAll(/slug:\s*['"]([^'"]+)['"]/g)) findes.tools.add(m[1]);
  // Værktøjs-kategorier har deres egen side (/tools/<kategori>)
  for (const m of t.matchAll(/category:\s*['"]([^'"]+)['"]/g)) findes.tools.add(tagSlug(m[1]));
  const g = fs.readFileSync('src/lib/tags.ts', 'utf8');
  for (const m of g.matchAll(/['"]([^'"]+)['"]\s*:/g)) findes.tag.add(tagSlug(m[1]));
}

// Sider uden egen mappe-logik. /archive og /page har dynamiske undersider, som
// ikke kan slås op her — de springes over med vilje frem for at melde falsk alarm.
const STATISKE = new Set(['', 'latest', 'popular', 'library', 'trends', 'search', 'history', 'watch-later', 'sitemap', 'glossary', 'guides', 'tools', 'rss.xml']);
const SPRING_OVER = new Set(['archive', 'page', 'author', 'video-sitemap.xml']);
for (const s of filnavne('src/content/pages')) STATISKE.add(s);

const doede = [];
let tjekket = 0;
for (const mappe of MAPPER) {
  if (!fs.existsSync(mappe)) continue;
  for (const f of fs.readdirSync(mappe).filter((x) => x.endsWith('.md'))) {
    const tekst = fs.readFileSync(path.join(mappe, f), 'utf8');
    for (const m of tekst.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      const raa = m[1].split('#')[0].split('?')[0];
      const dele = raa.replace(/\/$/, '').split('/').filter(Boolean);
      tjekket++;
      const sektion = dele[0] ?? '';
      const rest = dele[1];
      if (SPRING_OVER.has(sektion)) continue;
      if (!rest) {
        if (!STATISKE.has(sektion)) doede.push({ fil: `${mappe}/${f}`, link: raa, hvorfor: 'ukendt side' });
        continue;
      }
      if (!(sektion in findes)) { doede.push({ fil: `${mappe}/${f}`, link: raa, hvorfor: `ukendt sektion "${sektion}"` }); continue; }
      if (!findes[sektion].has(rest)) doede.push({ fil: `${mappe}/${f}`, link: raa, hvorfor: `findes ikke i ${sektion}` });
    }
  }
}

console.log(`Tjekket ${tjekket} interne links i ${MAPPER.length} indholdsmapper.`);
if (doede.length === 0) {
  console.log('✅ Alle interne links peger på noget, der findes.');
  process.exit(0);
}
console.log(`\n❌ ${doede.length} døde interne link(s):`);
for (const d of doede) console.log(`   ${d.fil.split('/').pop()}\n      ${d.link}  — ${d.hvorfor}`);
process.exit(1);
