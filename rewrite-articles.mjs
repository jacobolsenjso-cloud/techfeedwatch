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
import { flesch, TUNGE_ORD } from './src/lib/readability.mjs';

const DIR = 'src/content/videos';
const MIN_ORD = 700;
const dryRun = process.argv.includes('--dry-run');
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY mangler'); process.exit(1); }
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const felt = (raw, k) => raw.match(new RegExp(`^${k}:\\s*"([^"]*)"`, 'm'))?.[1] || '';
const fmAf = (raw) => raw.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] || '';
const ordtal = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Tidsgrænse på ethvert netværkskald.
//
// Uden den hang kørslen af bunke 1 fast på artikel 17 og lavede ingenting i 17
// minutter: hverken transskript-hentningen eller Gemini-kaldet havde en
// grænse, så ét svar der aldrig kom, blokerede resten. Et kald der tager mere
// end to minutter kommer ikke igen — bedre at springe artiklen over og fortsætte.
const medTidsgraense = (loefte, sekunder, hvad) => Promise.race([
  loefte,
  new Promise((_, afvis) => setTimeout(() => afvis(new Error(`${hvad} svarede ikke inden for ${sekunder}s`)), sekunder * 1000)),
]);

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
${spoergsmaal ? `\nTHE READER'S QUESTION: someone searching Google typed "${spoergsmaal}". That question is this article's job. Answer it plainly early on. If the material does not answer it, write the article without it - never state that information is missing or unavailable.\n` : ''}
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
11. SENTENCE LENGTH: average under 20 words. This is measured and the article
   is rejected above it. Technical terms have to stay - authentication is
   called authentication - but everything around them should be ordinary
   English. Write "use" not "utilize", "about" not "approximately", "shows"
   not "demonstrates", "help" not "facilitate", "people" not "individuals",
   "how it works" not "the implementation". A sentence with two clauses is
   usually two sentences.
