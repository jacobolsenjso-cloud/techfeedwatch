// Forkorter artikeltitler der er for lange til Googles søgeresultat.
//
// Google klipper omkring 60 tegn. Titlerne er allerede søgeords-forrest, så
// problemet er ikke rækkefølgen men længden — 80 artikler mister rigtige ord.
// Gemini omskriver dem til maks 60 tegn med hovedsøgeordet først.
//
// Rører ALDRIG filnavn/slug, så ingen URL'er ændrer sig og ingen redirects
// bliver nødvendige. Markerer med "titleShortened: true", så genkørsler
// springer færdige artikler over.
//
// Brug:
//   node shorten-titles.mjs --dry     (vis forslag, skriv ikke)
//   node shorten-titles.mjs           (behandl op til 40)
//   node shorten-titles.mjs 100       (behandl op til 100)

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config';

const DIR = './src/content/videos';
const MAX_LEN = 60;
const DRY = process.argv.includes('--dry');
const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || 40;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Samme model som add-video.mjs bruger. gemini-2.0-flash er udgået.
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const yaml = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));

const candidates = [];
for (const f of files) {
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf-8');
  if (/^titleShortened:\s*true/m.test(raw)) continue;
  const t = (raw.match(/^title:\s*"(.*?)"\s*$/m) || [])[1];
  if (!t || t.length <= MAX_LEN) continue;
  const summary = (raw.match(/^summary:\s*"(.*?)"\s*$/m) || [])[1] || '';
  candidates.push({ file: f, path: `${DIR}/${f}`, raw, title: t, summary });
}

console.log(`Titler over ${MAX_LEN} tegn: ${candidates.length}. Behandler op til ${LIMIT}.\n`);
if (!candidates.length) process.exit(0);

let done = 0, skipped = 0;

for (const c of candidates.slice(0, LIMIT)) {
  const prompt = [
    `Rewrite this article headline so it fits within ${MAX_LEN} characters.`,
    '',
    'RULES:',
    `- Hard maximum ${MAX_LEN} characters including spaces. Shorter is fine.`,
    '- Keep the primary keyword as the FIRST words. Do not move it later.',
    '- Keep it factual and specific. Never invent numbers, names or claims.',
    '- No clickbait, no "You Won\'t Believe", no trailing ellipsis.',
    '- NEVER abbreviate product, company or platform names. Keep "Google Cloud",',
    '  "ChatGPT", "Microsoft Azure" etc. written out — those exact words are what',
    '  people search for. Do not turn them into GCP, MSFT, or similar.',
    '- Do not abbreviate ordinary words either ("Minutes" must not become "Mins").',
    '- To save space, cut filler instead: articles, weak verbs, and vague words',
    '  like "Reshaping", "Unpacking", "Exploring", "The Future Of".',
    '- The result must be grammatical English that reads naturally out loud.',
    '  A shorter headline that reads badly is worse than the original.',
    '- Title Case. No quotation marks around the output.',
    '- Do not end with the site name or any brand suffix.',
    '- Output ONLY the headline text, nothing else.',
    '',
    `CURRENT HEADLINE (${c.title.length} chars): ${c.title}`,
    c.summary ? `ARTICLE SUMMARY: ${c.summary.slice(0, 400)}` : '',
  ].filter(Boolean).join('\n');

  const ask = async (extra = '') => {
    const res = await model.generateContent(prompt + extra);
    return res.response.text().trim()
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[.\s]+$/, '');
  };

  try {
    let out = await ask();

    // Ét forsøg mere hvis den kun lige akkurat er for lang — det sker tit,
    // og et konkret tegnbudget plejer at løse det.
    if (out.length > MAX_LEN) {
      await new Promise((r) => setTimeout(r, 800));
      out = await ask(
        `\n\nYour previous attempt was "${out}" (${out.length} chars) — that is ` +
        `${out.length - MAX_LEN} characters too long. Cut it down further while ` +
        `keeping the leading keyword and correct grammar.`
      );
    }

    if (!out) { console.log(`⚠️  tomt svar: ${c.file}`); skipped++; continue; }
    if (out.length > MAX_LEN) {
      console.log(`⚠️  stadig ${out.length} tegn, beholder originalen: ${c.file}\n     ${out}`);
      skipped++; continue;
    }

    console.log(`✅ ${c.title.length} → ${out.length}`);
    console.log(`   før : ${c.title}`);
    console.log(`   nu  : ${out}\n`);

    if (!DRY) {
      let updated = c.raw.replace(/^title:\s*".*?"\s*$/m, `title: ${yaml(out)}`);
      // Marker som behandlet, lige efter title-linjen
      updated = updated.replace(/^(title:\s*".*?")\s*$/m, `$1\ntitleShortened: true`);
      fs.writeFileSync(c.path, updated);
    }
    done++;
    await new Promise((r) => setTimeout(r, 1100)); // hold os under rate limit
  } catch (e) {
    console.log(`❌ fejl på ${c.file}: ${e.message}`);
    skipped++;
  }
}

console.log(`\n${DRY ? '(tørkørsel) ' : ''}Forkortet ${done}, sprunget over ${skipped}.`);
