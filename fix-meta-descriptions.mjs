// Giver artikler uden metaDescription en rigtig meta-beskrivelse.
//
// Hvorfor: 213 artikler havde ingen metaDescription, så siden klippede
// summary'et ved 157 tegn og satte "…" på. Google viser så en halv sætning
// under overskriften — eller skriver selv en anden.
//
// To trin, i rækkefølge:
//  1) Deterministisk: hele sætninger fra summary'et, indtil 155 tegn er brugt.
//     Der opfindes intet — kun sætninger der allerede står der.
//  2) Kun hvis første sætning alene er for lang: Gemini komprimerer summary'et
//     til én sætning. Værn (lært af rewrite-articles.mjs): alle tal i svaret
//     SKAL findes i summary'et, ingen forbudte ord, 60-155 tegn, slutter med
//     punktum. Fejler værnet, prøves igen én gang; fejler det igen, klippes
//     første sætning ved sidste komma/bindeord i stedet.
//
// --dry-run viser resultatet uden at skrive. --no-ai springer trin 2 over.
// --redo: tager også artikler der HAR en metaDescription, men hvor den er
// klippet (slutter med …) eller over 155 tegn — robotten skrev dem for lange.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL } from './src/lib/model.mjs';

const MAX = 155, MIN = 60;
const dry = process.argv.includes('--dry-run');
const noAi = process.argv.includes('--no-ai');
const redo = process.argv.includes('--redo');
const dir = 'src/content/videos';
const FORBUDT = /\b(delve|unlock|game-changing|revolutioniz|unleash|dive deep|in this video|the video|the speaker|this article)\b/i;
const genAI = !noAi && process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
let done = 0, viaAi = 0, viaKlip = 0; const skipped = [];

const saetninger = (t) => t.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/);
const tal = (t) => (t.match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,]$/, ''));

// Trin 1: hele sætninger
function afSaetninger(summary) {
  let ud = '';
  for (const s of saetninger(summary)) {
    if ((ud + ' ' + s).trim().length > MAX) break;
    ud = (ud + ' ' + s).trim();
  }
  return ud.length >= MIN ? ud : null;
}

// Nødløsning: klip første sætning ved sidste komma / bindeord før grænsen
function klip(summary) {
  const s = saetninger(summary)[0].slice(0, MAX - 1);
  const i = Math.max(s.lastIndexOf(', '), s.lastIndexOf(' and '), s.lastIndexOf(' while '), s.lastIndexOf(' by '), s.lastIndexOf(' with '));
  const kort = (i > MIN ? s.slice(0, i) : s.replace(/\s+\S*$/, '')).replace(/[,;:\s]+$/, '');
  return kort + '.';
}

function godkend(kandidat, summary) {
  if (!kandidat) return 'tom';
  if (kandidat.length < MIN || kandidat.length > MAX) return 'længde ' + kandidat.length;
  if (!/[.!?]$/.test(kandidat)) return 'slutter ikke med punktum';
  if (FORBUDT.test(kandidat)) return 'forbudt ord';
  const lovlige = tal(summary);
  for (const t of tal(kandidat)) if (!lovlige.includes(t)) return 'tallet ' + t + ' står ikke i summary';
  return null;
}

async function viaGemini(title, summary) {
  if (!genAI) return null;
  const prompt = `Write ONE sentence of 100-150 characters that summarises this article for a search-result snippet. Plain English, present tense, no hype words, no colon, no quotes. Use only facts and numbers that appear in the summary below. Do not mention "video", "speaker" or "article". End with a full stop. Output the sentence only.\n\nTitle: ${title}\n\nSummary: ${summary}`;
  for (let forsoeg = 0; forsoeg < 2; forsoeg++) {
    try {
      const r = await genAI.getGenerativeModel({ model: GEMINI_MODEL }).generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
      });
      const svar = (r.response.text() || '').replace(/\s+/g, ' ').replace(/^["“]|["”]$/g, '').trim();
      const fejl = godkend(svar, summary);
      if (!fejl) return svar;
      console.log('   gemini afvist (' + fejl + '): ' + svar.slice(0, 80));
    } catch (e) { console.log('   gemini-fejl: ' + (e.message || e).toString().slice(0, 100)); }
  }
  return null;
}

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
  const p = path.join(dir, f);
  const src = fs.readFileSync(p, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';           // faldgrube: CRLF/LF er blandet i repoet
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const fm = m[1];
  const eksisterende = fm.match(/^metaDescription:\s*"((?:[^"\\]|\\.)*)"\s*$/m);
  if (eksisterende) {
    const d = eksisterende[1];
    if (!redo || !(/…$|\.\.\.$/.test(d) || d.length > MAX)) continue;
  }
  const sm = fm.match(/^summary:\s*"((?:[^"\\]|\\.)*)"/m);
  const tm = fm.match(/^title:\s*"((?:[^"\\]|\\.)*)"/m);
  if (!sm) { skipped.push(f + ' (intet summary)'); continue; }
  const summary = sm[1].replace(/\\"/g, '"');
  let ud = afSaetninger(summary), kilde = 'sætninger';
  if (!ud) { ud = await viaGemini(tm ? tm[1] : '', summary); kilde = 'gemini'; if (ud) viaAi++; }
  if (!ud) { ud = klip(summary); kilde = 'klip'; viaKlip++; }
  if (godkend(ud, summary)) { skipped.push(f + ' (' + godkend(ud, summary) + ')'); continue; }
  const linje = 'metaDescription: "' + ud.replace(/"/g, '\\"') + '"';
  console.log(f + ' [' + kilde + ', ' + ud.length + ']' + eol + '  ' + ud);
  if (!dry) fs.writeFileSync(p, eksisterende
    ? src.replace(eksisterende[0], linje)          // erstat den klippede linje
    : src.replace(sm[0], sm[0] + eol + linje));   // ny linje efter summary
  done++;
}
console.log((dry ? 'ville skrive' : 'skrev') + ' metaDescription i', done, 'artikler (gemini:', viaAi, ', klip:', viaKlip, '); sprang over', skipped.length);
for (const s of skipped) console.log('  -', s);
