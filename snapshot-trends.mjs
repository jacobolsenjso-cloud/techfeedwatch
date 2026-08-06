// Gemmer månedens optælling, så /trends med tiden kan vise BEVÆGELSE og ikke
// bare et tal. Det er den halvdel af trend-arbejdet der ikke kan bygges — kun
// ventes på — og indtil nu ventede vi uden at gemme noget.
//
// Ét punkt pr. måned. Findes månedens punkt allerede, rører scriptet ikke ved
// det: et historisk tal må ikke ændre sig fordi nogen kørte scriptet igen.
//
// Ingen bagudrettede punkter. Arkivet blev fyldt op i juli — 33 artikler i juni
// mod 306 i juli — så en beregnet optælling pr. 1. juli ville vise at hvert
// eneste navn tidoblede sig. Det ville være opsamlingen, ikke en trend, og
// præcis den slags falske signal sitet er ved at komme af med.
//
// Brug: node snapshot-trends.mjs            (gemmer denne måneds punkt)
//       node snapshot-trends.mjs --force    (overskriver månedens punkt)
import fs from 'node:fs';
import path from 'node:path';
import { tally, cleanText } from './src/lib/trends.mjs';

const DIR = 'src/content/videos';
const OUT = 'src/data/trend-history.json';
const force = process.argv.includes('--force');
const month = new Date().toISOString().slice(0, 7); // fx "2026-08"

let history = { snapshots: {} };
if (fs.existsSync(OUT)) {
  try { history = JSON.parse(fs.readFileSync(OUT, 'utf8')); }
  catch (e) { console.error(`Kunne ikke læse ${OUT}: ${e.message}`); process.exit(1); }
}

if (history.snapshots[month] && !force) {
  console.log(`${month} er allerede gemt (${Object.keys(history.snapshots[month].counts).length} navne). Intet at gøre.`);
  console.log(`Punkter i alt: ${Object.keys(history.snapshots).length}`);
  process.exit(0);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const articles = files.map((f) => {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  const g = (k) => raw.match(new RegExp(`^${k}:\\s*"?([^"\\n\\r]*)"?\\s*$`, 'm'))?.[1] || '';
  // Brødteksten er ALT EFTER frontmatter. Sender man hele filen, tælles titel,
  // resumé og FAQ to gange — og tallene bliver dobbelt så høje som sidens.
  const fm = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
  return {
    title: g('title'),
    summary: g('summary'),
    faqs: raw.match(/^faqs:\r?\n([\s\S]*?)^---/m)?.[1] || '',
    body: fm ? raw.slice(fm[0].length) : raw,
    isShort: /^isShort:\s*true/m.test(raw),
  };
}).filter((a) => !a.isShort);

const { total, results } = tally(articles);

// Kun navn -> antal. Procenter kan altid regnes igen ud fra total, og et gemt
// procenttal ville forældes i samme sekund arkivet voksede.
const counts = Object.fromEntries(results.map((r) => [r.name, r.count]));

history.snapshots[month] = { total, counts, takenAt: new Date().toISOString().slice(0, 10) };
history.method = 'Antal artikler der nævner hvert navn. Samme regel som /trends. Ét punkt pr. måned.';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(history, null, 1) + '\n', 'utf8');

const keys = Object.keys(history.snapshots).sort();
console.log(`Gemt ${month}: ${results.length} navne af ${total} artikler`);
console.log(`Punkter i alt: ${keys.length} (${keys.join(', ')})`);
if (keys.length < 2) console.log('Serien kan først vise bevægelse ved punkt nummer to — altså næste måned.');
