// Daglig uafhængig stikprøve (25/10-2026, Jacob: "en uafhængig stikprøve hver dag").
// Tager 2 tilfældige artikler, der allerede ER kontrolleret (recipe 3 eller factChecked), og måler,
// hvor mange af deres tal-sætninger der kan findes på en rigtig webside.
//
// Hvorfor uafhængig: slutkontrollen tjekker kun sætninger, der nævner en kilde, og en AI afgør
// resten. Stikprøven tager ALLE sætninger med tal eller mål i alt, læseren ser, og det er koden
// (ikke en AI), der henter siden og kontrollerer, at citatet og tallene står der.
// Ærlig begrænsning: "ikke fundet" er ikke det samme som "forkert" - et tal kan være rigtigt,
// selvom siden ikke kunne hentes eller citeres. Loggen viser begge dele.
//
// Artikler med fund sættes i src/data/stikproeve-fund.json; faktatjek-gamle.mjs kører samme dag
// den fulde slutkontrol på dem (og retter). Måletal: src/data/stikproeve-log.json.
// Kør: node stikproeve.mjs [--antal=2] [--kun=<slug>]
import fs from 'node:fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';
import { belaeg, belaegSaetninger } from './src/lib/slutkontrol.mjs';
import { laesFelter } from './src/lib/artikelfelter.mjs';
import { kildeNavn } from './src/lib/konkret.mjs';

const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=2').split('=')[1]) || 2;
const kun = (process.argv.find((a) => a.startsWith('--kun=')) || '').split('=')[1] || '';
const MAKS_SAETNINGER = 9; // pr. artikel (3 kald à 3) - holder pris og tid nede
const LOG = './src/data/stikproeve-log.json';
const FUND = './src/data/stikproeve-fund.json';
const laes = (f, std) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return std; } };
const DIR = './src/content/videos';

const kandidater = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => ({ slug: f.replace(/\.md$/, ''), raw: fs.readFileSync(`${DIR}/${f}`, 'utf8') }))
  .filter((a) => (kun ? a.slug === kun : !/^isShort:\s*true/m.test(a.raw) && (/^recipe:\s*3\b/m.test(a.raw) || /^factChecked:/m.test(a.raw))));
// Tilfældigt udvalg (Fisher-Yates), så ingen artikel kan "vide", den bliver tjekket.
for (let i = kandidater.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [kandidater[i], kandidater[j]] = [kandidater[j], kandidater[i]]; }
console.log(`${kandidater.length} kontrollerede artikler — stikprøve på ${Math.min(antal, kandidater.length)}`);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const koersel = { dato: new Date().toISOString(), artikler: [] };
const fund = laes(FUND, { slugs: [] });
for (const a of kandidater.slice(0, antal)) {
  const { f } = laesFelter(a.raw);
  // Alle tal-sætninger i alt, læseren ser - ikke kun dem, der nævner en kilde.
  // Videoens egne tal ("according to Linus Tech Tips") står i videoen, ikke på en webside; dem
  // tjekker robotten mod transskriptet. De springes over her, som i slutkontrollen.
  const kanal = kildeNavn(a.raw.match(/^channelTitle:\s*"(.*)"/m)?.[1] || '');
  const medTal = belaegSaetninger(f, [], kanal, true).slice(0, MAKS_SAETNINGER);
  const r = await belaeg(genAI, hentModel, GEMINI_MODEL, medTal);
  if (!r) { console.log(`${a.slug}: midlertidig fejl (modellen svarede ikke) — springes over`); continue; }
  const forkerte = r.ikkeBelagt.filter((x) => /does not give/.test(x.grund)); // siden fandtes, men tallet stod der ikke
  const ikkeFundet = r.ikkeBelagt.length - forkerte.length;
  const linje = { slug: a.slug, tjekket: r.tjekket, belagt: r.tjekket - r.ikkeBelagt.length - r.usikre, tallet_mangler_paa_siden: forkerte.length, ikke_fundet: ikkeFundet, usikker: r.usikre, fund: r.ikkeBelagt.slice(0, 8) };
  koersel.artikler.push(linje);
  console.log(`${a.slug}: ${JSON.stringify({ ...linje, fund: undefined })}`);
  for (const x of r.ikkeBelagt) console.log(`   - ${x.saetning.slice(0, 140)}  [${x.grund}]`);
  if (r.ikkeBelagt.length && !fund.slugs.includes(a.slug)) fund.slugs.push(a.slug);
}
fs.writeFileSync(FUND, JSON.stringify(fund, null, 1) + '\n');
const log = laes(LOG, []);
log.push(koersel);
fs.writeFileSync(LOG, JSON.stringify(log.slice(-120), null, 1) + '\n');
const sum = (k) => koersel.artikler.reduce((n, x) => n + x[k], 0);
// Linjen læses af statusarbejdet. Ændr ikke formatet.
console.log(`STIKPROEVE: ${JSON.stringify({ artikler: koersel.artikler.length, tjekket: sum('tjekket'), belagt: sum('belagt'), tallet_mangler_paa_siden: sum('tallet_mangler_paa_siden'), ikke_fundet: sum('ikke_fundet'), usikker: sum('usikker'), til_genkontrol: fund.slugs.length })}`);
