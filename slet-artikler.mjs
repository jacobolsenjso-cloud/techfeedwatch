// Sletter artikler, hvis kilde ikke dækker spørgsmålet (15/9-2026).
//
// Kilde: src/data/relevans2.json — artikler med karakter under GRAENSE_DAARLIG
// (Jacob besluttede 15/9: "de 30 der ikke dækker skal bare slettes").
// Alternativt: node slet-artikler.mjs --slugs a,b,c
//
// For hver artikel:
//  1) Indgående links fra andre sider fjernes (linkteksten bliver stående),
//     så der ikke opstår 404'er inde på sitet (fejlen fra august: 589 døde links).
//  2) 301-redirect til den mest beslægtede artikel, der overlever: samme emne
//     og flest fælles kerneord med søgespørgsmålet (faellesOrd). Både
//     /video/<slug>, /video/<slug>/ og /video/<youtubeId> omdirigeres.
//  3) .md og OG-billedet slettes.
// Til sidst køres sort-redirects.mjs. Intet committes — det gør Jacob/Claude bagefter.
//
// Kør: node slet-artikler.mjs --dry-run   (viser kun hvad der ville ske)
//      node slet-artikler.mjs
import fs from 'fs';
import { execSync } from 'child_process';
import { faellesOrd } from './src/lib/question.mjs';
import { GRAENSE_DAARLIG } from './src/lib/relevans.mjs';

const DRY = process.argv.includes('--dry-run');
const argSlugs = process.argv.includes('--slugs') ? process.argv[process.argv.indexOf('--slugs') + 1].split(',') : null;
const DIR = 'src/content/videos';

function laes(slug) {
  const raw = fs.readFileSync(`${DIR}/${slug}.md`, 'utf8');
  const f = (k) => raw.match(new RegExp(`^${k}:\\s*"(.*?)"`, 'm'))?.[1] || '';
  const tags = [...raw.matchAll(/^\s+-\s+"(.*?)"/gm)].map((m) => m[1]);
  return { slug, youtubeId: f('youtubeId'), targetQuestion: f('targetQuestion'), title: f('title'), date: f('date'), tags, raw };
}

const alle = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => laes(f.replace(/\.md$/, '')));
let slugs = argSlugs;
if (!slugs) {
  const r = JSON.parse(fs.readFileSync('src/data/relevans2.json', 'utf8'));
  slugs = Object.values(r).filter((x) => x.score !== null && x.score < GRAENSE_DAARLIG).map((x) => x.slug);
}
slugs = slugs.filter((s) => fs.existsSync(`${DIR}/${s}.md`));
const doede = new Set(slugs);
const overlever = alle.filter((a) => !doede.has(a.slug));
console.log(`Sletter ${slugs.length} artikler (${DRY ? 'TØR KØRSEL' : 'rigtigt'})\n`);

// Bedste erstatning: samme primære emne, flest fælles ord med spørgsmålet, nyeste som tie-break.
function erstatning(a) {
  const emne = a.tags[0];
  const kand = overlever.filter((b) => b.tags.includes(emne));
  const pulje = kand.length ? kand : overlever;
  const bedste = pulje
    .map((b) => ({ b, score: a.targetQuestion && b.targetQuestion ? faellesOrd(a.targetQuestion, b.targetQuestion) : 0 }))
    .sort((x, y) => y.score - x.score || y.b.date.localeCompare(x.b.date))[0];
  // Deler ingen artikel et eneste ord med spørgsmålet, er en tilfældig artikel i
  // emnet et dårligt mål for læseren — så peger vi på emnesiden i stedet.
  if (!bedste || bedste.score === 0) return { url: `/tag/${tagSlug(emne)}/`, tekst: `emnesiden ${emne}` };
  return { url: `/video/${bedste.b.slug}/`, tekst: `${bedste.b.tags[0]}, "${bedste.b.targetQuestion || bedste.b.title}"` };
}
// Samme regel som src/lib/tags.ts (tagSlug) — kopieret, fordi .ts ikke kan importeres her.
function tagSlug(tag) { return String(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

const redirects = [];
let linksFjernet = 0;
for (const slug of slugs) {
  const a = laes(slug);
  const til = erstatning(a);
  console.log(`- ${slug}\n    → ${til.url}  (${til.tekst})`);
  redirects.push(`/video/${slug} ${til.url} 301`, `/video/${slug}/ ${til.url} 301`);
  if (a.youtubeId) redirects.push(`/video/${a.youtubeId} ${til.url} 301`, `/video/${a.youtubeId}/ ${til.url} 301`);

  // Indgående links: [tekst](/video/slug) eller [tekst](/video/slug/) → tekst
  const re = new RegExp(`\\[([^\\]]*)\\]\\(/video/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?\\)`, 'g');
  for (const fil of ['src/content/videos', 'src/content/guides', 'src/content/glossary'].flatMap((d) => fs.existsSync(d) ? fs.readdirSync(d).map((f) => `${d}/${f}`) : [])) {
    if (fil.endsWith(`/${slug}.md`)) continue;
    const t = fs.readFileSync(fil, 'utf8');
    const n = (t.match(re) || []).length;
    if (!n) continue;
    linksFjernet += n;
    console.log(`    ${n} link fjernet i ${fil.split('/').pop()}`);
    if (!DRY) fs.writeFileSync(fil, t.replace(re, '$1'), 'utf8');
  }
  if (!DRY) {
    fs.unlinkSync(`${DIR}/${slug}.md`);
    try { fs.unlinkSync(`public/og/${slug}.jpg`); } catch { /* intet billede */ }
  }
}

console.log(`\n${slugs.length} artikler, ${redirects.length} redirect-regler, ${linksFjernet} indgående links fjernet.`);
if (!DRY) {
  fs.appendFileSync('public/_redirects', '\n' + redirects.join('\n') + '\n', 'utf8');
  execSync('node sort-redirects.mjs', { stdio: 'inherit' });
  console.log('Gjort. Kør npm run build og commit bagefter.');
}
