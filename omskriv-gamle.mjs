// Omskriver gamle artikler med den nye opskrift, N pr. kørsel (14/10-2026, Jacob: 5 om dagen,
// nyeste først). Kører på GitHub (workflow "Omskriv gamle artikler").
//
// 25/10 (Jacob): ALLE artikler skrives om med opskrift 3 (journalist-regler, klassetrin 9-10,
// faktatjek - add-video.mjs). Gammel artikel = mangler "recipe: 3" i frontmatter og har et
// søgespørgsmål (targetQuestion — opskriften kræver det). Før: mangler "## Sources". Hver omskrivning laver selv sit AI-billede,
// eller genbruger et eksisterende (add-video.mjs).
//
// Sikringer:
// - En artikel, som tjekkene stoppede, prøves ikke igen (src/data/omskriv-fejl.json) — ellers
//   ville den koste penge hver dag uden at lykkes. Den beholder sin gamle tekst.
// - 3 fejl i træk = stop (typisk tom Gemini-kredit, set 9.-10/10).
// - Hver kørsels resultat og MÅLTE pris (FORBRUG-linjerne) gemmes i src/data/omskriv-log.json.
// Kør: node omskriv-gamle.mjs --antal=8 [--parallelt=4]
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { laesHjerne } from './src/lib/hjerne.mjs';

// 5 om dagen fra 25/10 (Jacob). 16/10-25/10: 3 (prisen).
const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=8').split('=')[1]) || 8;
// 24/10 (Jacob): --kun=<slug> + --nyvideo=<url> målretter én bestemt artikel — fx når en
// allerede udgivet artikel viser sig at bygge på en dårlig video (set 24/10: fabrikskanal
// med baggrundsmusik oven i stemmen). --kun springer "gammel"-filteret over (artiklen må
// gerne have ## Sources), og --nyvideo giver add-video en NY video — uden den genbruger
// --erstat artiklens gamle youtubeId, og så ville musikken bare komme igen.
const kun = (process.argv.find((a) => a.startsWith('--kun=')) || '').split('=')[1] || '';
const nyVideo = ((process.argv.find((a) => a.startsWith('--nyvideo=')) || '').split('=').slice(1).join('=')) || '';
const FEJL_FIL = './src/data/omskriv-fejl.json';
const LOG_FIL = './src/data/omskriv-log.json';
const laes = (f, std) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return std; } };
const fejl = laes(FEJL_FIL, {});
// 25/10 (Jacob: artikler må ikke springes over): en artikel, der stoppede under opskrift 3, prøves
// igen efter 7 dage - Gemini skriver forskelligt hver gang - højst 3 gange i alt. Derefter står den i
// status til Jacob og faktatjekkes i stedet (faktatjek-gamle.mjs).
const MAKS_FORSOEG = 3;
const opgivet = (f) => f?.recipe === 3 && ((f.forsoeg || 1) >= MAKS_FORSOEG || (Date.now() - Date.parse(f.dato || 0)) < 7 * 864e5);
// 25/10 (Jacob: "én opskrift til alle artikler, nye som gamle"): artikler, Google har vist
// (Search Console, 3 mdr.), skrives om først; derefter alle andre, nyeste først. Indtil de når
// frem, faktatjekkes de uden omskrivning (faktatjek-gamle.mjs).
const prioFil = laes('./src/data/omskriv-prioritet.json', null);
const prio = prioFil ? new Set(prioFil.slugs) : null;

const alle = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(`./src/content/videos/${f}`, 'utf8').replace(/\r/g, '');
  return {
    slug: f.replace(/\.md$/, ''),
    dato: raw.match(/^date:\s*"(.*)"/m)?.[1] || '',
    spm: raw.match(/^targetQuestion:\s*"(.*)"/m)?.[1] || '',
    ny: /^recipe:\s*3\b/m.test(raw),
    short: /^isShort:\s*true/m.test(raw),
  };
});

// --kun: tag præcis dén artikel (kræver stadig targetQuestion — uden spørgsmål kan
// den nye opskrift ikke skrive den). Ellers: den normale kø af gamle artikler.
const gamle = kun
  ? alle.filter((a) => kun.split(',').includes(a.slug) && a.spm) // 25/10: flere slugs med komma
  : alle.filter((a) => !a.ny && !a.short && a.spm && !opgivet(fejl[a.slug]))
    .sort((a, b) => (prio ? Number(!prio.has(a.slug)) - Number(!prio.has(b.slug)) : 0) || b.dato.localeCompare(a.dato));
if (kun && !gamle.length) { console.log(`Fejl: --kun=${kun} findes ikke (eller mangler targetQuestion).`); process.exit(1); }

console.log(kun
  ? `Målrettet omskrivning af "${kun}"${nyVideo ? ' med ny video' : ''}`
  : `${gamle.length} gamle artikler kan skrives om — tager ${Math.min(antal, gamle.length)} nu (Google-viste først, så nyeste)`);
