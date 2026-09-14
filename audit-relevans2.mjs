// Gendømmer de artikler, den gamle ja/nej-dommer sagde NEJ til.
//
// Hvorfor: den gamle dommer vendte for 37 % af artiklerne mellem to kørsler
// (målt 13/9). Derfor kan dens nej-liste ikke bruges til at slette noget.
// Her gives hver artikel en karakter 0-10 (median af tre kald) plus én linje
// om, hvad videoen faktisk handler om — se src/lib/relevans.mjs.
//
// Resultatet deles i tre bunker:
//   8-10  kilden dækker -> artiklen kan omskrives som alle andre
//   4-7   grænsetilfælde -> Jacob kigger, begrundelsen står ved siden af
//   0-3   kilden dækker ikke -> ny kilde eller slet
//
// Skriver INTET i artiklerne. Genoptagelig: dommene gemmes løbende i
// src/data/relevans2.json og committes undervejs, så en afbrudt kørsel
// (GitHub stopper efter 6 timer) ikke koster arbejde.
//
// Kør: node audit-relevans2.mjs [--kun 20]
import fs from 'fs';
import 'dotenv/config';
import { execSync } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hentTekst } from './src/lib/transskript.mjs';
import { relevansScore, GRAENSE_GOD, GRAENSE_DAARLIG } from './src/lib/relevans.mjs';

const DOM = 'src/data/relevans.json';
const LOG = 'src/data/rewrite-arkiv-log.json';
const UD = 'src/data/relevans2.json';
const GEMFOR = 10; // commit for hver N dømte
const kun = process.argv.includes('--kun') ? +(process.argv[process.argv.indexOf('--kun') + 1] || 0) : 0;
const ingenGit = process.argv.includes('--ingen-git');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const dom = JSON.parse(fs.readFileSync(DOM, 'utf8'));
const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
let ud = fs.existsSync(UD) ? JSON.parse(fs.readFileSync(UD, 'utf8')) : {};

// Kandidater: alt den gamle dommer sagde nej til, PLUS det omskrivningen
// afviste med "kilden handler ikke om" (samme problem, anden kørsel).
const kandidater = [];
for (const [slug, a] of Object.entries(dom)) {
  const afvistIOmskrivning = /handler ikke om/.test(log[slug]?.linje || '');
  if (a.dom !== 'nej' && !afvistIOmskrivning) continue;
  if (!fs.existsSync(`src/content/videos/${slug}.md`)) continue; // slettet siden
  // Allerede dømt — men "intet transskript" (score null) tæller ikke som dømt,
  // så den prøves igen næste kørsel (YouTube svarer ikke altid første gang).
  if (ud[slug] && ud[slug].score !== null) continue;
  kandidater.push(a);
}
kandidater.sort((a, b) => a.slug.localeCompare(b.slug));
const liste = kun ? kandidater.slice(0, kun) : kandidater;
console.log(`Skal gendømmes: ${liste.length} (allerede dømt: ${Object.keys(ud).length})`);

function commit(n) {
  if (ingenGit) return;
  try {
    execSync(`git add "${UD}"`, { stdio: 'inherit' });
    execSync(`git commit -m "Re-judge relevance: ${n} articles scored 0-10"`, { stdio: 'inherit' });
    execSync('git pull --rebase', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
  } catch (e) {
    console.log(`git fejlede (${e.message.split('\n')[0]}) — dommene ligger stadig i filen`);
  }
}

let siden = 0;
for (let i = 0; i < liste.length; i++) {
  const a = liste[i];
  let tekst, fraCache = false;
  try {
    const r = await hentTekst(a.youtubeId, { onVent: (s) => console.log(`   YouTube drosler — venter ${s / 60} min`) });
    tekst = r.tekst; fraCache = r.fraCache;
  } catch (e) {
    ud[a.slug] = { ...a, score: null, grund: '', note: 'intet transskript: ' + e.message.slice(0, 60) };
    fs.writeFileSync(UD, JSON.stringify(ud, null, 1), 'utf8');
    console.log(`${i + 1}/${liste.length} ⚠️  ${a.slug} — intet transskript`);
    continue;
  }
  const r = await relevansScore(genAI, tekst, a.q, { erSpoergsmaal: true });
  ud[a.slug] = { ...a, score: r.score, scorer: r.scorer, spredning: r.spredning, grund: r.grund, dømt: new Date().toISOString() };
  fs.writeFileSync(UD, JSON.stringify(ud, null, 1), 'utf8');
  const mærke = r.score === null ? '⚠️' : r.score >= GRAENSE_GOD ? '✅' : r.score >= GRAENSE_DAARLIG ? '🟡' : '❌';
  console.log(`${i + 1}/${liste.length} ${mærke} ${r.score}/10 ${a.slug}${fraCache ? ' (cache)' : ''} — ${r.grund.slice(0, 80)}`);
  if (++siden >= GEMFOR) { commit(siden); siden = 0; }
  await new Promise((r) => setTimeout(r, 500));
}
if (siden) commit(siden);

// Gennemsynsfil
const alle = Object.values(ud);
const bunke = (f) => alle.filter(f).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
const god = bunke((x) => x.score >= GRAENSE_GOD);
const graense = bunke((x) => x.score >= GRAENSE_DAARLIG && x.score < GRAENSE_GOD);
const daarlig = bunke((x) => x.score !== null && x.score < GRAENSE_DAARLIG);
const uden = bunke((x) => x.score === null);
const raekke = (x) => `| ${x.score ?? '–'} | [${x.title}](https://techfeedwatch.com/video/${x.slug}/) | ${x.q} | ${x.grund || x.note || ''} |`;
const afsnit = (t, b, forklaring) => [`## ${t} (${b.length})`, '', forklaring, '', '| Karakter | Artikel | Spørgsmål | Hvad videoen faktisk handler om |', '|---|---|---|---|', ...b.map(raekke), ''].join('\n');
fs.writeFileSync('_relevans2-gennemsyn.md', [
  `# Gendømt relevans — ${new Date().toISOString().slice(0, 10)}`,
  '',
  `Karakter 0-10, median af tre kald. Dømt: ${alle.length}.`,
  '',
  afsnit('Kilden dækker — kan bare omskrives', god, 'Den gamle ja/nej-dommer tog fejl her. Ingen grund til at slette.'),
  afsnit('Grænsetilfælde — Jacob dømmer', graense, 'Videoen berører emnet, men svarer ikke rigtigt på spørgsmålet. Læs kolonnen til højre.'),
  afsnit('Kilden dækker ikke — ny kilde eller slet', daarlig, 'Videoen handler om noget andet end artiklens spørgsmål.'),
  afsnit('Kunne ikke dømmes', uden, 'Transskriptet kunne ikke hentes.'),
].join('\n'), 'utf8');
console.log(`\nDækker ${god.length} · grænse ${graense.length} · dækker ikke ${daarlig.length} · udømt ${uden.length}`);
console.log('Skrevet: src/data/relevans2.json, _relevans2-gennemsyn.md');
