// Gennemgang af læsbarhed på tværs af arkivet.
//
// Brug: node audit-readability.mjs           (alle artikler)
//       node audit-readability.mjs --omskrevne  (kun de omskrevne)
//       node audit-readability.mjs --liste    (skriv de tunge til en fil)
import fs from 'node:fs';
import path from 'node:path';
import { flesch } from './src/lib/readability.mjs';

const DIR = 'src/content/videos';
const kunOmskrevne = process.argv.includes('--omskrevne');
const skrivListe = process.argv.includes('--liste');

const MAAL_MIN = 60;   // plain English
const MAAL_MAX = 70;

const raekker = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (/^isShort:\s*true/m.test(raw)) continue;
  const omskrevet = /^rewrittenAt:/m.test(raw);
  if (kunOmskrevne && !omskrevet) continue;
  const fm = raw.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] || '';
  const r = flesch(raw.slice(fm.length));
  if (!r) continue;
  raekker.push({
    f, omskrevet,
    titel: (raw.match(/^title:\s*"([^"]+)"/m) || [])[1] || f,
    ...r,
  });
}

const spand = (lav, hoej) => raekker.filter((r) => r.score >= lav && r.score < hoej).length;
const snit = (l, k) => (l.reduce((s, x) => s + x[k], 0) / l.length);

console.log(`${raekker.length} artikler\n`);
console.log('=== fordeling (Flesch Reading Ease) ===');
console.log(`  under 30  ${String(spand(-999, 30)).padStart(4)}   meget tung`);
console.log(`  30-40     ${String(spand(30, 40)).padStart(4)}   universitetsniveau`);
console.log(`  40-50     ${String(spand(40, 50)).padStart(4)}   tung`);
console.log(`  50-60     ${String(spand(50, 60)).padStart(4)}   lidt under maalet`);
console.log(`  60-70     ${String(spand(60, 70)).padStart(4)}   MAALET — plain English`);
console.log(`  70 og op  ${String(spand(70, 999)).padStart(4)}   let`);

console.log(`\ngennemsnit: ${snit(raekker, 'score').toFixed(1)}`);
console.log(`  ord pr. sætning:      ${snit(raekker, 'ordPrSaetning').toFixed(1)}  (mål: 15-18)`);
console.log(`  stavelser pr. ord:    ${snit(raekker, 'stavPrOrd').toFixed(2)}  (mål: under 1.6)`);

const omskrevne = raekker.filter((r) => r.omskrevet);
const gamle = raekker.filter((r) => !r.omskrevet);
if (omskrevne.length && gamle.length) {
  console.log(`\n  omskrevne (${omskrevne.length}): ${snit(omskrevne, 'score').toFixed(1)}`);
  console.log(`  endnu ikke  (${gamle.length}): ${snit(gamle, 'score').toFixed(1)}`);
}

const tunge = raekker.filter((r) => r.score < MAAL_MIN).sort((a, b) => a.score - b.score);
console.log(`\n=== ${tunge.length} under ${MAAL_MIN} — de 10 tungeste ===`);
for (const r of tunge.slice(0, 10)) {
  console.log(`  ${r.score.toFixed(1).padStart(5)}  ${r.ordPrSaetning.toFixed(0)} ord/sætn · ${r.stavPrOrd.toFixed(2)} stav/ord  ${r.titel.slice(0, 44)}`);
}

if (skrivListe) {
  fs.writeFileSync('_tunge.txt', tunge.map((r) => r.f).join('\n') + '\n', 'utf8');
  console.log(`\n${tunge.length} skrevet til _tunge.txt`);
}
