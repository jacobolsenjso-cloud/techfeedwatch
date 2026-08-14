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
5. NUMBERS: you may only use a figure that appears in the source material below.
   Not one that seems right, not one you remember, not a rounded version of one.
   If the source does not give a number, write the sentence without one - "a
   large share", "most", "the majority" are all fine. This is checked
   automatically after you finish, and the article is discarded if a number
   appears that is not in the source. Percentages, sums of money, market sizes
   and user counts are the ones that get discarded most often.
6. Other context may come from well-established, generally-known facts: history,
   how it compares to the alternatives, second-order consequences. NEVER invent
   quotes, dates, company figures or events.
7. 900-1300 words. Use 4-6 H2 headings (##). No H1, no title, no FAQ section.
8. Open with two or three sentences that state the substance - not a throat-
   clearing introduction, and not a restatement of the headline.
9. Where the subject is genuinely disputed, say so and give both cases rather
   than picking one and sounding certain.
10. Plain English. Short sentences mixed with longer ones. Active voice. These
   words are banned and the article is rejected if any appears: delve, tapestry,
   realm, landscape, testament, crucial, robust, unlock, unleash, elevate,
   seamless, paradigm shift, "in today's digital age".
11. No links, no images, no author bio, no sign-off.

After the body, output a line containing only ---FAQ--- and then 4 questions
and answers about the SUBJECT (not about any video), in exactly this format,
one pair per line:
Q: the question
A: the answer, two or three sentences, specific and useful
The questions must be ones a reader would actually type into a search box.
Answer them properly rather than teasing the article.

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

// --list=<fil> begrænser kørslen til bestemte filer, én pr. linje.
// Findes fordi de 14 første omskrivninger skal gøres om: de har opdigtede tal,
// men de nævner ikke længere videoen, så den normale rækkefølge vil aldrig
// vælge dem igen. Listen laves med git: filerne ændret i en bestemt commit.
const listeArg = (process.argv.find((a) => a.startsWith('--list=')) || '').split('=')[1];
let valgte = kandidater;
if (listeArg) {
  if (!fs.existsSync(listeArg)) { console.error(`Listen findes ikke: ${listeArg}`); process.exit(1); }
  const navne = new Set(
    fs.readFileSync(listeArg, 'utf8').split(/\r?\n/)
      .map((l) => l.trim()).filter(Boolean)
      .map((l) => path.basename(l))
  );
  valgte = kandidater.filter((k) => navne.has(k.f));
  console.log(`Liste: ${navne.size} navne · ${valgte.length} fundet i arkivet\n`);
}

const refererende = kandidater.filter((k) => k.naevnerVideo).length;
console.log(`${kandidater.length} artikler · ${refererende} nævner videoen direkte i teksten\n`);

if (dryRun) {
  for (const k of valgte.slice(0, limit === Infinity ? 20 : limit)) {
    console.log(`  ${k.dato} · ${k.ord} ord · ${k.naevnerVideo ? 'nævner video' : '            '} · ${k.titel.slice(0, 52)}`);
  }
  console.log('\nTØRT LØB — intet skrevet.');
  process.exit(0);
}

let rettet = 0, sprunget = 0;
const fejl = [];

for (const k of valgte.slice(0, limit)) {
  process.stdout.write(`  ${k.dato} ${k.titel.slice(0, 44).padEnd(44)} `);
  // Op til tre forsøg. Kontrollerne afviser ~2 ud af 3 første forsøg, og
  // fejlene er tilfældige — et forbudt ord eller et opdigtet tal er ikke en
  // egenskab ved artiklen, men ved den enkelte generering. Uden gentagelse
  // kasserer vi artikler der ville være fine i andet forsøg.
  let sidsteFejl = null;
  for (let forsoeg = 1; forsoeg <= 3; forsoeg++) {
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

    const helSvar = res.response.text().trim()
      .replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Del svaret ved markøren. FAQ'en i frontmatter blev skrevet dengang
    // artiklen var et referat, så spørgsmålene kan handle om noget den nye
    // tekst ikke længere dækker. Derfor skrives de om sammen med brødteksten.
    const dele = helSvar.split(/^---FAQ---\s*$/m);
    let ny = dele[0].replace(/^#\s+.*$/m, '').trim();

    const nyeFaqs = [];
    if (dele[1]) {
      let sidsteQ = null;
      for (const l of dele[1].split(/\r?\n/)) {
        const q = l.match(/^\s*Q:\s*(.+)$/);
        const a = l.match(/^\s*A:\s*(.+)$/);
        if (q) sidsteQ = q[1].trim();
        else if (a && sidsteQ) { nyeFaqs.push({ q: sidsteQ, a: a[1].trim() }); sidsteQ = null; }
      }
    }

    const n = ordtal(ny);
    if (n < MIN_ORD) throw new Error(`kun ${n} ord, grænsen er ${MIN_ORD}`);
    // Sidste kontrol: er den stadig et referat, har omskrivningen fejlet.
    if (/\bthe video\b|\bthis video\b|the speaker\b|the presenter\b/i.test(ny)) {
      throw new Error('teksten omtaler stadig videoen — skrives ikke');
    }

    // Tal der ikke findes i transskriptet.
    //
    // Første kørsel af de 14 tilføjede 20 nye tal — 86%, 77%, $2,9 billioner —
    // hvor kun 5 stammede fra den oprindelige artikel. Prompten forbød det
    // allerede; et forbud i en lang prompt er ikke en kontrol. Modellen fylder
    // huller ud med tal der lyder rigtige, og det er værre end det tynde
    // referat vi prøvede at komme væk fra.
    //
    // Kilden er transskript OG den gamle artikel: står tallet ét af stederne,
    // er det ikke fundet på her.
    const kilde = (tekst + ' ' + k.raw).replace(/[\s,]/g, '').toLowerCase();
    const talIArtikel = [...new Set(
      (ny.match(/\b\d{1,3}(?:[.,]\d+)?\s?(?:percent|%)|[$€£]\s?\d[\d.,]*(?:\s?(?:billion|million|trillion))?/gi) || [])
        .map((x) => x.replace(/[\s,]/g, '').toLowerCase())
    )];
    const opdigtede = talIArtikel.filter((t) => !kilde.includes(t));
    if (opdigtede.length) {
      throw new Error(`tal findes ikke i kilden: ${opdigtede.slice(0, 5).join(', ')}`);
    }

    // Forbudte ord. Står de der, er instruktionen ikke fulgt, og teksten lyder
    // som alt andet maskinskrevet indhold på internettet.
    const forbudte = [...new Set(
      (ny.match(/\b(delve|tapestry|realm|landscape|testament|crucial|robust|unlock|unleash|elevate|seamless|paradigm shift)\b/gi) || [])
        .map((x) => x.toLowerCase())
    )];
    if (forbudte.length) throw new Error(`forbudte ord: ${forbudte.join(', ')}`);

    // Frontmatter beholdes præcis som den er — kun faqs-blokken byttes ud, og
    // kun hvis vi fik mindst tre brugbare par. Færre end det er en halv
    // udskiftning, og så er den gamle FAQ bedre end en amputeret ny.
    let fm = fmAf(k.raw);
    if (nyeFaqs.length >= 3) {
      const yaml = 'faqs:\n' + nyeFaqs.map((f) =>
        `  - question: "${f.q.replace(/"/g, "'")}"\n    answer: "${f.a.replace(/"/g, "'")}"`).join('\n') + '\n';
      fm = /^faqs:/m.test(fm)
        ? fm.replace(/^faqs:\r?\n(?:[ \t]+.*\r?\n)+/m, yaml)
        : fm.replace(/\r?\n---\s*$/, '\n' + yaml + '---');
    }

    fs.writeFileSync(path.join(DIR, k.f), `${fm}\n\n${ny}\n`, 'utf8');
    console.log(`OK ${k.ord} -> ${n} ord · FAQ ${nyeFaqs.length}${forsoeg > 1 ? ` (forsøg ${forsoeg})` : ''}`);
    rettet++;
    sidsteFejl = null;
    break;
  } catch (e) {
    sidsteFejl = e.message;
    if (forsoeg < 3) { await new Promise((r) => setTimeout(r, 2000)); continue; }
  }
  }
  if (sidsteFejl) {
    console.log(`sprunget over efter 3 forsøg: ${sidsteFejl.slice(0, 52)}`);
    fejl.push(`${k.f}: ${sidsteFejl.slice(0, 70)}`);
    sprunget++;
  }
  await new Promise((r) => setTimeout(r, 2000));
}

console.log(`\nOmskrevet: ${rettet} · sprunget over: ${sprunget}`);
if (fejl.length) { console.log('\nSprunget over:'); for (const x of fejl) console.log('  ' + x); }