// --vis: vis kun, hvilke artikler der står for tur — intet skrives, intet koster
if (process.argv.includes('--vis')) { for (const a of gamle.slice(0, antal)) console.log(`  ${a.dato}  ${a.slug}`); process.exit(0); }
// 25/10: uden Jacobs hjerne startes ingen omskrivning (ellers betales research for intet - add-video stopper alligevel).
if (!laesHjerne()) { console.log('Stop: hjernen mangler (_hjerne / HJERNE_DIR) - ingen omskrivning uden Jacobs stemme.'); process.exit(1); }
const kørsel = { dato: new Date().toISOString(), omskrevet: [], stoppet: [], usd: 0 };
// 25/10 (Jacob: 8 om dagen): op til PARALLELT omskrivninger ad gangen. Én tager ca. 26 min (målt
// 25/10), så 8 i træk ville spærre robottens kø i 3,5 time. Hver omskrivning skriver kun sine egne
// filer (artikel, billede, cache pr. video), så de kan køre samtidig.
const PARALLELT = Number((process.argv.find((x) => x.startsWith('--parallelt=')) || '--parallelt=4').split('=')[1]) || 4;
const koersel1 = (a) => new Promise((resolve) => {
  const foer = fs.readFileSync(`./src/content/videos/${a.slug}.md`, 'utf8');
  // --nyvideo lægges FØR --erstat: add-video tager URL'en som første argument.
  const p = spawn('node', ['add-video.mjs', ...(nyVideo ? [nyVideo] : []), '--erstat', a.slug], { env: process.env });
  let ud = '';
  p.stdout.on('data', (d) => { ud += d; });
  p.stderr.on('data', (d) => { ud += d; });
  p.on('close', () => resolve({ a, foer, ud }));
  p.on('error', (e) => resolve({ a, foer, ud: `Fejl: ${e.message}` }));
});
let iTraek = 0, stop = false;
const valgte = gamle.slice(0, antal);
for (let i = 0; i < valgte.length && !stop; i += PARALLELT) {
  const runde = await Promise.all(valgte.slice(i, i + PARALLELT).map(koersel1));
  for (const { a, foer, ud } of runde) {
    console.log(`\n=== ${a.slug} (${a.dato}) ===`);
    // Vis de vigtige linjer i GitHubs log (hele robotloggen er for stor til at blive vist)
    for (const l of ud.split('\n')) if (/^(KILDETJEK|LAESBARHED|SLUTKONTROL|FORBRUG):|Læsbarhed:|Succes!|Sprunget over|Fejl:|AI-billede|Hjernen er med/.test(l.trim().replace(/^🧠 /, ''))) console.log('  ' + l.trim());
    const f = JSON.parse(ud.match(/^FORBRUG: (\{.*\})/m)?.[1] || '{"usd":0}');
    kørsel.usd += f.usd || 0;
    const raw = fs.readFileSync(`./src/content/videos/${a.slug}.md`, 'utf8');
    // 24/10: succes = ny opskrift OG ændret indhold.
    if (/^recipe:\s*3\b/m.test(raw.replace(/\r/g, '')) && raw !== foer) { kørsel.omskrevet.push(a.slug); iTraek = 0; continue; }
    const grund = (ud.match(/(Sprunget over:[^\n]*|Fejl: [^\n]*)/) || [, 'ukendt'])[1].slice(0, 200);
    kørsel.stoppet.push({ slug: a.slug, grund });
    // Midlertidige fejl hos Google (500/503/429, overbelastet, timeout) er ikke artiklens skyld —
    // den prøves igen næste dag. Kun egentlige stop huskes (og prøves igen efter 7 dage, højst 3 gange).
    const midlertidig = /\[(500|502|503|504|429)\b|Internal Server Error|overloaded|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED|ETIMEDOUT|ECONNRESET|fetch failed|midlertidig fejl/i.test(grund);
    if (!midlertidig) fejl[a.slug] = { grund, recipe: 3, dato: new Date().toISOString().slice(0, 10), forsoeg: (fejl[a.slug]?.recipe === 3 ? (fejl[a.slug].forsoeg || 1) : 0) + 1 };
    iTraek++;
  }
  // En hel runde uden en eneste succes = noget er galt (fx Gemini-kreditten): stop.
  if (runde.length >= 2 && iTraek >= runde.length) { console.log('\nStopper: en hel runde lykkedes ikke — tjek Gemini-kreditten (AI Studio -> Billing) og loggen.'); stop = true; }
}
kørsel.usd = Math.round(kørsel.usd * 10000) / 10000;
fs.writeFileSync(FEJL_FIL, JSON.stringify(fejl, null, 1) + '\n');
const log = laes(LOG_FIL, []);
log.push(kørsel);
fs.writeFileSync(LOG_FIL, JSON.stringify(log.slice(-60), null, 1) + '\n');
// Linjen læses af statusarbejdet. Ændr ikke formatet.
console.log(`\nOMSKRIV: ${JSON.stringify({ omskrevet: kørsel.omskrevet.length, stoppet: kørsel.stoppet.length, usd: kørsel.usd, tilbage: gamle.length - kørsel.omskrevet.length - kørsel.stoppet.length })}`);
