// Måler hvor KONKRET hver artikel er. Læser kun.
//
// Hvorfor: AdSense afviser "low value content", og det afgørende er ikke om
// teksten er pæn, men om den siger noget, der ikke kunne stå i enhver artikel om
// emnet. Konkret = tal, navngivne produkter/firmaer/personer, citater, årstal.
// En artikel uden noget af det læses som "AI-generelt", uanset hvor godt den er
// skrevet.
//
// Kør: node audit-specificity.mjs [--vis 15]   (viser de N svageste)
import fs from 'fs';
const DIR = 'src/content/videos';
const vis = process.argv.includes('--vis') ? +(process.argv[process.argv.indexOf('--vis') + 1] || 15) : 0;

import { konkretScore, renTekst } from './src/lib/konkret.mjs';
// Formlen ligger i src/lib/konkret.mjs (konkretScore), så robotten kræver det
// samme, som denne fil måler.
const rows = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf8');
  if (/^isShort:\s*true/m.test(raw)) continue;
  const parts = raw.split(/^---\s*$/m);
  const fm = parts[1] || '', body = parts[2] || '';
  const title = (fm.match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || f;
  const channel = (fm.match(/^channelTitle:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
  const words = renTekst(body).split(/\s+/).filter(Boolean).length;
  const { tal, navne: navneAntal, citater, naevnerKilde, score } = konkretScore(body, channel);
  const navne = { size: navneAntal };
  rows.push({ f, title, words, tal, navne: navne.size, citater, naevnerKilde, score, rewritten: /^rewrittenAt:/m.test(fm), tq: /^targetQuestion:/m.test(fm) });
}
rows.sort((a, b) => a.score - b.score);
const n = rows.length;
const under = (k) => rows.filter((r) => r.score < k).length;
const avg = (arr, k) => (arr.reduce((s, r) => s + r[k], 0) / Math.max(1, arr.length)).toFixed(1);
console.log(`Artikler: ${n}`);
console.log(`Score = tal×2 + navne + citater×3 + nævner kilden×3`);
console.log(`  score 0–4 (intet konkret):      ${under(5)}  (${Math.round(under(5) / n * 100)} %)`);
console.log(`  score 5–9 (lidt):               ${under(10) - under(5)}`);
console.log(`  score 10+ (konkret):            ${n - under(10)}  (${Math.round((n - under(10)) / n * 100)} %)`);
console.log(`  uden ét eneste tal:             ${rows.filter((r) => r.tal === 0).length}`);
console.log(`  uden ét eneste navn:            ${rows.filter((r) => r.navne === 0).length}`);
console.log(`  nævner kilde-kanalen i teksten: ${rows.filter((r) => r.naevnerKilde).length}`);
console.log(`  citater overhovedet:            ${rows.filter((r) => r.citater > 0).length}`);
const old = rows.filter((r) => r.rewritten), nye = rows.filter((r) => !r.rewritten);
console.log(`Gennemsnit — omskrevne (${old.length}): ord ${avg(old, 'words')}, tal ${avg(old, 'tal')}, navne ${avg(old, 'navne')}, score ${avg(old, 'score')}`);
console.log(`Gennemsnit — nye robot  (${nye.length}): ord ${avg(nye, 'words')}, tal ${avg(nye, 'tal')}, navne ${avg(nye, 'navne')}, score ${avg(nye, 'score')}`);
if (vis) { console.log(`\nDe ${vis} svageste:`); rows.slice(0, vis).forEach((r) => console.log(`  ${String(r.score).padStart(3)}  ${r.words} ord  tal ${r.tal} navne ${r.navne}  ${r.title.slice(0, 70)}`)); }
fs.writeFileSync('_specificity.json', JSON.stringify(rows, null, 1));
console.log('\nSkrevet: _specificity.json');
