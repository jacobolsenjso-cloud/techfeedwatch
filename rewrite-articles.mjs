// Skriver eksisterende artikler om, så de handler om EMNET frem for om videoen.
//
// Baggrund: fjerde AdSense-afslag med "indhold med ringe værdi". Artiklerne var
// ikke kopieret — de var referater. En læser fik at vide hvad en video sagde,
// ikke hvad emnet handler om. Google kalder det ringe værdi, og det er en
// rimelig beskrivelse.
//
// Robotten er bygget om, men det retter ikke de 391 der allerede ligger. Dette
// script tager dem én for én: henter transskriptet igen, og skriver en artikel
// OM EMNET med videoen som research. Kilden krediteres stadig i frontmatter.
//
// Frontmatter røres ikke. Kun brødteksten skrives, og kun hvis den nye tekst er
// lang nok — en halv omskrivning er værre end ingen.
//
// Brug: node rewrite-articles.mjs --limit=5      (prøv fem først)
//       node rewrite-articles.mjs --dry-run      (vis hvilke, skriv intet)
//       node rewrite-articles.mjs                (alle)
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { hentForslag } from './src/lib/suggest.mjs';

const DIR = 'src/content/videos';
const MIN_ORD = 700;
const dryRun = process.argv.includes('--dry-run');
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY mangler'); process.exit(1); }
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const felt = (raw, k) => raw.match(new RegExp(`^${k}:\\s*"([^"]*)"`, 'm'))?.[1] || '';
const fmAf = (raw) => raw.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] || '';
const ordtal = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Prompten er den samme tankegang som robottens nye: emnet er opgaven, videoen
// er research. Den er skrevet ud her frem for at importeres, fordi robotten
// også skal producere titel, mærker, resumé og FAQ — her skal vi kun bruge
// brødteksten, og alt det øvrige skal blive præcis som det er.
const byg = (titel, resume, spoergsmaal, tekst) => `You are writing a reference article for Tech Feed Watch about a technology
subject. Research for it included the transcript of one video, which is
supplied below.

The article's headline and summary are already fixed:
HEADLINE: ${titel}
SUMMARY: ${resume}
${spoergsmaal ? `\nTHE READER'S QUESTION: someone searching Google typed "${spoergsmaal}". That question is this article's job. Answer it plainly early on.\n` : ''}
Write ONLY the article body in Markdown. Rules:

1. THE SUBJECT IS THE ARTICLE, NOT THE VIDEO. Write about the topic itself, the
   way an experienced writer would if they had watched this video as part of
   their research. A reader who never watches it must get a complete,
   self-contained answer.
2. Never write "the video", "in this video", "the speaker", "the presenter" or
   any equivalent. There is no video from the reader's point of view.
3. Most of the article is explanation the reader needs: what the thing is, why
   it works that way, what it means in practice, what the trade-offs are, and
   what commonly goes wrong.
4. Use the source for the specific claims, examples and angles it contributes,
   and reflect them accurately - but in your own words and your own structure.
   Do not follow its running order. Do not quote long passages from it.
5. Add context from well-established, generally-known facts: history, how it
   compares to the alternatives, second-order consequences. NEVER invent
   statistics, quotes, dates, company figures or events. If you are unsure of a
   number, leave it out rather than approximating it.
6. 900-1300 words. Use 4-6 H2 headings (##). No H1, no title, no FAQ section.
7. Open with two or three sentences that state the substance - not a throat-
   clearing introduction, and not a restatement of the headline.
8. Where the subject is genuinely disputed, say so and give both cases rather
   than picking one and sounding certain.
9. Plain English. Short sentences mixed with longer ones. Active voice. Never
   use: delve, tapestry, realm, landscape, testament, crucial, robust, unlock,
   unleash, elevate, seamless, paradigm shift, "in today's digital age".
10. No links, no images, no author bio, no sign-off.

SOURCE MATERIAL (research input - one video's transcript on this subject).
Use it for what it contributes; do not write about it:
${tekst.substring(0, 18000)}`;

