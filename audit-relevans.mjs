// Tør kørsel af relevans-tjekket over hele arkivet. Skriver INTET i artiklerne.
//
// Hvorfor: 9/9 fik 222 artikler et nyt søgespørgsmål (B-omdøbningen) ud fra
// overskriften — ikke ud fra kildevideoen. 12/9 viste `--erstat`, at mindst én
// af dem ("what is ai algorithmic trading") har en kilde, der slet ikke
// handler om spørgsmålet. Sådan en artikel kan ikke omskrives; den skal have
// en ny kilde eller slettes. Før alle 426 sendes gennem den nye kæde, skal vi
// vide hvor mange det gælder — det er skridt 1 af 2.
//
// Kør: node audit-relevans.mjs            (genoptager fra _relevans.json)
//      node audit-relevans.mjs --kun 20   (de første 20, til en prøve)
// Resultat: _relevans.json + _relevans-gennemsyn.md (nej'erne øverst).
//
// Samme tjek som robotten bruger (src/lib/relevans.mjs), så dommen er den samme.
import fs from 'fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { erRelevant } from './src/lib/relevans.mjs';

const DIR = 'src/content/videos';
const UD = '_relevans.json';
const kun = process.argv.includes('--kun') ? +(process.argv[process.argv.indexOf('--kun') + 1] || 0) : 0;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let res = {};
if (fs.existsSync(UD)) { try { res = JSON.parse(fs.readFileSync(UD, 'utf8')); } catch { res = {}; } }

const artikler = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md')).sort()) {
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf8');
  if (/^isShort:\s*true/m.test(raw)) continue;
  const slug = f.replace(/\.md$/, '');
  artikler.push({
    slug,
    title: raw.match(/^title:\s*"(.*?)"/m)?.[1] || slug,
    youtubeId: raw.match(/^youtubeId:\s*"(.*?)"/m)?.[1] || '',
    q: raw.match(/^targetQuestion:\s*"(.*?)"/m)?.[1] || '',
    tag: raw.match(/^tags:\r?\n\s*-\s*"(.*?)"/m)?.[1] || '',
    rewrittenAt: raw.match(/^rewrittenAt:\s*"(.*?)"/m)?.[1] || '',
    channel: raw.match(/^channelTitle:\s*"(.*?)"/m)?.[1] || '',
  });
}

// Uden søgespørgsmål er der intet at dømme mod — de tælles, men springes over.
const medQ = artikler.filter((a) => a.q);
const udenQ = artikler.length - medQ.length;
const todo = medQ.filter((a) => !res[a.slug]).slice(0, kun || undefined);
console.log(`Artikler: ${artikler.length} (${medQ.length} med søgespørgsmål, ${udenQ} uden). Allerede tjekket: ${medQ.length - medQ.filter((a) => !res[a.slug]).length}. Tjekker nu: ${todo.length}`);

const sov = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
for (const a of todo) {
  n++;
  let text = '';
  try {
    const t = await YoutubeTranscript.fetchTranscript(a.youtubeId);
    text = t.map((x) => x.text).join(' ');
  } catch (e) {
    res[a.slug] = { ...a, dom: 'ingen transskript', svar: e.message.slice(0, 80) };
    fs.writeFileSync(UD, JSON.stringify(res, null, 1), 'utf8');
    console.log(`${n}/${todo.length} ${a.slug}: ingen transskript`);
    await sov(500);
    continue;
  }
  let dom, svar;
  for (let forsoeg = 0; forsoeg < 3; forsoeg++) {
    try {
      const r = await erRelevant(genAI, text, a.q, { erSpoergsmaal: true });
      dom = r.ja ? 'ja' : 'nej'; svar = r.svar;
      break;
    } catch (e) {
      svar = e.message.slice(0, 80);
      // Målt 9/9: for mange kald på kort tid gav 47 fejl — vent og prøv igen.
      await sov(3000 * (forsoeg + 1));
    }
  }
  res[a.slug] = { ...a, dom: dom || 'fejl', svar, tegn: text.length };
  fs.writeFileSync(UD, JSON.stringify(res, null, 1), 'utf8');
  console.log(`${n}/${todo.length} ${dom === 'nej' ? '❌' : dom === 'ja' ? '✅' : '⚠️'} ${a.slug} — "${a.q}"`);
  await sov(700);
}

// Opsummering + gennemsynsfil (nej'erne øverst, så Jacob kan læse dem først).
const alle = Object.values(res);
const taelle = (d) => alle.filter((x) => x.dom === d).length;
console.log(`\nDom: ja ${taelle('ja')} · nej ${taelle('nej')} · ingen transskript ${taelle('ingen transskript')} · fejl ${taelle('fejl')} — uden spørgsmål (ikke tjekket): ${udenQ}`);
const raekke = (x) => `| [${x.title}](https://techfeedwatch.com/video/${x.slug}/) | ${x.q} | ${x.channel} | ${x.rewrittenAt ? 'omskrevet' : 'robot'} |`;
const md = [
  `# Relevans-tjek af arkivet — ${new Date().toISOString().slice(0, 10)}`,
  '', `Tjekket: ${alle.length} artikler med søgespørgsmål. **Nej: ${taelle('nej')}** · ja: ${taelle('ja')} · ingen transskript: ${taelle('ingen transskript')} · fejl: ${taelle('fejl')}. Uden søgespørgsmål (ikke tjekket): ${udenQ}.`,
  '', 'Nej = kildevideoen dækker ikke det spørgsmål, artiklen skal svare på. Disse kan ikke omskrives med samme kilde.',
  '', '## Nej', '', '| Artikel | Spørgsmål | Kilde | Type |', '|---|---|---|---|',
  ...alle.filter((x) => x.dom === 'nej').map(raekke),
  '', '## Ingen transskript (kan hverken tjekkes eller omskrives)', '', '| Artikel | Spørgsmål | Kilde | Type |', '|---|---|---|---|',
  ...alle.filter((x) => x.dom === 'ingen transskript').map(raekke),
  '', '## Fejl (prøv igen)', '', ...alle.filter((x) => x.dom === 'fejl').map((x) => `- ${x.slug}: ${x.svar}`),
  '',
].join('\n');
fs.writeFileSync('_relevans-gennemsyn.md', md, 'utf8');
console.log('Skrevet: _relevans.json, _relevans-gennemsyn.md');
