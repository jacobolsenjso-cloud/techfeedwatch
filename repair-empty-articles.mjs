// Genskaber brødteksten i artikler der blev udgivet som tomme skaller.
//
// Baggrund: add-video.mjs skrev filen selv når Geminis svar manglede CONTENT:.
// Prompten beder om TITLE, TAGS, SUMMARY, META, FAQ og til sidst CONTENT — så
// når svaret blev klippet af, var brødteksten præcis dét der forsvandt, mens
// alt andet stod der. 25 artikler blev udgivet uden en eneste linje tekst.
//
// Robotten er rettet (token-grænse, tjek af finishReason, og den nægter nu at
// skrive under 200 ord). Dette script rydder op efter de allerede udgivne.
//
// Frontmatter røres ALDRIG. Kun brødteksten skrives, og kun hvis den nye tekst
// er lang nok — en halv reparation er værre end ingen.
//
// Brug: node repair-empty-articles.mjs --dry-run
//       node repair-empty-articles.mjs            (skriver)
//       node repair-empty-articles.mjs --limit=3  (prøv nogle få først)
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { GEMINI_MODEL } from './src/lib/model.mjs';

const DIR = 'src/content/videos';
const MIN_ORD = 200;
const dryRun = process.argv.includes('--dry-run');
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY mangler — sæt den i .env');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const felt = (raw, k) => raw.match(new RegExp(`^${k}:\\s*"([^"]*)"`, 'm'))?.[1] || '';
const brodtekst = (raw) => {
  const fm = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
  return fm ? raw.slice(fm[0].length) : raw;
};
const ordtal = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

const filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const tomme = [];
for (const f of filer) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (/^isShort:\s*true/m.test(raw)) continue;          // Shorts har aldrig brødtekst
  const n = ordtal(brodtekst(raw));
  if (n < 50) tomme.push({ f, raw, ord: n, id: felt(raw, 'youtubeId'), titel: felt(raw, 'title') });
}

console.log(`${tomme.length} artikler uden brødtekst af ${filer.length}\n`);
if (dryRun) {
  for (const t of tomme) console.log(`  ${t.ord} ord · ${t.id} · ${t.titel.slice(0, 62)}`);
  console.log('\nTØRT LØB — intet skrevet.');
  process.exit(0);
}

const byg = (titel, resume, tekst) => `You are writing the body of an article for Tech Feed Watch, a site that turns
YouTube videos into short written analyses so readers can decide whether the
video is worth their time.

The article already has this headline and summary. Do not repeat them verbatim:
HEADLINE: ${titel}
SUMMARY: ${resume}

Write ONLY the article body in Markdown. Rules:
- 500-800 words, in English.
- Use 3-4 H2 headings (##). No H1. Do not write a title.
- Open with the substance, not with "In this video" or "The video discusses".
- Explain what the idea is, why it matters, and what it means in practice.
- Add context a reader would not get from the video alone, but only
  well-established, generally-known facts. Never invent statistics, quotes,
  dates, company figures or events.
- Do not include links, images, or a FAQ section.
- Write in your own words. Do not reproduce the transcript or quote long
  passages from it.

Source video content:
${tekst.substring(0, 18000)}`;

let rettet = 0, sprunget = 0;
const fejl = [];

for (const t of tomme.slice(0, limit)) {
  process.stdout.write(`  ${t.id} ${t.titel.slice(0, 46).padEnd(46)} `);
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(t.id);
    const tekst = transcript.map((x) => x.text).join(' ');
    if (ordtal(tekst) < 100) throw new Error('transskript for kort');

    const res = await genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { maxOutputTokens: 16384 },
    }).generateContent(byg(t.titel, felt(t.raw, 'summary'), tekst));

    // Samme tjek som robotten har fået: et afklippet svar ligner et gyldigt
    // svar med et manglende afsnit, og det var hele årsagen til rodet.
    const finish = res.response?.candidates?.[0]?.finishReason;
    if (finish && finish !== 'STOP') throw new Error(`Gemini stoppede med "${finish}"`);

    let ny = res.response.text().trim()
      .replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim()
      .replace(/^#\s+.*$/m, '').trim();          // en h1 hører ikke til i brødteksten

    const n = ordtal(ny);
    if (n < MIN_ORD) throw new Error(`kun ${n} ord`);

    // Frontmatter beholdes præcis som den er — vi skriver kun teksten under.
    const fm = t.raw.match(/^---\r?\n[\s\S]*?\r?\n---/)[0];
    fs.writeFileSync(path.join(DIR, t.f), `${fm}\n\n${ny}\n`, 'utf8');
    console.log(`✅ ${n} ord`);
    rettet++;
  } catch (e) {
    console.log(`⚠️  ${e.message.slice(0, 60)}`);
    fejl.push({ t, grund: e.message.slice(0, 80) });
    sprunget++;
  }
  await new Promise((r) => setTimeout(r, 2500));   // vær venlig ved API'et
}

console.log(`\nRettet: ${rettet} · sprunget over: ${sprunget}`);
if (fejl.length) {
  console.log('\nDisse kunne ikke genskabes — sandsynligvis fordi videoen ikke har transskript:');
  for (const x of fejl) console.log(`  ${x.t.id} · ${x.t.titel.slice(0, 50)} — ${x.grund}`);
  console.log('\nDe skal enten skrives i hånden eller fjernes med en 301 til en beslægtet artikel.');
}
