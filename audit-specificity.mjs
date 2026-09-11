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

// Ord der starter med stort midt i en sætning = sandsynligt navn (produkt, firma, person).
// Sætningsstart, overskrifter og almindelige ord frasorteres.
const ALMINDELIGE = new Set(['The','A','An','This','That','These','Those','It','In','On','At','For','With','By','From','To','As','And','But','Or','If','When','While','Where','Why','How','What','Which','Who','Yes','No','However','Instead','Although','Because','Beyond','Understanding','Key','Bottom','Line','Practical','Common','Core','Modern','Real','New','Future','Digital','Human','Global','Major','First','Second','Third','Finally','Ultimately','Overall','Both','Many','Most','Some','Each','Every','Another','Other','Such','Their','Its','Our','Your','His','Her','They','We','You','I','AI','Artificial','Intelligence','Machine','Learning','Large','Language','Models','Model','Data','Cloud','Internet','Web','Software','Hardware','Technology','Tech','Business','Businesses','Companies','Company','Organizations','Organisations','Users','Developers','Engineers','Security','Cybersecurity','Financial','Finance','Fintech','Crypto','Blockchain','Bitcoin','Ethereum','Quantum','Computing','Video','Videos','Content','Search','Google']);
const rows = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf8');
  if (/^isShort:\s*true/m.test(raw)) continue;
  const parts = raw.split(/^---\s*$/m);
  const fm = parts[1] || '', body = (parts[2] || '').replace(/^#+.*$/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const title = (fm.match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || f;
  const channel = (fm.match(/^channelTitle:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
  const words = body.split(/\s+/).filter(Boolean).length;
  // Tal med betydning: procent, valuta, årstal, tusinder, enheder — ikke "3 to 6"-fyld alene
  const tal = (body.match(/(\$|€|£)\s?\d[\d.,]*|\d[\d.,]*\s?(%|percent|million|billion|trillion|k\b|GB|TB|MB|ms|seconds|minutes|hours|days|weeks|months|years|x\b)|\b(19|20)\d\d\b/g) || []).length;
  // Navne: stort begyndelsesbogstav midt i sætning, ikke i frasorteringslisten, mindst 3 tegn
  const navne = new Set();
  for (const m of body.matchAll(/(?<=[a-z,;:]\s)([A-Z][A-Za-z0-9.+-]{2,}(?:\s[A-Z][A-Za-z0-9.+-]{2,})*)/g)) {
    const n = m[1].trim(); if (!ALMINDELIGE.has(n.split(' ')[0])) navne.add(n);
  }
  const citater = (body.match(/"[^"]{20,}"|“[^”]{20,}”/g) || []).length;
  const naevnerKilde = channel && body.includes(channel.split('|')[0].trim().split(' ')[0]) ? 1 : 0;
  const score = tal * 2 + navne.size + citater * 3 + naevnerKilde * 3;
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
