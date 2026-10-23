// Omskriver gamle artikler med den nye opskrift ("søgning først"), N pr. kørsel (14/10-2026,
// Jacob: 5 om dagen, nyeste først). Kører på GitHub (workflow "Omskriv gamle artikler").
//
// Gammel artikel = ingen "## Sources" (skrevet med den gamle opskrift) og har et søgespørgsmål
// (targetQuestion — den nye opskrift kræver det). Hver omskrivning laver selv sit AI-billede,
// eller genbruger et eksisterende (add-video.mjs).
//
// Sikringer:
// - En artikel, som tjekkene stoppede, prøves ikke igen (src/data/omskriv-fejl.json) — ellers
//   ville den koste penge hver dag uden at lykkes. Den beholder sin gamle tekst.
// - 3 fejl i træk = stop (typisk tom Gemini-kredit, set 9.-10/10).
// - Hver kørsels resultat og MÅLTE pris (FORBRUG-linjerne) gemmes i src/data/omskriv-log.json.
// Kør: node omskriv-gamle.mjs --antal=5
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// 3 om dagen fra 16/10 (Jacob: prisen). Før 5.
const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=3').split('=')[1]) || 3;
const FEJL_FIL = './src/data/omskriv-fejl.json';
const LOG_FIL = './src/data/omskriv-log.json';
const laes = (f, std) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return std; } };
const fejl = laes(FEJL_FIL, {});

const gamle = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(`./src/content/videos/${f}`, 'utf8').replace(/\r/g, '');
  return {
    slug: f.replace(/\.md$/, ''),
    dato: raw.match(/^date:\s*"(.*)"/m)?.[1] || '',
    spm: raw.match(/^targetQuestion:\s*"(.*)"/m)?.[1] || '',
    ny: /^## Sources\s*$/m.test(raw),
    short: /^isShort:\s*true/m.test(raw),
  };
}).filter((a) => !a.ny && !a.short && a.spm && !fejl[a.slug]).sort((a, b) => b.dato.localeCompare(a.dato));

console.log(`${gamle.length} gamle artikler kan skrives om — tager ${Math.min(antal, gamle.length)} nu (nyeste først)`);
// --vis: vis kun, hvilke artikler der står for tur — intet skrives, intet koster
if (process.argv.includes('--vis')) { for (const a of gamle.slice(0, antal)) console.log(`  ${a.dato}  ${a.slug}`); process.exit(0); }
const kørsel = { dato: new Date().toISOString(), omskrevet: [], stoppet: [], usd: 0 };
let iTraek = 0;
for (const a of gamle.slice(0, antal)) {
  console.log(`\n=== ${a.slug} (${a.dato}) ===`);
  const r = spawnSync('node', ['add-video.mjs', '--erstat', a.slug], { encoding: 'utf8', maxBuffer: 1 << 26, env: process.env });
  const ud = `${r.stdout || ''}\n${r.stderr || ''}`;
  // Vis de vigtige linjer i GitHubs log (hele robotloggen er for stor til at blive vist)
  // 23/10: hjerne-linjen med i loggen, så man kan SE om stemmen var med i omskrivningen.
  for (const l of ud.split('\n')) if (/^(KILDETJEK|FORBRUG):|Succes!|Sprunget over|Fejl:|AI-billede|Hjernen er med/.test(l.trim().replace(/^🧠 /, ''))) console.log('  ' + l.trim());
  const f = JSON.parse(ud.match(/^FORBRUG: (\{.*\})/m)?.[1] || '{"usd":0}');
  kørsel.usd += f.usd || 0;
  const raw = fs.readFileSync(`./src/content/videos/${a.slug}.md`, 'utf8');
  if (/^## Sources\s*$/m.test(raw.replace(/\r/g, ''))) { kørsel.omskrevet.push(a.slug); iTraek = 0; }
  else {
    const grund = (ud.match(/(Sprunget over:[^\n]*|Fejl: [^\n]*)/) || [, 'ukendt'])[1].slice(0, 200);
    kørsel.stoppet.push({ slug: a.slug, grund });
    // Midlertidige fejl hos Google (500/503/429, overbelastet, timeout) er ikke artiklens skyld —
    // den prøves igen næste dag. Kun egentlige stop (tjek, relevans, manglende kilde) huskes.
    // (14/10: "programming can make you rich…" fik en 500-fejl og blev fejlagtigt opgivet.)
    const midlertidig = /\[(500|502|503|504|429)\b|Internal Server Error|overloaded|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED|ETIMEDOUT|ECONNRESET|fetch failed/i.test(grund);
    if (!midlertidig) fejl[a.slug] = grund;
    iTraek++;
    if (iTraek >= 3) { console.log('\nStopper: 3 i træk lykkedes ikke — tjek Gemini-kreditten (AI Studio -> Billing) og loggen.'); break; }
  }
}
kørsel.usd = Math.round(kørsel.usd * 10000) / 10000;
fs.writeFileSync(FEJL_FIL, JSON.stringify(fejl, null, 1) + '\n');
const log = laes(LOG_FIL, []);
log.push(kørsel);
fs.writeFileSync(LOG_FIL, JSON.stringify(log.slice(-60), null, 1) + '\n');
// Linjen læses af statusarbejdet. Ændr ikke formatet.
console.log(`\nOMSKRIV: ${JSON.stringify({ omskrevet: kørsel.omskrevet.length, stoppet: kørsel.stoppet.length, usd: kørsel.usd, tilbage: gamle.length - kørsel.omskrevet.length - kørsel.stoppet.length })}`);
