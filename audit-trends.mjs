// Måler datagrundlaget for trend-analysen: hvor mange artikler, hvilke måneder,
// hvilke kanaler og hvilke tags — og tæller navnene som /trends viser.
// Deler ordliste og regel med siden via src/lib/trends.mjs, men når frem til
// tallene ad sin egen vej (egen frontmatter-parser). Er de to enige, er tallet
// sandsynligvis rigtigt; er de uenige, er der en fejl i den ene udtrækning.
// Læser src/content/videos direkte, så den kræver IKKE et build først —
// modsat de øvrige audit-scripts der læser dist/. Ændrer intet.
import fs from 'node:fs';
import path from 'node:path';
import { tally } from './src/lib/trends.mjs';

const DIR = 'src/content/videos';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));

// Meget simpel frontmatter-parser. Vi henter kun de felter vi skal bruge,
// så vi undgår at hive en YAML-pakke ind for en ren måling.
function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const body = m[1];
  const one = (key) => {
    const r = body.match(new RegExp(`^${key}:\\s*"?([^"\\n\\r]*)"?\\s*$`, 'm'));
    return r ? r[1].trim() : null;
  };
  // tags står som en liste af "- \"Navn\"" linjer under tags:
  const tagBlock = body.match(/^tags:\r?\n((?:\s*-\s*.*\r?\n?)*)/m);
  const tags = tagBlock
    ? tagBlock[1].split(/\r?\n/).map(l => l.replace(/^\s*-\s*/, '').replace(/^"|"$/g, '').trim()).filter(Boolean)
    : [];
  // Titel, resumé og FAQ-blokken tælles med i navne-optællingen — de er
  // artiklens egne ord og vises på siden. Kanalnavn og tags tælles ikke.
  const faqBlock = body.match(/^faqs:\r?\n([\s\S]*)$/m);
  const article = raw.slice(m[0].length); // brødteksten efter frontmatter
  return {
    date: one('date'), publishedAt: one('publishedAt'), channel: one('channelTitle'), tags,
    title: one('title'), summary: one('summary'), faqs: faqBlock ? faqBlock[1] : '', body: article,
  };
}

const rows = [];
let unparsed = 0;
for (const f of files) {
  const p = parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (!p) { unparsed++; continue; }
  rows.push(p);
}

const count = (arr) => arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
const top = (obj, n = 99) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
const month = (d) => (d || '').slice(0, 7);

const artMonths = count(rows.map(r => month(r.date)).filter(Boolean));
const vidMonths = count(rows.map(r => month(r.publishedAt)).filter(Boolean));
const channels = count(rows.map(r => r.channel).filter(Boolean));
const tags = count(rows.flatMap(r => r.tags));

console.log('FILER:', files.length, '| PARSET:', rows.length, '| FEJLET:', unparsed);
console.log('\nARTIKEL-DATO pr. maaned (hvornaar robotten udgav):');
for (const [m, c] of Object.entries(artMonths).sort()) console.log(' ', m, c);
console.log('\nVIDEO-DATO pr. maaned (hvornaar kilden udkom):');
for (const [m, c] of Object.entries(vidMonths).sort()) console.log(' ', m, c);
console.log('\nKANALER:', Object.keys(channels).length);
for (const [k, c] of top(channels)) console.log(' ', c, k);
console.log('\nTAGS:', Object.keys(tags).length);
for (const [k, c] of top(tags)) console.log(' ', c, k);

// --- Navne-optælling: samme liste og samme regel som /trends bruger ---
const { total, results } = tally(rows);
console.log('\nNAVNE (antal artikler der naevner dem), af', total);
for (const r of results) {
  console.log(String(r.count).padStart(4), String(r.share + '%').padStart(6), ' ', r.name, `(${r.group})`);
}
