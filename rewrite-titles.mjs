// Titlerne på de 386 artikler har samme SEO-form: 80% "X: Y", 27% med "&",
// 21% begge dele, og kun 3 spørgsmål. Målt 20/8. Mønstret er sitets mest
// maskinelle synlige træk. Dette script foreslår nye titler med spredte former.
//
// Sikkerhed: skriver ALDRIG til artiklerne. Output er _titler-forslag.txt
// med "gammel -> ny" til menneskelig gennemlæsning (faldgrube 6: fuld
// læsning, ikke stikprøve — 386 linjer kan læses på et kvarter).
// Skrivning sker i et separat trin efter godkendelse.
//
// Brug: node rewrite-titles.mjs --limit=25
import fs from 'node:fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL } from './src/lib/model.mjs';

const DIR = 'src/content/videos';
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
// --list=fil: kør kun filnavnene i listen (til genkørsel af afviste).
// --ekstra="...": ekstra hård regel til prompten (fx strammere længde).
const listeArg = (process.argv.find((a) => a.startsWith('--list=')) || '').split('=')[1];
const ekstra = (process.argv.find((a) => a.startsWith('--ekstra=')) || '').split('=').slice(1).join('=');
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY mangler'); process.exit(1); }
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const felt = (raw, k) => raw.match(new RegExp(`^${k}:\\s*"([^"]*)"`, 'm'))?.[1] || '';
const medTidsgraense = (l, s, hvad) => Promise.race([l, new Promise((_, af) => setTimeout(() => af(new Error(hvad + ' timeout')), s * 1000))]);

// Formerne tildeles på skift, deterministisk, så fordelingen er kendt på
// forhånd: kolon ender på ~25%, spørgsmål ~12%, resten rene udsagn.
const FORMER = [
  { id: 'udsagn', regel: 'A plain declarative headline. No colon, no ampersand, no question mark. Example shape: "Why Solana Outages Keep Happening" or "The Case Against Passive Index Funds".' },
  { id: 'hvordan', regel: 'A how/what/why headline without a question mark. No colon, no ampersand. Example shape: "How Staking Rewards Actually Get Paid".' },
  { id: 'udsagn', regel: 'A plain declarative headline. No colon, no ampersand, no question mark. Vary the opening word - do not start with "The" if avoidable.' },
  { id: 'kolon', regel: 'A two-part headline with ONE colon. No ampersand. Keep the part before the colon short (1-3 words).' },
  { id: 'spoergsmaal', regel: 'A genuine question ending in a question mark. No colon, no ampersand. It must be the question a searcher would type.' },
  { id: 'udsagn', regel: 'A plain declarative headline. No colon, no ampersand, no question mark. It may start with a number if the article genuinely lists things.' },
  { id: 'hvordan', regel: 'A "What ... Means for ..." or "How ... Changes ..." headline. No colon, no ampersand, no question mark.' },
  { id: 'kolon', regel: 'A two-part headline with ONE colon. No ampersand. The part after the colon carries the substance.' },
];

const FORBUDT = /shocking|you won'?t believe|insane|crazy|secret(s)? (they|nobody)|mind-?blowing|ultimate guide|game-?chang/i;

// Publikations-casing: småord med småt, medmindre de indleder titlen eller
// står efter kolon. Gemini skriver "And"/"For" med stort trods Title Case-
// instruksen — målt i prøvekørslen 20/8, hvor det ramte flere titler.
const SMAAORD = new Set(['a','an','and','as','at','but','by','for','in','nor','of','on','or','per','the','to','vs','via','with']);
const pubCase = (t) => t.split(' ').map((ord, i, alle) => {
  const kerne = ord.toLowerCase();
  const efterKolon = i > 0 && alle[i - 1].endsWith(':');
  if (i === 0 || efterKolon || !SMAAORD.has(kerne)) return ord;
  return kerne;
}).join(' ');
const STOPORD = new Set(['the','a','an','and','or','for','to','of','in','on','with','how','what','why','your','is','are','this','that']);
const noegleord = (t) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOPORD.has(w));

let filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort().slice(0, limit);
if (listeArg) {
  const navne = new Set(fs.readFileSync(listeArg, 'utf-8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
  filer = filer.filter((f) => navne.has(f));
  console.log('Liste: ' + navne.size + ' navne, ' + filer.length + ' fundet');
}
const brugte = new Set();
// Dublet-kontrollen skal kende run 1's godkendte titler, ellers kan en
// genkørsel foreslå en titel der allerede er taget.
if (fs.existsSync('_titler-run1.txt')) {
  for (const m of fs.readFileSync('_titler-run1.txt', 'utf-8').matchAll(/^\s*NY:\s+(.+)$/gm)) brugte.add(m[1].trim().toLowerCase());
  console.log('Dublet-kontrol kender ' + brugte.size + ' titler fra run 1');
}
const linjer = [];
let ok = 0, fejl = 0;

for (let i = 0; i < filer.length; i++) {
  const f = filer[i];
  const raw = fs.readFileSync(DIR + '/' + f, 'utf-8');
  const gammel = felt(raw, 'title');
  const spoergsmaal = felt(raw, 'targetQuestion');
  const resume = felt(raw, 'summary');
  const form = FORMER[i % FORMER.length];

  const prompt = `Rewrite this article headline for a tech publication. The article and its URL stay the same - only the headline changes.

CURRENT HEADLINE: ${gammel}
ARTICLE SUMMARY: ${resume}
${spoergsmaal ? 'SEARCH QUERY THE ARTICLE ANSWERS: ' + spoergsmaal : ''}

REQUIRED FORM: ${form.regel}

Hard rules:
- 40 to 65 characters.
- Keep the subject's key terms so a searcher still finds it (the product names, technologies, and topic words from the current headline).
- Keep the current headline's MEANING and point of view exactly. If it describes a threat AGAINST something, the new one must too - never flip who acts on whom.
- Be MORE specific than the current headline, never more generic. If you cannot improve it, sharpen it with a concrete detail from the summary. Reordering the same words is failure.
- Plain, specific, honest. No hype words, no clickbait.
- Title Case.
- Reply with the headline only. No quotes, no explanation.${ekstra ? '\n- ' + ekstra : ''}`;

  try {
    const res = await medTidsgraense(
      genAI.getGenerativeModel({ model: GEMINI_MODEL }).generateContent(prompt), 120, f);
    let ny = res.response.text().trim().replace(/^["'\s]+|["'\s]+$/g, '').replace(/\n[\s\S]*$/, '');
    ny = pubCase(ny);

    const problemer = [];
    if (ny.length < 38 || ny.length > 70) problemer.push('laengde ' + ny.length);
    if (FORBUDT.test(ny)) problemer.push('forbudt ord');
    if (form.id !== 'kolon' && ny.includes(':')) problemer.push('kolon i ' + form.id);
    if (form.id !== 'spoergsmaal' && ny.includes('?')) problemer.push('? i ' + form.id);
    if (form.id === 'spoergsmaal' && !ny.endsWith('?')) problemer.push('mangler ?');
    if (ny.includes(' & ')) problemer.push('og-tegn');
    if (brugte.has(ny.toLowerCase())) problemer.push('dublet');
    const gamleOrd = noegleord(gammel);
    const nyLav = ny.toLowerCase();
    const beholdte = gamleOrd.filter((w) => nyLav.includes(w));
    if (gamleOrd.length >= 2 && beholdte.length < 2) problemer.push('mistede noegleord (' + beholdte.length + '/' + gamleOrd.length + ')');

    if (problemer.length) { linjer.push('FEJL [' + problemer.join(', ') + '] ' + f + '\n  GAMMEL: ' + gammel + '\n  AFVIST: ' + ny); fejl++; }
    else { brugte.add(ny.toLowerCase()); linjer.push('[' + form.id + '] ' + f + '\n  GAMMEL: ' + gammel + '\n  NY:     ' + ny); ok++; }
  } catch (e) { linjer.push('FEJL [' + e.message + '] ' + f); fejl++; }
  process.stdout.write('\r' + (i + 1) + '/' + filer.length + ' (ok ' + ok + ', fejl ' + fejl + ')   ');
}

fs.writeFileSync('_titler-forslag.txt', linjer.join('\n\n') + '\n');
console.log('\nSkrevet til _titler-forslag.txt - INTET er aendret i artiklerne.');