// Vælg artikler. De ældste først: de er skrevet før emnevalget og de øvrige
// forbedringer kom ind, så de er dem der ligner referater mest.
const filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const kandidater = [];
for (const f of filer) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (/^isShort:\s*true/m.test(raw)) continue;
  const body = raw.slice(fmAf(raw).length);
  kandidater.push({
    f, raw,
    id: felt(raw, 'youtubeId'),
    titel: felt(raw, 'title'),
    dato: felt(raw, 'date').slice(0, 10),
    ord: ordtal(body),
    // Nævner brødteksten videoen? Det er den tydeligste markør for et referat.
    naevnerVideo: /\bthe video\b|\bthis video\b|the speaker|the presenter|the host\b/i.test(body),
    spoergsmaal: felt(raw, 'targetQuestion'),
  });
}
kandidater.sort((a, b) => (b.naevnerVideo - a.naevnerVideo) || a.dato.localeCompare(b.dato));

const refererende = kandidater.filter((k) => k.naevnerVideo).length;
console.log(`${kandidater.length} artikler · ${refererende} nævner videoen direkte i teksten\n`);

if (dryRun) {
  for (const k of kandidater.slice(0, limit === Infinity ? 20 : limit)) {
    console.log(`  ${k.dato} · ${k.ord} ord · ${k.naevnerVideo ? 'nævner video' : '            '} · ${k.titel.slice(0, 52)}`);
  }
  console.log('\nTØRT LØB — intet skrevet.');
  process.exit(0);
}

let rettet = 0, sprunget = 0;
const fejl = [];

for (const k of kandidater.slice(0, limit)) {
  process.stdout.write(`  ${k.dato} ${k.titel.slice(0, 44).padEnd(44)} `);
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(k.id);
    const tekst = transcript.map((x) => x.text).join(' ');
    if (ordtal(tekst) < 150) throw new Error('transskript for kort til at skrive ud fra');

    // Har artiklen intet gemt spørgsmål, hentes ét ud fra titlen. Det giver
    // omskrivningen et mål — uden det bliver den let til et pænere referat.
    let spoergsmaal = k.spoergsmaal;
    if (!spoergsmaal) {
      const froe = k.titel.split(/[:\u2013\u2014|]/)[0].trim().split(/\s+/).slice(0, 4).join(' ');
      try {
        const f = await hentForslag(froe);
        if (f.length) spoergsmaal = f[0];
      } catch { /* autocomplete er en forbedring, ikke en forudsætning */ }
    }

    const res = await genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 16384 },
    }).generateContent(byg(k.titel, felt(k.raw, 'summary'), spoergsmaal, tekst));

    const finish = res.response?.candidates?.[0]?.finishReason;
    if (finish && finish !== 'STOP') throw new Error(`Gemini stoppede med "${finish}"`);

    let ny = res.response.text().trim()
      .replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim()
      .replace(/^#\s+.*$/m, '').trim();

    const n = ordtal(ny);
    if (n < MIN_ORD) throw new Error(`kun ${n} ord, grænsen er ${MIN_ORD}`);
    // Sidste kontrol: er den stadig et referat, har omskrivningen fejlet.
    if (/\bthe video\b|\bthis video\b|the speaker\b|the presenter\b/i.test(ny)) {
      throw new Error('teksten omtaler stadig videoen — skrives ikke');
    }

    fs.writeFileSync(path.join(DIR, k.f), `${fmAf(k.raw)}\n\n${ny}\n`, 'utf8');
    console.log(`OK ${k.ord} -> ${n} ord${spoergsmaal ? `  ("${spoergsmaal.slice(0, 38)}")` : ''}`);
    rettet++;
  } catch (e) {
    console.log(`sprunget over: ${e.message.slice(0, 58)}`);
    fejl.push(`${k.f}: ${e.message.slice(0, 70)}`);
    sprunget++;
  }
  await new Promise((r) => setTimeout(r, 2500));
}

console.log(`\nOmskrevet: ${rettet} · sprunget over: ${sprunget}`);
if (fejl.length) { console.log('\nSprunget over:'); for (const x of fejl) console.log('  ' + x); }