12. No links, no images, no author bio, no sign-off.

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
    // Er den allerede skrevet om? Uden dette mærke vælger scriptet de ældste
    // artikler hver gang — og det er netop dem der lige er blevet behandlet.
    // Første kørsel af punkt 2 skrev fire af de samme 14 om igen.
    alleredeOmskrevet: /^rewrittenAt:/m.test(raw),
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
} else {
  // Uden en liste springes de allerede omskrevne over. Ellers ville hver
  // kørsel tage de ældste igen — altså dem der lige er blevet behandlet.
  const foer = valgte.length;
  valgte = valgte.filter((k) => !k.alleredeOmskrevet);
  console.log(`${foer - valgte.length} allerede omskrevet — springes over\n`);
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
  // Samlet frist pr. artikel. Tre forsøg med hver sit transskript-, generings-
  // og reparationskald kan lovligt tage 15 minutter, og så ser kørslen død ud
  // uden at være det — det kostede en unødig standsning midt i bunke 5.
  // Fire minutter er nok til to fulde forsøg; er artiklen ikke i hus da,
  // koster den mere end den er værd.
  const frist = Date.now() + 4 * 60 * 1000;
  for (let forsoeg = 1; forsoeg <= 3; forsoeg++) {
    if (Date.now() > frist) { sidsteFejl = sidsteFejl || 'tog for lang tid'; break; }
  try {
    const transcript = await medTidsgraense(YoutubeTranscript.fetchTranscript(k.id), 45, 'transskript-hentning');
    const tekst = transcript.map((x) => x.text).join(' ');
    if (ordtal(tekst) < 150) throw new Error('transskript for kort til at skrive ud fra');

    // Har artiklen intet gemt spørgsmål, hentes ét ud fra titlen. Det giver
    // omskrivningen et mål — uden det bliver den let til et pænere referat.
    //
    // Frøet er ordene EFTER kolon/tankestreg hvis der er et. "Linus
    // Torvalds: AI in Programming" gav frøet "Linus Torvalds", autocomplete
    // svarede "linus torvalds net worth", og modellen skrev "Information
    // regarding Linus Torvalds' net worth is not available in the research
    // material" midt i artiklen. Et navn som frø giver personsøgninger.
    // Svar der ligner personsøgninger kasseres uanset.
    let spoergsmaal = k.spoergsmaal;
    if (!spoergsmaal) {
      const dele = k.titel.split(/[:\u2013\u2014|]/).map((d) => d.trim()).filter(Boolean);
      const emne = dele.length > 1 ? dele[1] : dele[0];
      const froe = emne.split(/\s+/).slice(0, 4).join(' ');
      const PERSON = /\b(net worth|age|wife|husband|girlfriend|boyfriend|height|salary|house|dead|death|died|kids|children|family|religion|nationality)\b/i;
      try {
        const f = await hentForslag(froe);
        const brugbart = f.find((s) => !PERSON.test(s));
        if (brugbart) spoergsmaal = brugbart;
      } catch { /* autocomplete er en forbedring, ikke en forudsætning */ }
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // Lavere temperatur. Standarden er sat til at være opfindsom, og
      // opfindsomhed er præcis det der producerer tal der lyder rigtige.
      // Her skal den forklare et emne, ikke digte.
      generationConfig: { maxOutputTokens: 16384, temperature: 0.4 },
    });
    const res = await medTidsgraense(model.generateContent(byg(k.titel, felt(k.raw, 'summary'), spoergsmaal, tekst)), 120, 'Gemini');

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

    // Kilden til tal: transskript OG den gamle artikel. Står tallet ét af
    // stederne, er det ikke fundet på her.
    const kilde = (tekst + ' ' + k.raw).replace(/[\s,]/g, '').toLowerCase();

    // Alle kontroller ét sted, så de kan køres igen efter en reparation.
    const tjek = (t) => {
      const ud = [];
      // "the video" er kildevideoen når den forklarer, viser eller siger
      // noget — ikke når artiklen handler om videoer. meta-ai-s-secret-weapon
      // (om et video-generator-værktøj) fejlede seks forsøg i træk fordi
      // "the video it produces" og "export the video" ramte \bthe video\b.
      // Nu kræves et verbum eller en indledning der peger på KILDEN.
      const kildevideo = /\b(in|from|throughout|according to|as) (the|this) video\b|\b(the|this) video (explains|shows|argues|covers|says|suggests|walks|breaks|discusses|highlights|notes|points|demonstrates|goes|makes|presents|reveals|claims|describes|outlines|mentions|recommends|warns|concludes|opens|begins|ends|starts)\b|\bthe speaker\b|\bthe presenter\b/i;
      if (kildevideo.test(t)) {
        ud.push('Remove every mention of the source video, its speaker or its presenter. Rewrite those sentences to be about the subject.');
      }
      // Alle tal, ikke kun procenter og beløb.
      //
      // Den første udgave så kun efter procenter og valuta, så "1,000 free
      // transactions a month" slap igennem — en konkret prispåstand om et
      // rigtigt produkt, som ikke stod i kilden. Et tal er et tal.
      //
      // Årstal og tal under 10 undtages: de er næsten altid modellens egne
      // optællinger ("three ways", "5 steps") og ikke påstande om verden.
      const tal = [...new Set((t.match(/\b\d[\d.,]*\b|\b\d{1,3}(?:[.,]\d+)?\s?(?:percent|%)|[$€£]\s?\d[\d.,]*(?:\s?(?:billion|million|trillion))?/gi) || [])
        .map((x) => x.replace(/[\s,]/g, '').replace(/[.]$/, '').toLowerCase()))]
        .filter((x) => {
          const rent = x.replace(/[^\d.]/g, '');
          if (/^(19|20)\d\d$/.test(rent)) return false;
          if (Number(rent) < 10) return false;
          return true;
        })
        .filter((x) => !kilde.includes(x));
      if (tal.length) {
        // Første udgave sagde "erstat tallet med 'a large share' eller 'a
        // significant sum'". Modellen gjorde præcis dét — mekanisk — og
        // efterlod sætninger som "daily budgets of $50, $30, $20, $25, $100,
        // or even a significant sum" og "a 5.5x return from a total spend of a
        // significant sum". Instruktionen skal bede om en OMSKRIVNING, ikke om
        // en indsættelse.
        ud.push(`These figures are not in the source and must go: ${tal.join(', ')}. Do not substitute a phrase where the number was - rewrite the sentence so it does not need a number at all, and reads naturally. If removing it leaves the sentence pointless, delete the sentence.`);
      }
      const ord = [...new Set(
        (t.match(/\b(delve|tapestry|realm|landscape|testament|crucial|robust|unlock|unleash|elevate|seamless|paradigm shift)\b/gi) || [])
          .map((x) => x.toLowerCase())
      )];
      if (ord.length) {
        ud.push(`These words are banned and must be replaced with plain alternatives: ${ord.join(', ')}.`);
      }

      // Læsbarhed. Sætningslængden er det eneste af de to input vi reelt kan
      // styre — stavelser pr. ord er bundet af emnet, og "authentication"
      // hedder det uanset hvad. Kortere sætninger er også dét der hjælper
      // læseren mest.
      const l = flesch(t);
      if (l && l.ordPrSaetning > 21) {
        ud.push(`Sentences average ${l.ordPrSaetning.toFixed(0)} words, which is too long. Split the longest ones. A sentence with two clauses joined by "and", "which" or a comma is usually two sentences. Aim for an average under 20 without making every sentence the same length.`);
      }

      // Latinsk fyld med almindelige alternativer. Fagord røres ikke.
      const tunge = Object.keys(TUNGE_ORD)
        .filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
      if (tunge.length >= 4) {
        ud.push(`Replace these with everyday words: ${tunge.slice(0, 8).map((w) => `${w} -> ${TUNGE_ORD[w]}`).join(', ')}. Keep genuine technical terms as they are.`);
      }

      // Spor efter en mislykket reparation. Står en vending som "a significant
      // sum" i en opremsning af tal, eller lige efter et beløb, er tallet
      // blevet byttet ud mekanisk og sætningen giver ikke længere mening.
      // Denne kontrol findes fordi det slap igennem én gang: "daily budgets of
      // $50, $30, $20, $25, $100, or even a significant sum".
      const VENDING = '(a significant sum|a large share|a substantial amount|a considerable sum)';
      const klodset = [
        new RegExp(`[$€£]\\s?[\\d.,]+[^.]{0,40}\\b${VENDING}\\b`, 'i'),   // efter et beløb
        new RegExp(`\\b${VENDING}\\b[^.]{0,40}[$€£]\\s?[\\d.,]+`, 'i'),   // før et beløb
        new RegExp(`\\bof\\s+${VENDING}\\b`, 'i'),                        // "a return from a total spend of ..."
      ].some((re) => re.test(t));
      if (klodset) {
        ud.push('A number was swapped for a vague phrase and the sentence no longer makes sense - for example a list of amounts ending in "a significant sum", or a return calculated from "a significant sum". Rewrite those sentences properly so they read naturally without any number, or remove them.');
      }

      // Modellen taler om sit eget grundlag. Slap igennem én gang:
      // "Information regarding Linus Torvalds' net worth is not available in
      // the research material for this article." Alle øvrige kontroller
      // bestod. Årsagen var et autocomplete-spørgsmål der ikke kunne
      // besvares; det er lukket ovenfor, men sætningen kan opstå af andre
      // grunde og skal fanges uanset.
      const meta = t.match(/[^.\n]*\b(not (?:available|provided|covered|mentioned|included) in the (?:research|source|provided|available) (?:material|content|information|text)|the research material|based on the (?:available|provided) (?:material|information)|the source (?:material )?does not (?:mention|cover|provide|say))\b[^.\n]*/i);
      if (meta) {
        ud.push(`This sentence talks about the article's own sources and must be deleted entirely, not rephrased: "${meta[0].trim()}". Never tell the reader what the material does or does not contain.`);
      }
      return ud;
    };

    let mangler = tjek(ny);

    // Reparation frem for at kaste alt væk.
    //
    // Før blev en hel artikel kasseret fordi ét ord var forkert, og næste
    // forsøg skrev 1.200 ord forfra — altså blev terningen kastet igen på
    // ALT. Derfor hjalp gentagelser så lidt.
    //
    // Her sendes udkastet tilbage med fejlen udpeget og besked om kun at rette
    // dét. Det er en langt lettere opgave end at skrive artiklen, og den gode
    // del af teksten overlever.
    if (mangler.length) {
      const rep = await medTidsgraense(model.generateContent(
        `Below is an article that is almost finished. Fix ONLY the specific faults listed, and change nothing else - keep the same structure, headings, length and wording everywhere else.

FAULTS TO FIX:
${mangler.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Return the corrected article body in Markdown and nothing else. No preamble, no explanation of what you changed.

ARTICLE:
${ny}`
      ), 120, 'Gemini (reparation)');
      const repFinish = rep.response?.candidates?.[0]?.finishReason;
      if (!repFinish || repFinish === 'STOP') {
        const repareret = rep.response.text().trim()
          .replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '')
          .replace(/^#\s+.*$/m, '').trim();
        // Kun hvis reparationen faktisk er en artikel og faktisk hjalp.
        if (ordtal(repareret) >= MIN_ORD && tjek(repareret).length < mangler.length) {
          ny = repareret;
          mangler = tjek(ny);
        }
      }
    }

    if (mangler.length) throw new Error(mangler[0].slice(0, 70));

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

    // Mærk artiklen som omskrevet, så næste kørsel ikke vælger den igen.
    // Uden det tager scriptet de ældste hver gang — og det er netop dem der
    // lige er blevet behandlet.
    const iDag = new Date().toISOString().slice(0, 10);
    fm = /^rewrittenAt:/m.test(fm)
      ? fm.replace(/^rewrittenAt:.*$/m, `rewrittenAt: "${iDag}"`)
      : fm.replace(/\r?\n---\s*$/, `\nrewrittenAt: "${iDag}"\n---`);

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
