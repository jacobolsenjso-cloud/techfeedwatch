import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { manglerKonkret, kildeNavn, taelTal, konkretScore, MIN_SCORE, laesbarhed, MAX_ORD_PR_SAETNING } from './src/lib/konkret.mjs';
import { MIN_FAKTA, MIN_BRUGT, faktaarkPrompt, parseFaktaark, faktaarkScore, faktaarkTekst, ukendteTal, brugteFakta } from './src/lib/faktaark.mjs';
import fs from 'fs';
import 'dotenv/config';
import { generateOgCard } from './og-card.mjs';
import { lavAiBillede, sitetsStier, harAiBillede } from './src/lib/aibillede.mjs';
import { pubCase, manglendeKerneord, overskriftAfSpoergsmaal, kerneord, stamme } from './src/lib/headline.mjs';
import { faellesOrd } from './src/lib/question.mjs';
import { fjernForbudteOrd, findForbudte } from './src/lib/forbudt.mjs';
import { erRelevant } from './src/lib/relevans.mjs';
import { erReklame } from './src/lib/reklame.mjs';
import { hentSegmenter } from './src/lib/transskript.mjs';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';
import { tilfoejEksterneLinks } from './src/lib/eksterne-links.mjs';
// foersteAfsnit omdøbes ved import: add-video har sin egen lokale foersteAfsnit
// (returnerer tekst), og navnet skjulte importen — loggen i prøve #3 viste "undefined ord".
import { talesprog, tekstDiagram, uklareKilder, klistretSoegeord, lister, MIN_LISTER, foersteAfsnit as foersteAfsnitTal, delFoersteAfsnit, delLangeAfsnit, afsnitsTal, fyldKandidater, fjernSaetninger, ordretFraKilde, ordretAndel, tvungneLinks, fjernTvungneLinks, aiFraser } from './src/lib/skriveregler.mjs';
import { laesHjerne, stemmeBlok, minHoldningPrompt, tjekMinHoldning, fletIndHoldning } from './src/lib/hjerne.mjs';
import { laeserTjek, retLaeserFund } from './src/lib/laesertjek.mjs';
// Søgning først (fase B, 12/10): artiklen bygges på Google-søgningen; videoen er et supplement.
import { undersoegSoegning, soegningTekst, daekning } from './src/lib/soegning.mjs';
import { videoAndel, videoAfsnit, talUdenKilde, brugteKilder, kildelisteMd, noegleFakta, VIDEO_ANDEL_MAAL, VIDEO_ANDEL_MAKS, MAKS_TAL_UDEN_KILDE, MIN_KILDER_BRUGT } from './src/lib/kildetjek.mjs';
import { redaktoerTjek } from './src/lib/redaktoertjek.mjs';
// Faktatjek og læsbarhed før udgivelse (25/10): kildebinding, mål/datoer, skeptisk faktatjekker, klassetrin.
import { klassetrin, forenklPrompt, KLASSETRIN_MAAL, KLASSETRIN_MAKS, KLASSETRIN_STOP, ORD_MAAL, ORD_STOP } from './src/lib/faktatjek.mjs';
import { slutkontrol } from './src/lib/slutkontrol.mjs';
import { vaerktoejTil, brugsSaetning } from './src/lib/vaerktoej.mjs';
import { ALLE_EMNER } from './src/lib/emner.mjs';
// Outline før tekst + FAQ fra rigtige Google-søgninger (12/10)
import { lavOutline, strukturTekst, outlineBrugt, faqFraSoegninger } from './src/lib/artikelplan.mjs';
import { hentForslag } from './src/lib/suggest.mjs';
// Videoen må højst levere så mange konkrete detaljer, at den forbliver et supplement (var 5).
const MIN_VIDEO_DETALJER = 2;
// Så mange ensidige sætninger må stå tilbage efter redaktørens rettelse (12/10, se stoppet nedenfor).
const MAKS_ENSIDIGE = 2;
// Merværdi (8/10): højst denne andel af brødtekstens sætninger må dele 8 ord i træk med videoen.
const ORDRET_MAKS = 0.15;
// Læsertjek (8/10): så mange fund efter rettelsen stopper artiklen.
const LAESER_MAKS = 3;

// Alle 18 emner kommer fra src/lib/emner.mjs (17/10), så robot og site altid er enige.
const ALLOWED_TAGS = ALLE_EMNER;

// Renser links i den genererede brødtekst før den gemmes.
//
// Gemini opfandt engang et link til http://localhost:3000/video/shipping-10x-faster
// og det lå live på sitet, hvor ingen bruger kunne nå det. Den slags skal ikke
// kunne slippe igennem igen:
//  - localhost og 127.0.0.1 -> linket fjernes, teksten beholdes
//  - absolutte links til vores eget domæne -> laves relative
//  - vi accepterer kun /video/, /tag/, /guides/, /glossary/, /tools/ og et par
//    faste sider som interne mål. Alt andet internt afvikles til ren tekst.
export function sanitizeLinks(md) {
  const ALLOWED = /^\/(video|tag|guides|glossary|tools|archive|library|latest|popular|trends)(\/|$)/;

  return md.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text, url) => {
    // Udviklingsadresser er altid en fejl
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url)) return text;

    // Vores eget domæne skrevet absolut -> gør relativt
    const own = url.match(/^https?:\/\/(?:www\.)?techfeedwatch\.com(\/.*)?$/i);
    if (own) {
      const path = own[1] || '/';
      return ALLOWED.test(path) || path === '/' ? `[${text}](${path})` : text;
    }

    // Eksterne links får lov at stå
    if (/^https?:\/\//i.test(url)) return whole;
    if (/^(mailto:|tel:|#)/i.test(url)) return whole;

    // Interne stier: kun kendte sektioner
    if (url.startsWith('/')) return ALLOWED.test(url) ? whole : text;

    // Relative stier uden skråstreg peger sjældent hvor modellen tror
    return text;
  });
}

// Mindste videolængde vi udgiver. Tidligere blev alt under 180s markeret som
// "Short" og fik en side helt uden brødtekst — 205 tomme sider i alt, som blev
// fjernet igen. Nu afvises korte videoer i stedet, før vi bruger API-kvote på dem.
const MIN_DURATION_SECONDS = 180;

// Artikel-profiler: hver normal video roterer gennem én af disse, valgt deterministisk ud fra video-ID.
// Formålet er at bryde ensartetheden (samme struktur/længde = "masseproduceret"-signal hos Google).
// Format-kontrakten (TITLE/TAGS/SUMMARY/FAQ/CONTENT) og banned-words gælder stadig for alle profiler.
const ARTICLE_PROFILES = [
  {
    name: "Deep Analysis",
    min: 1100, max: 1500,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: 2-3 sentence executive summary (no heading, no label).
    - A short intro paragraph with a data-driven hook or a bold contrarian statement.
    - A "## " section with 3-4 bullets: the most critical, non-obvious insights.
    - A "## " section explaining the core concepts objectively and clearly.
    - A "## " section on the concrete real-world impact on workflows, security, or industry.
    - A "## " section on risks, limitations, costs, or unexpected angles.
    - A closing "## " section with a final objective assessment: passing trend or permanent shift?
    Every heading is specific to THIS subject and says what the section answers (for example "Why NVIDIA's lead is hard to copy", not "Technical Breakdown" or "The Verdict").`
  },
  {
    name: "News Brief",
    min: 700, max: 950,
    structure: `STRUCTURE (keep it tight and punchy - this is a short news brief):
    - Opening: 1-2 sentence summary of what happened (no heading, no label).
    - Two or three short paragraphs covering the essentials and why they matter. Use at most one "## " subheading, or none.
    - A closing "## " section: one tight paragraph with your read on it, under a heading specific to this story (not "The Bottom Line").`
  },
  {
    name: "Explainer",
    min: 900, max: 1250,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence plain-language summary (no heading, no label).
    - A "## " section defining the subject clearly for a smart non-expert.
    - A "## " section on the mechanics, explained simply and accurately.
    - A "## " section on who benefits, and who does not.
    - A closing "## " section with a short, practical takeaway.
    Every heading is specific to THIS subject (for example "How a breach notice is triggered", not "How It Works", "What It Is", "Who It's For" or "The Bottom Line").`
  },
  {
    name: "Editorial",
    min: 900, max: 1250,
    structure: `STRUCTURE (an opinionated editorial - take a clear, reasoned stance while staying factually honest):
    - Opening: state your thesis or argument in 2-3 sentences (no heading, no label).
    - Two or three "## " sections that build the argument, with your own topic-specific headings.
    - A closing "## " section with a decisive editorial conclusion that commits to a view, under a heading that states the view (not "Where This Lands").`
  },
  {
    name: "Practical Q&A",
    min: 900, max: 1250,
    structure: `STRUCTURE (a practical, reader-first piece):
    - Opening: a 2 sentence summary of the practical question at stake (no heading, no label).
    - Two or three "## " headings phrased as the real questions readers are asking.
    - A closing "## " section with concrete, honest guidance, under a heading specific to the subject (not "What To Actually Do").`
  },
  {
    name: "Context & Implications",
    min: 900, max: 1250,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence summary (no heading, no label).
    - A "## " section on the context and history the source skipped over.
    - A "## " section on what is actually new or different here.
    - A "## " section on the second-order consequences across the industry.
    - A closing "## " section on where this is heading and the signals to track.
    Every heading is specific to THIS subject (not "The Background", "What Changed", "The Ripple Effects" or "What To Watch Next").`
  },
];

// Stabil hash af en streng, så profil-valg og længde er deterministisk pr. video (samme video = samme profil).
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---- Titelform-rotation ----
// Målt 20/8 på arkivet: 80% af titlerne havde kolon-formen "X: Y", 27% "&",
// og kun 3 af 386 var spørgsmål — sitets mest maskinelle synlige træk. Alle
// 386 blev omskrevet med spredte former; rotationen her sørger for at nye
// artikler fødes varierede i stedet for at skulle repareres bagefter.
// Formen vælges deterministisk af videoId (afkoblet fra artikel-profilen via
// eget salt), så fordelingen bliver 25% kolon, 37,5% spørgsmål, resten udsagn.
//
// Rettet 20/9: spørgsmålsformen gik fra 1 af 8 former (målt 10,2% på arkivet)
// til 3 af 8. Hvorfor: Googles egne tal (Caleb Ulku 4/8-2026) viser at
// søgninger på 1-3 ord udløser et AI-svar 23% af tiden, mens søgninger på 6+
// ord gør det 77% — og at AI-systemer matcher spørgsmålet i brugerens EGNE
// ord mod overskriften. Målt på sitet 20/9: kun 15 af de 42 seneste titler
// (36%) var spørgsmål mod 51% i arkivet, så rotationen trak den forkerte vej.
// De tre spørgsmålsformer er bevidst forskellige i karakter, så forsiden ikke
// får tre ens "What Is ...?"-titler i træk — det var netop problemet 20/8.
const TITLE_FORMS = [
  'A plain declarative headline. No colon, no question mark. Vary the opening word.',
  'A how/what/why headline WITHOUT a question mark. No colon.',
  'A genuine question ending in a question mark. No colon. Use the wording of the search question as closely as it reads naturally.',
  'A two-part headline with ONE colon; the part before the colon is 1-3 words.',
  'A question ending in a question mark that names the specific thing or situation it answers, not just the broad topic.',
  'A plain declarative headline. No colon, no question mark. May start with a number if the article genuinely lists things.',
  'A "What ... Means for ..." or "How ... Changes ..." headline. No colon, no question mark.',
  'A "How Do You ..." or "What Happens When ..." question ending in a question mark. No colon.',
];

// Overskrifts-regler (pubCase, søgeords-værn) ligger i src/lib/headline.mjs,
// delt med retitle-to-demand.mjs.

// Åbningsords-værn: de seneste ~15 artiklers første titelord er forbudte som
// åbning, så forsiden ikke får tre "How ..."-titler i træk. Én models sprogtone
// konvergerer — formen kan roteres, men gentagne åbninger er det synlige symptom.
function senesteAabningsord() {
  const dir = './src/content/videos';
  if (!fs.existsSync(dir)) return [];
  const rows = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const raw = fs.readFileSync(`${dir}/${f}`, 'utf-8');
    const t = raw.match(/^title:\s*"(.+)"/m)?.[1];
    const d = raw.match(/^date:\s*"(.*?)"/m)?.[1] || '';
    if (t) rows.push({ d, ord: t.split(' ')[0] });
  }
  rows.sort((a, b) => b.d.localeCompare(a.d));
  return [...new Set(rows.slice(0, 15).map((r) => r.ord))];
}

// Laver en URL-venlig slug ud fra en titel: lowercase, uden accenter/specialtegn, bindestreg-separeret.
const SLUG_MAX_LENGTH = 70;

function slugify(title) {
  const raw = title
    // æ/ø/œ/ß har ingen NFKD-dekomposition (i modsætning til fx é/å), så de translittereres eksplicit her
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .replace(/ø/gi, 'o')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // fjerner resterende accenter (é -> e, å -> a, osv.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (raw.length <= SLUG_MAX_LENGTH) return raw;

  // Klip ved sidste hele bindestreg-adskilte del inden for grænsen, så vi aldrig skærer midt i et ord.
  // Findes ingen bindestreg inden for grænsen (ét langt ord), falder vi tilbage til det hårde snit.
  const hardCut = raw.slice(0, SLUG_MAX_LENGTH);
  const lastHyphen = hardCut.lastIndexOf('-');
  const wholeWordCut = lastHyphen > 0 ? hardCut.slice(0, lastHyphen) : '';

  return (wholeWordCut || hardCut).replace(/-+$/g, '');
}

// Gør en slug unik hvis den allerede er brugt af en ANDEN video (samme youtubeId genbruger blot filen).
function resolveUniqueSlug(baseSlug, videoId) {
  const dir = './src/content/videos';
  const readExistingId = (path) => {
    const content = fs.readFileSync(path, 'utf-8');
    const match = content.match(/youtubeId:\s*"(.*?)"/);
    return match ? match[1] : null;
  };

  let candidate = baseSlug;
  let candidatePath = `${dir}/${candidate}.md`;
  if (!fs.existsSync(candidatePath) || readExistingId(candidatePath) === videoId) {
    return candidate;
  }

  // Kollision med en anden video: tilføj et kort, deterministisk suffiks fra videoId'et
  const suffix = videoId.slice(0, 6).toLowerCase();
  candidate = `${baseSlug}-${suffix}`;
  candidatePath = `${dir}/${candidate}.md`;

  let attempt = 1;
  while (fs.existsSync(candidatePath) && readExistingId(candidatePath) !== videoId) {
    attempt++;
    candidate = `${baseSlug}-${suffix}-${attempt}`;
    candidatePath = `${dir}/${candidate}.md`;
  }

  return candidate;
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

let url = process.argv[2];

// --tag "Cybersecurity": det emne robotten LEDTE efter. Uden det bestemmer
// Gemini selv mærket, og den svarer næsten altid "AI & Tech", fordi næsten alt
// tech kan kaldes det. Resultatet var 280 af 367 artikler under ét mærke.
// Med flaget bliver søgeemnet artiklens primære mærke, og Gemini må højst
// tilføje ét mere.
const tagFlagIndex = process.argv.indexOf('--tag');
let forcedTagRaw = tagFlagIndex > -1 ? process.argv[tagFlagIndex + 1] : null;

// Spørgsmålet fra autocomplete: den søgning artiklen skal svare på. Uden det
// blev artiklen skrevet ud fra videoen alene, og ingen i kæden havde spurgt om
// nogen søger på emnet.
const qFlagIndex = process.argv.indexOf('--question');
let targetQuestion = qFlagIndex > -1 ? (process.argv[qFlagIndex + 1] || '').trim() : '';
// --faktaark-only: kør alle kontroller og lav faktaarket, men skriv IKKE
// artiklen. Robotten (auto-youtube.mjs) bruger det til at vurdere flere
// kandidatvideoer og vælge den rigeste, før den betaler for én artikel.
// Arket gemmes i _faktaark-<videoId>.json (ignoreret af git), så den rigtige
// kørsel bagefter ikke skal lave det igen.
const faktaarkOnly = process.argv.includes('--faktaark-only');
const faktaarkFil = (id) => `./_faktaark-${id}.json`;

// --erstat <slug>: skriv en EKSISTERENDE artikel om med den nye kæde. Adressen
// (slug), udgivelsesdatoen og søgespørgsmålet beholdes, så Google ser samme
// side med bedre indhold — ikke en ny side og en død. Artiklen mærkes
// rewrittenAt. Bruges til at afprøve kæden på de svageste gamle artikler, før
// vi beslutter om alle 426 skal igennem.
const erstatIndex = process.argv.indexOf('--erstat');
const erstatSlug = erstatIndex > -1 ? (process.argv[erstatIndex + 1] || '').trim() : '';
let erstatGammel = null; // frontmatter fra den gamle fil
if (erstatSlug) {
  const sti = `./src/content/videos/${erstatSlug}.md`;
  if (!fs.existsSync(sti)) { console.log(`❌ Fejl: --erstat: ${sti} findes ikke.`); process.exit(1); }
  const raw = fs.readFileSync(sti, 'utf-8');
  erstatGammel = {
    youtubeId: raw.match(/^youtubeId:\s*"(.*?)"/m)?.[1] || '',
    date: raw.match(/^date:\s*"(.*?)"/m)?.[1] || '',
    targetQuestion: raw.match(/^targetQuestion:\s*"(.*?)"/m)?.[1] || '',
    tag: raw.match(/^tags:\r?\n\s*-\s*"(.*?)"/m)?.[1] || '',
  };
  // Uden URL, spørgsmål og mærke på kommandolinjen tages de fra den gamle fil.
  if (!url || url.startsWith('--')) url = `https://www.youtube.com/watch?v=${erstatGammel.youtubeId}`;
  if (!targetQuestion) targetQuestion = erstatGammel.targetQuestion;
  if (!forcedTagRaw) forcedTagRaw = erstatGammel.tag;
  console.log(`Erstatter ${erstatSlug} (dato ${erstatGammel.date}, mærke "${forcedTagRaw}"${targetQuestion ? `, spørgsmål "${targetQuestion}"` : ''})`);
}
const forcedTag = ALLOWED_TAGS.includes(forcedTagRaw) ? forcedTagRaw : null;
if (forcedTagRaw && !forcedTag) {
  console.log(`⚠️ Ukendt mærke "${forcedTagRaw}" — ignoreret. Gemini vælger selv.`);
}
const videoId = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];

if (!videoId) {
  console.log("❌ Fejl: Indsæt et gyldigt YouTube-link.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Interne links: beslægtede artikler, ikke de 10 nyeste.
//
// Før fik modellen de 10 senest skrevne filer (alfabetisk, ikke engang efter
// dato) og ordren "weave 4 to 5 of these" — så en SEO-artikel linkede til
// zero-trust med ankerteksten "SEO as if it were 2015" (målt 12/9). Nu vælges
// kandidaterne efter fælles kerneord med søgespørgsmålet og samme emne, og
// modellen må kun linke, hvor sætningen faktisk handler om målet. Bagefter
// kontrolleres hvert link deterministisk (se ankerTjek nedenfor).
const ARTIKEL_TITLER = new Map(); // slug -> titel, bruges også af ankerTjek
let internalLinksContext = "";
if (fs.existsSync('./src/content/videos')) {
  const alle = [];
  // Hvor mange brødtekst-links peger allerede på hver artikel? Målt 23/9: 214
  // artikler har ingen indgående. Ved lige relevans vælges dem først, så hver ny
  // artikel også hjælper en gammel, som ellers ingen finder vej til.
  const indgaaende = new Map();
  for (const file of fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md'))) {
    const raw = fs.readFileSync(`./src/content/videos/${file}`, 'utf-8');
    for (const m of raw.matchAll(/\]\(\/video\/([^)\/\s#?]+)/g)) indgaaende.set(m[1], (indgaaende.get(m[1]) || 0) + 1);
    if (/^isShort:\s*true/m.test(raw)) continue;
    const slug = file.replace(/\.md$/, '');
    if (slug === erstatSlug) continue; // en omskrevet artikel må ikke linke til sig selv
    const title = raw.match(/^title:\s*"(.*?)"/m)?.[1] || slug;
    ARTIKEL_TITLER.set(slug, title);
    const tags = (raw.match(/^tags:\r?\n((?:\s*-\s*.*\r?\n?)*)/m)?.[1] || '');
    const sammeEmne = forcedTag ? tags.includes(`"${forcedTag}"`) : false;
    const q = raw.match(/^targetQuestion:\s*"(.*?)"/m)?.[1] || '';
    const soegetekst = targetQuestion || forcedTag || '';
    const score = faellesOrd(soegetekst, title) * 2 + faellesOrd(soegetekst, q) + (sammeEmne ? 1 : 0);
    const dato = raw.match(/^date:\s*"(.*?)"/m)?.[1] || '';
    alle.push({ slug, title, score, dato });
  }
  // Relevans først. Ved lige relevans: artikler uden indgående links før dem med.
  const harInd = (s) => (indgaaende.get(s) ? 1 : 0);
  alle.sort((a, b) => b.score - a.score || harInd(a.slug) - harInd(b.slug) || b.dato.localeCompare(a.dato));
  const valgte = alle.filter((a) => a.score > 0).slice(0, 8);
  const kandidater = valgte.length >= 3 ? valgte : alle.slice(0, 8);
  if (kandidater.length) {
    const links = kandidater.map((a) => `[${a.title}](/video/${a.slug})`).join('\n');
    // 14/10: "Link 3 to 5" + "link text = titlen" pressede titler ind i sætninger, hvor de
    // ikke hørte hjemme (målt: 42 tvungne links i de 15 nyeste artikler). Siden viser allerede
    // relaterede artikler i egne bokse, så i teksten er 0-2 naturlige links nok.
    internalLinksContext = `\nRELATED ARTICLES ON THIS SITE (the only internal links you may use):\n${links}\nLINK RULES: Link 0 to 2 of them, and only where your sentence is already about that article's subject. The link text is 2 to 6 words taken from your own sentence (for example "a data breach" or "zero trust for AI agents") - NEVER the article's full title, never a question, never text with a colon. Never write a sentence just to place a link ("Readers can explore ...", "For more, see ...", "Understanding X reveals ..."). Related articles are already shown elsewhere on the page, so no link is better than a forced one. Forced links are removed together with their sentence.`;
  }
}

// Ankertjek: et link beholdes kun, hvis ankerteksten deler mindst ét kerneord
// med målets titel. Ellers bliver linket til almindelig tekst.
function ankerTjek(md) {
  let fjernet = 0;
  const ud = md.replace(/\[([^\]]+)\]\(\/video\/([^)\s#?]+)\/?\)/g, (whole, text, slug) => {
    const title = ARTIKEL_TITLER.get(slug);
    if (!title) return text; // ukendt mål — linket ville alligevel give 404
    // "AI" står i næsten alle titler og tæller derfor ikke som fælles ord.
    const A = new Set(kerneord(title).map(stamme));
    const faelles = kerneord(text).map(stamme).filter((w) => A.has(w) && w !== 'ai');
    if (faelles.length > 0) return whole;
    fjernet++;
    return text;
  });
  if (fjernet) console.log(`🔗 ${fjernet} interne links fjernet: ankertekst passede ikke til målet`);
  return ud;
}

async function run() {
  console.log(`Henter data for video: ${videoId}...`);
  
  try {
    let text = "";
    let duration = "0:00";
    let isShort = false;
    let youtubeTitle = null;

    // TRIN 0 — søgningen (fase B, 12/10). Artiklen skal svare på det, folk søger
    // på Google; videoen er et supplement. Gemini undersøger søgningen med Google
    // (delspørgsmål + fakta med kilde) FØR videoen hentes: er søgningen for tynd,
    // stopper vi her, før der er brugt penge på transskript og faktaark. Resultatet
    // gemmes pr. spørgsmål (.cache/soegning), så robottens 4 kandidater deler det.
    if (!targetQuestion) {
      console.log(`Sprunget over: intet søgespørgsmål — opskriften "søgning først" kræver et (${videoId})`);
      return;
    }
    const soeg = await undersoegSoegning(genAI, targetQuestion, { onLog: (m) => console.log(m), hentModel });
    // Linjen læses af prøve-målingen (fase C) til prisen. Ændr ikke formatet.
    // Kun når søgningen faktisk blev betalt nu (ikke læst fra cache), ellers tælles prisen dobbelt.
    if (soeg.usage && !soeg.fraCache) console.log(`SOEG-FORBRUG: ${JSON.stringify({ soegninger: soeg.soegninger.length, tokens: soeg.usage.totalTokenCount, ind: soeg.usage.promptTokenCount, ud: soeg.usage.candidatesTokenCount, tanker: soeg.usage.thoughtsTokenCount || 0 })}`);
    if (soeg.forTynd) {
      console.log(`Sprunget over: søgningen gav for lidt med kilde (${soeg.delspoergsmaal.length} delspørgsmål, ${soeg.fakta.length} fakta, ${soeg.kilder.length} kilder) — "${targetQuestion}"`);
      return;
    }
    // A (16/10): delspørgsmål, som ingen Google-fakta dækker, droppes NU — ellers skriver
    // robotten en hel artikel, som redaktørtjekket kasserer for "ubesvaret" (dyreste fejl).
    // Ingen modelkald. Bliver der under 3 tilbage, springes over, før videoen hentes.
    {
      const d = daekning(soeg.delspoergsmaal, soeg.fakta, targetQuestion);
      // Linjen skrives ALTID (16/10): prøve #13 viste, at et tjek, der kun logger når det finder noget,
      // ikke kan skelnes fra et tjek, der ikke kørte.
      console.log(`DAEKNING: ${JSON.stringify({ behold: d.behold.length, droppet: d.droppet.map((x) => x.q) })}`);
      if (d.droppet.length) soeg.delspoergsmaal = d.behold;
      if (soeg.delspoergsmaal.length < 3) {
        console.log(`Sprunget over: kun ${soeg.delspoergsmaal.length} delspørgsmål har fakta bag sig — "${targetQuestion}"`);
        return;
      }
    }

    // Kildeangivelse hentes ALTID (uafhængigt af Plan A/B), så hver artikel kan
    // kreditere den oprindelige kanal. Fejler dette, fortsætter vi uden kilde.
    let channelTitle = null;
    let videoBeskrivelse = ''; // til eksterne links (src/lib/eksterne-links.mjs)
    let videoTitel = ''; // til reklameværnet (src/lib/reklame.mjs)
    let channelId = null;
    let publishedAt = null;
    let viewCount = null;
    let thumbMax = false;
    // Videoens længde fra YouTubes egne data. Bruges til "duration" frem for
    // transskriptet: målt 12/10 gav et transskript hentet på pc'en længderne i
    // millisekunder, og en 8:20-video blev skrevet som 26:07.
    let metaSek = 0;
    try {
      const metaKey = process.env.YOUTUBE_API_KEY;
      if (metaKey) {
        // statistics koster ingen ekstra kvote i samme kald, og giver os
        // visningstallet til /popular. Uden det ville nye artikler mangle tal
        // indtil update-view-counts.mjs kørte næste gang.
        const metaUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${metaKey}`;
        const metaRes = await fetch(metaUrl);
        const metaData = await metaRes.json();
        const sn = metaData.items?.[0]?.snippet;
        const stats = metaData.items?.[0]?.statistics;
        if (Number.isFinite(Number(stats?.viewCount))) viewCount = Number(stats.viewCount);
        // Findes det store miniaturebillede? Kun nogle videoer har det, og uden
        // dette svar ville artiklens schema love et billede der giver 404.
        if (sn) thumbMax = Boolean(sn.thumbnails?.maxres);
        if (sn) {
          channelTitle = sn.channelTitle || null;
          videoBeskrivelse = sn.description || '';
          videoTitel = sn.title || '';
          channelId = sn.channelId || null;
          publishedAt = sn.publishedAt || null;
          console.log(`Info: Kilde fundet — ${channelTitle}`);
        }

        // Korte videoer afvises HER — før transskription og før den dyre
        // Gemini-prompt. En video på under MIN_DURATION_SECONDS giver ikke
        // stof nok til en rigtig artikel, og tomme sider skader sitet.
        const iso = metaData.items?.[0]?.contentDetails?.duration;
        if (iso) {
          const dm = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const secs =
            (dm?.[1] ? parseInt(dm[1]) : 0) * 3600 +
            (dm?.[2] ? parseInt(dm[2]) : 0) * 60 +
            (dm?.[3] ? parseInt(dm[3]) : 0);
          metaSek = secs;
          if (secs > 0 && secs < MIN_DURATION_SECONDS) {
            console.log(`⏭️ Sprunget over: videoen er ${secs}s (under ${MIN_DURATION_SECONDS}s). Korte videoer udgives ikke.`);
            return;
          }
        }
      }
    } catch (metaError) {
      console.log(`⚠️ Kunne ikke hente kanalinfo: ${metaError.message}`);
    }

    try {
      // PLAN A: Prøv at hente undertekster (fra cache hvis vi har hentet dem før —
      // se src/lib/transskript.mjs; YouTube drosler os, så hver video hentes én gang)
      const { segmenter: transcript, fraCache, kilde: tKilde } = await hentSegmenter(videoId, {
        onVent: (s) => console.log(`   YouTube drosler — venter ${s / 60} min`),
        onLog: (m) => console.log(`   ${m}`),
      });
      if (fraCache) console.log(`Transskript: læst fra cache${transcript[0]?.kilde === 'gemini' ? ' (Gemini)' : ''}`);
      else if (tKilde === 'gemini') console.log('Transskript: Gemini så videoen');
      text = transcript.map(t => t.text).join(' ');

      const lastT = transcript[transcript.length - 1];
      const totalSeconds = Math.floor(lastT.offset / 1000 + lastT.duration);
      // Sikkerhedsnet: hvis metadata-kaldet ovenfor fejlede, fanges korte videoer her
      if (totalSeconds > 0 && totalSeconds < MIN_DURATION_SECONDS) {
        console.log(`⏭️ Sprunget over: videoen er ${totalSeconds}s (under ${MIN_DURATION_SECONDS}s).`);
        return;
      }
      duration = formatDuration(metaSek > 0 ? metaSek : totalSeconds);
    } catch (transcriptError) {
      // Ingen undertekster = ingen kilde. Før 15/9 fandtes en "Plan B", der
      // skrev artiklen ud fra videoens titel + beskrivelse via YouTube API.
      // Slået fra (Jacobs beslutning 15/9): sitet lover, at artiklerne bygger
      // på videoens indhold, og en beskrivelse er ikke indhold. Målt 15/9:
      // kørsel #522 udgav en artikel fra en beskrivelse alene.
      console.log(`⏭️ Sprunget over: ingen undertekster for ${videoId} (${transcriptError.message}). Ingen Plan B.`);
      return;
    }

    // Deterministisk skrift-tjek FØR modellen spørges: er transskriptet
    // overvejende ikke-latinsk (devanagari, kinesisk, arabisk, kyrillisk...),
    // er videoen ikke engelsk — uanset hvad metadata påstår. Målt 24/8: en
    // hindi-video mærket "en-IN" af uploaderen passerede alle tekstkontroller,
    // fordi Gemini gladeligt skrev en engelsk artikel ud fra hindi-input.
    // Alfabeter kan ikke narres; modeller kan.
    const bogstaver = text.match(/\p{L}/gu) || [];
    const latinske = text.match(/[A-Za-z\u00C0-\u024F]/g) || [];
    if (bogstaver.length > 100 && latinske.length / bogstaver.length < 0.7) {
      console.log(`Sprunget over: transskriptet er overvejende ikke-latinsk skrift (${Math.round(latinske.length / bogstaver.length * 100)}% latinsk) (${videoId})`);
      return;
    }

    // Sprogtjek: kasser videoen FØR den dyre artikel-prompt, hvis den ikke er på engelsk.
    // Kun det TALTE indhold vurderes — titlen genereres forfra alligevel, og
    // kravet om engelsk titel kasserede engelske videoer fra internationale
    // kanaler med lokalsprogede titler (målt 23/8: 4 gode kandidater i træk).
    const langCheckPrompt = [
      "Answer with only one word: YES or NO. Is the spoken content of this video primarily in English?",
      `Content: ${text.substring(0, 1500)}`
    ].join('\n');

    const langResult = await hentModel(genAI, { model: GEMINI_MODEL }).generateContent(langCheckPrompt);
    const langAnswer = langResult.response.text().trim();
    console.log("Sprogtjek-svar:", langAnswer);

    const cleanedLangAnswer = langAnswer.replace(/[*.]/g, '').trim();

    if (cleanedLangAnswer.toUpperCase() !== "YES") {
      console.log(`Sprunget over: video er ikke på engelsk (${videoId})`);
      return;
    }

    // Kvalitets-bund: normale artikler kræver en vis mængde kilde-tekst, så tynde videoer ikke
    // bliver til tynde artikler. Beskytter mod "low value content" hos Google/AdSense.
    // Relevans-tjek FØR den dyre artikel-prompt. Målt 11/9-2026: robotten søgte
    // "augmented reality darts", fik en 1t23m video om noget helt andet, og
    // modellen skrev så en generel artikel om emnet med én irrelevant
    // kildehenvisning klistret på ("As kwolinsky details, modded versions of
    // Jurassic World Alive..."). Konkrethedsværnet kan ikke redde en artikel,
    // hvis kilden ikke handler om emnet — så kilden skal passe, ellers ingen
    // artikel. Robotten prøver næste kandidat.
    //
    // Uden søgespørgsmål (autocomplete gav intet ubrugt) tjekkes mod emnet i
    // stedet — målt 12/9: AI Glasses-artiklen slap uden om tjekket, fordi den
    // kun kørte med et spørgsmål.
    const relevansEmne = targetQuestion || (forcedTag ? `the topic "${forcedTag}"` : '');
    if (!isShort && relevansEmne) {
      // Selve tjekket ligger i src/lib/relevans.mjs (delt med audit-relevans.mjs).
      const rel = await erRelevant(genAI, text, targetQuestion || relevansEmne, { erSpoergsmaal: Boolean(targetQuestion) });
      console.log('Relevans-svar:', rel.svar);
      if (!rel.ja) {
        console.log(`Sprunget over: kilden handler ikke om ${targetQuestion ? `"${targetQuestion}"` : relevansEmne} (${videoId})`);
        return;
      }
    }

    // Reklameværn (7/10, src/lib/reklame.mjs): en salgsvideo for afsenderens egen
    // vare giver en artikel, der ligner betalt omtale (prøve #7: et vikarbureaus
    // priser og "brug et bureau"). Kører også ved --faktaark-only, så en salgsvideo
    // får karakter 0 i rangeringen og aldrig bliver valgt.
    if (!isShort) {
      const rek = await erReklame(genAI, text, { titel: videoTitel, kanal: channelTitle || '', beskrivelse: videoBeskrivelse });
      console.log('Reklame-svar:', rek.svar);
      if (rek.reklame) {
        console.log(`Sprunget over: kilden er en salgsvideo for afsenderens egen vare/tjeneste (${videoId})`);
        return;
      }
    }

    // TRIN 1 — faktaark (src/lib/faktaark.mjs). Et billigt kald, der KUN
    // skriver kildens tal, navne, eksempler og citater ned, ordret. Er arket
    // for tyndt, er kilden det også — og vi stopper her, før artikel-prompten.
    // Det erstatter modellens egen undskyldning "kilden har ingen tal" med et
    // faktisk tjek. Arket genbruges fra fil, hvis --faktaark-only allerede
    // har lavet det i samme kørsel (auto-youtube.mjs sammenligner kandidater).
    let fakta = [];
    if (!isShort) {
      if (fs.existsSync(faktaarkFil(videoId))) {
        try { fakta = JSON.parse(fs.readFileSync(faktaarkFil(videoId), 'utf8')); console.log(`Faktaark: læst fra fil (${fakta.length} punkter)`); } catch { fakta = []; }
      }
      if (!fakta.length) {
        const fk = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0 } })
          .generateContent(faktaarkPrompt(text, targetQuestion || forcedTag || ''));
        fakta = parseFaktaark(fk.response.text());
        fs.writeFileSync(faktaarkFil(videoId), JSON.stringify(fakta, null, 1), 'utf8');
      }
      const score = faktaarkScore(fakta);
      const fordeling = ['tal', 'navn', 'eksempel', 'citat'].map((t) => `${t} ${fakta.filter((f) => f.type === t).length}`).join(', ');
      console.log(`Faktaark: ${fakta.length} punkter (${fordeling}) — score ${score}`);
      // Linjen læses maskinelt af auto-youtube.mjs. Ændr ikke formatet.
      console.log(`FAKTAARK-SCORE: ${score}`);
      if (score < MIN_FAKTA) {
        console.log(`Sprunget over: kilden er for tynd — ${score} konkrete punkter, mindst ${MIN_FAKTA} kræves (${videoId})`);
        return;
      }
      if (faktaarkOnly) {
        console.log('Faktaark gemt — artiklen skrives ikke (--faktaark-only).');
        return;
      }
    }

    const MIN_SOURCE_CHARS = 400;
    if (!isShort && text.trim().length < MIN_SOURCE_CHARS) {
      console.log(`Sprunget over: kilde for tynd (${text.trim().length} tegn) for ${videoId}`);
      return;
    }

    // Vælg artikel-profil deterministisk ud fra video-ID, så artiklerne varierer i struktur og længde. Kun normale artikler bruger den.
    const profileHash = hashString(videoId || '');
    const articleProfile = ARTICLE_PROFILES[profileHash % ARTICLE_PROFILES.length];
    const targetWords = articleProfile.min + (Math.floor(profileHash / ARTICLE_PROFILES.length) % (articleProfile.max - articleProfile.min + 1));
    if (!isShort) console.log(`Artikel-profil: ${articleProfile.name} (~${targetWords} ord)`);

    // Outline før tekst + rigtige søgninger til FAQ (12/10, src/lib/artikelplan.mjs). Kører først
    // her, efter kandidatvurderingen, så det kun koster for den video, der faktisk skrives om.
    // Fejler et trin, skrives artiklen som før (plan = null / ingen søgninger).
    let plan = null;
    let rigtigeSoegninger = [];
    let noegle = []; // faktaboks (trin 4), udfyldes efter kildelisten
    if (!isShort) {
      plan = await lavOutline(genAI, {
        spoergsmaal: targetQuestion, delspoergsmaal: soeg.delspoergsmaal,
        faktaTekst: soeg.fakta.map((f) => `- ${f.tekst}`).join('\n').slice(0, 4000),
        kanal: kildeNavn(channelTitle) || 'the creator', videoKort: faktaarkTekst(fakta).slice(0, 1500),
      }, channelTitle);
      if (soeg.emne) {
        try { rigtigeSoegninger = (await hentForslag(soeg.emne)).filter((q) => q !== targetQuestion.toLowerCase()).slice(0, 10); } catch { /* FAQ som før */ }
      }
      console.log(`❓ FAQ: ${rigtigeSoegninger.length} rigtige Google-søgninger om "${soeg.emne || '?'}"`);
    }

    // Jacobs hjerne (trin 5, 21/10): stemme + holdninger ind i skriveprompten, med
    // bremsen i src/lib/hjerne.mjs (holdninger kun ved emnematch, højst ét afsnit).
    const hjerne = laesHjerne();
    // 25/10 (Jacob: "selvfølgelig skal du bruge min hjerne"): uden hjernen skrives INGEN artikel.
    // Før skrev robotten videre uden - tre testartikler blev skrevet uden Jacobs stemme.
    if (!hjerne && !isShort) throw new Error('Hjernen mangler (_hjerne / HJERNE_DIR) - artiklen skrives ikke uden Jacobs stemme. Midlertidig fejl.');
    const hjerneBlok = isShort ? '' : stemmeBlok(hjerne, `${soeg.emne || ''} ${targetQuestion || ''} ${videoTitel || ''}`);
    // hjerneStemme (22/10): hjernen har en holdning til NETOP dette emne, så artiklen må
    // have én kort jeg-passage — bruges af talesprog-kontrollen og rettelses-prompterne,
    // så kontrollen ikke sletter den stemme, skrivereglen bad om (målt 22/10 kl. 06:17).
    const hjerneStemme = hjerneBlok.includes('STATED POSITIONS');
    if (hjerneBlok) console.log(`🧠 Hjernen er med (${hjerneStemme ? 'stil + holdninger til emnet' : 'kun stil'})`);

    // Shorts får kun en let metadata-prompt (title/tags/summary) - ingen dyr artikel- eller FAQ-generering
    const prompt = isShort
      ? `Act as a metadata generator for "TechFeedWatch", a tech news site.
    Analyze this Short's content (transcript or title/description) and return EXACTLY in this format:
    TITLE: A concise, engaging headline
    TAGS: Choose 1-2 tags that best fit the video, ONLY from this exact list: ${ALLOWED_TAGS.join(', ')}. Return them comma-separated, e.g. 'SEO, AI Video'. Do not invent new tags.
    SUMMARY: A sharp 1-2 sentence summary of the Short.

    Video Content Data: ${text.substring(0, 5000)}`
      : `You are a senior journalist at TechFeedWatch, a tech news site covering AI, Tech, FinTech, and Crypto for a general audience. Write like a good newspaper explainer: accurate, fair, and so clear that a curious 15-year-old understands every sentence. Someone searching Google typed "${targetQuestion}". This article's job is to answer that search better than the pages that rank for it today. The research is done: the RESEARCH below lists the questions searchers need answered and the facts the best web pages give, each with its source. You have also watched one video on the subject by ${kildeNavn(channelTitle) || 'a creator'}; it is a SUPPLEMENT - one practical illustration, not the backbone of the article.

    THE READER'S QUESTION: "${targetQuestion}". Answer it plainly in the first two sentences. Then build the article from the RESEARCH QUESTIONS, in the order a reader needs them. The headline must reflect the question. A reader who never watches the video must come away with a complete answer.

    Return EXACTLY in this format:
    TITLE: A headline of 40-62 characters that includes the primary keyword/topic the way people search for it. REQUIRED FORM: ${TITLE_FORMS[hashString(videoId + 'titelform') % TITLE_FORMS.length]} Never use an ampersand. Never open with any of these words (recent headlines already do): ${senesteAabningsord().join(', ') || '(none)'}. Be concrete and specific; search clarity comes first. NEVER use vague or poetic openers such as "Understanding", "Beyond", "The Quiet", "The Dawn of", "Rethinking", "Inside", "Unpacking", "Decoding", "Navigating", "Demystifying", "Unlocking", "Exploring", or "The New Frontier" - start with the subject or the question word. Whatever the form, write it like a newspaper headline that tells the searcher plainly what they will learn about their question - never an abstract claim about the subject such as "PC Building Assembles Hardware Through Open Standards".
    TAGS: Choose 1-2 tags that best fit the video, ONLY from this exact list: ${ALLOWED_TAGS.join(', ')}. Return them comma-separated, e.g. 'SEO, AI Video'. Do not invent new tags.
    SUMMARY: A sharp, analytical 3-4 sentence introduction or TL;DR.
    META: A single-line search meta description, MAX 155 characters, written to earn clicks in Google and naturally including the main keyword. It must be correct, natural English: Google searches are often fragments (e.g. "can i ai videos"), so never paste the search words verbatim unless they already form a correct sentence - rephrase them instead (e.g. "Can you make AI videos?"). Plain text, no quotes.
    FAQ:
    Generate exactly 3-4 frequently asked questions a searcher has about "${targetQuestion}", with concise answers based on the RESEARCH (not on details only the video gives). A number in an answer must come from the RESEARCH FACTS and name its source.${rigtigeSoegninger.length >= 3 ? ` Take the questions from these REAL GOOGLE SEARCHES that people type about this topic: pick the 3-4 that the RESEARCH can answer and that the article's headings do not already answer; fix their grammar but keep their meaning and words: ${rigtigeSoegninger.map((q) => `"${q}"`).join(', ')}.` : ''} Format each strictly as:
    Q: [question]
    A: [answer]
    Each answer max 2 sentences. Do not use markdown links in the answers.
    CONTENT:
    Write the article following these STRICT RULES:
    1. Objectivity is mandatory - do not hype any product or technology.
    2. No author bio, greetings, sign-offs, or affiliate disclaimers.
    3. Do NOT start with an H1 or the video title (the page already shows the title). Start directly with 2-3 sentences that answer the reader's question, no label.
    4. Avoid commodity/listicle filler unless backed by real analysis.
    5. BANNED WORDS - never use: delve, tapestry, realm, navigate, landscape, testament, crucial, robust, demystify, unlock, unleash, elevate, seamless, paradigm shift, "in today's digital age", firstly, moreover, furthermore, "in conclusion".
    6. Write with high burstiness: mix short punchy sentences with longer analytical ones. Active voice only.
    7. Aim for approximately ${targetWords} words.
    8. Never use filler like "in this video" or "the video discusses", and never write "the source material", "the transcript" or "the source" - the reader does not know there is one. Write as an independent editorial piece. The exception is the video section (rule 14), where the creator is named.
    8b. The transcript is machine-generated speech-to-text: a name may be misheard. A fact-sheet item marked "(spelling uncertain)" must NOT be used as a name - describe the thing generically instead ("a Nigerian savings app").
    9. Ensure internal links are written strictly like this: [Link text](/video/slug). Never use code formatting (backticks) anywhere - this is an article, not documentation.
    10. THE SEARCH IS THE ARTICLE, NOT THE VIDEO. Build the article from the RESEARCH QUESTIONS and RESEARCH FACTS. The video is one input among several and gets one section of its own (rule 14). A reader who never watches it must get a complete, self-contained answer.
    11. Most of the article must be explanation the reader needs: what the thing is, why it works that way, what it means in practice, what the trade-offs are, and what commonly goes wrong. For general context use only well-established facts. NEVER fabricate statistics, quotes, dates, company figures or events - every number must come from the RESEARCH FACTS or the VIDEO FACT SHEET, written exactly as given (no rounding, no converting); names may also be common knowledge. EVERY SENTENCE WITH A NUMBER NAMES WHERE THE NUMBER COMES FROM, in the sentence itself - the publisher from the research (for example "IBM's 2024 report puts the average cost at USD 4.88 million", "According to Verizon, ...") or, in the video section, the creator.
    12. Use the research facts and the video in your own words and structure. Do not copy their wording, do not follow the video's running order, and do not quote long passages.
    13. Weave the core topic and its key concepts/keywords naturally into the headline, the H2 headings, and the body so the piece ranks for what readers actually search - but never keyword-stuff or repeat awkwardly.
    14. THE VIDEO IS A SUPPLEMENT. Give it exactly ONE "## " section of its own, placed after the sections that answer the main question - never first. Its heading names the creator "${kildeNavn(channelTitle) || 'the creator'}" and says specifically what the video shows or tests (not a generic "What X Shows"). In that section use at least ${MIN_VIDEO_DETALJER} concrete items from the VIDEO FACT SHEET (a number, a named product, an example). The section is at most ${Math.round(VIDEO_ANDEL_MAAL * 100)} % of the article. Outside it, do not use details that only the video gives. A scenario the creator uses to illustrate a point (invented people, companies or stories) may only appear in the video section and must be described as the creator's example, never as fact. If the video covers a niche (one profession, one product, one country), present it as an example of the general answer, not as the answer.
    15. LISTS: include at least TWO markdown lists (lines starting with "- " or "1. "), each with 3-5 items, where the content is naturally a list: steps, options, components, criteria, pros and cons. Keep the argument itself in paragraphs.
    16. SHORT PARAGRAPHS: at most 3 sentences per paragraph. Readers are on phones. ANSWER FIRST: the first sentence under every "## " heading answers that heading directly in at most 40 words (a question heading gets its answer, a statement heading gets its core point); details, examples and sources come after it.
    17. STAY ON THE QUESTION: every section must help answer the reader's question. Do not spend paragraphs on other products, features or tools the video happens to mention unless you compare them directly with the subject. Never describe how a product works internally (models, physics, pipelines) unless the RESEARCH FACTS or the VIDEO FACT SHEET say so. Never promote or praise a product, vendor, course, guide or download, and never refer to a resource the article does not contain (no "grab the checklist").
    18. WRITE AS AN EDITOR, NOT A SPEAKER: no first person (I, me, my, we), no spoken phrases from the transcript ("let's take a look", "gonna", "as you can see"). If the creator's own words matter, quote them in quotation marks.
    19. NAMED SOURCES ONLY: never write "experts say", "studies show", "research indicates", "critics argue" or "according to reports" without naming who. If the source does not name them, state the point plainly or leave it out.
    20. Never draw diagrams with characters (arrows, boxes, ASCII art). Use a markdown table or a numbered list instead.
    21. Never paste the reader's search words into a sentence where they are not grammatical (for example "Understanding what is X ..."). Rephrase.
    22. Do not write a sources or references section - it is added automatically.
    23. If the reader's question assumes something (that X is better than Y, that Z is safe, that W is dead), never state that assumption as settled fact. Show where it holds and where it does not, using the RESEARCH FACTS on both sides, and end with a fair, evidence-based verdict. No sweeping judgments ("clear superiority", "always", "the best") without evidence in the same sentence. Fair does NOT mean hedged: state a limitation as its own plain sentence with its source, never as a qualifying clause tacked onto another sentence.
    24. WRITE LIKE A PERSON, NOT A MODEL: say each point once, plainly. Never use these machine patterns: "not just X, but Y" / "isn't just X; it's Y", "it is worth noting" / "it is important to note", "plays a key/pivotal/vital role", opening a sentence with "Ultimately," "At its core," "In essence," or "In short,", clichés like "game-changer", "double-edged sword", "ever-evolving", and hedges like "does not invariably" or "though ... not always". Take a clear position where the evidence supports one.
    25. PLAIN LANGUAGE (reading level of a 15-year-old, US grade ${KLASSETRIN_MAAL}-10): sentences of 12-16 words on average, none over 25 words; everyday words; explain every technical term in a few plain words the first time it appears (for example "latency (the delay before data arrives)"). Keep the term itself - readers search for it.
    26. A JOURNALIST CHECKS BEFORE WRITING: every fact says who says it. Attribute a figure to a publisher ONLY if that figure comes from that publisher's page in the RESEARCH (its [S#] tag); never move a figure from one source to another. A claim from the video is the creator's claim ("${kildeNavn(channelTitle) || 'The creator'} says ...") - never state it as fact unless the RESEARCH FACTS confirm it. Never write a date, month, duration, size, weight, price, count or speed that is not in the RESEARCH FACTS or the VIDEO FACT SHEET - this includes written-out numbers ("a minute", "ten seconds", "two hours", "single-nanosecond") and a month or year for an event the sources do not date. Never name a study's authors or journal unless the RESEARCH gives them.
    27. WHY IT MATTERS: include one short passage that tells the reader what this means for them in practice.
    28. LIMITS: where the RESEARCH FACTS state a limit, a risk or a disagreement, say so plainly in its own sentence and name its source. Never invent an uncertainty, and never claim that a source says something is unknown.
    ${hjerneBlok}

    STRUCTURE (built from the search, not from the video):
    - Opening: 2-3 sentences that answer "${targetQuestion}" directly (no heading, no label).
    ${plan ? strukturTekst(plan) : `- One "## " section for each RESEARCH QUESTION the opening does not already answer fully, in the order a reader needs them. Each heading is specific to this subject: phrase it as the question a reader would ask, or as its answer. Never a template heading like "How It Works", "What It Is", "Who It's For", "Key Takeaways" or "The Bottom Line".
    - The video section (rule 14), after the sections that answer the main question.
    - Optionally a short closing "## " section with practical guidance, under a heading specific to this subject.`}
    Voice: write it as a ${articleProfile.name.toLowerCase()} piece.
    ${internalLinksContext}

    RESEARCH (from Google, done before writing - the backbone of the article):
    ${soegningTekst(soeg)}

    VIDEO FACT SHEET (every concrete detail the video by ${kildeNavn(channelTitle) || 'the creator'} gives - for the video section, rule 14):
    ${faktaarkTekst(fakta)}

    VIDEO TRANSCRIPT (context for the video section only - do not follow its order or retell it):
    ${text.substring(0, 12000)}`;
    // Transskriptet er kortet fra 20.000 til 12.000 tegn (12/10): videoen er et supplement nu.

    // maxOutputTokens sat eksplicit. Uden den bruger modellen sin standard, og
    // gemini-2.5 bruger også af output-budgettet på at tænke. Prompten beder om
    // TITLE, TAGS, SUMMARY, META, FAQ og til sidst CONTENT — så når budgettet
    // slipper op, er brødteksten præcis dét der mangler, mens alt andet står
    // der. 25 artikler blev udgivet som tomme skaller på den måde, og andelen
    // voksede til tre ud af fire.
    // Svaret skal have en TITLE-linje og slutte af sig selv (STOP). Mangler
    // det, er det tilfældigt (målt 12/9: samme prompt gav svar i 2. forsøg),
    // så vi prøver én gang til, før kandidaten kasseres.
    // B (16/10): mærke til auto-youtube — "nu begynder den dyre skrivning". Bliver artiklen
    // alligevel kasseret, prøver robotten ikke flere kandidater i samme kørsel.
    try { fs.mkdirSync('.cache', { recursive: true }); fs.writeFileSync('.cache/skrive-forsoeg', String(videoId || '')); } catch { /* kun et mærke */ }
    let rawText = '';
    for (let forsoeg = 0; forsoeg < 2; forsoeg++) {
      const result = await hentModel(genAI, {
        model: GEMINI_MODEL,
        // 32768 (17/10): tænkningen brugte 15.119 af 16.384, så svaret blev klippet og skulle laves om.
        generationConfig: { maxOutputTokens: 32768 },
      }).generateContent(prompt);

      // Blev svaret klippet af? Modellen siger det selv. Uden dette tjek ser et
      // afklippet svar ud som et gyldigt svar med et manglende afsnit.
      const finish = result.response?.candidates?.[0]?.finishReason;
      if (finish && finish !== 'STOP') {
        if (forsoeg === 0) { console.log(`⚠️ Gemini stoppede med "${finish}" — prøver én gang til`); continue; }
        throw new Error(`Gemini stoppede med "${finish}" — svaret er ufuldstændigt, artiklen skrives ikke.`);
      }
      rawText = result.response.text() || '';
      if (/TITLE:\s*\S/i.test(rawText)) break;
      if (forsoeg === 0) console.log('⚠️ Svaret mangler TITLE-linjen — prøver én gang til');
    }

    const titleMatch = rawText.match(/TITLE:\s*(.*)/i);
    const tagsMatch = rawText.match(/TAGS:\s*(.*)/i);
    const summaryMatch = rawText.match(/SUMMARY:\s*([\s\S]*?)(?=META:|FAQ:|CONTENT:|$)/i);
    const metaMatch = rawText.match(/META:\s*(.*)/i);

    // Ingen TITLE i svaret = artiklen afvises. Fallback'en "New Video" udgav
    // 24/8 en artikel med maskinnavn som både titel og URL — præcis det
    // aftryk hele titel-arbejdet fjerner. Hellere ingen artikel end den.
    if (!titleMatch || !titleMatch[1].trim()) {
      console.log(`❌ Fejl: Svaret mangler TITLE-linjen — artiklen skrives ikke. (${videoId})`);
      return;
    }
    let safeTitle = titleMatch[1].replace(/"/g, "'").replace(/\n/g, " ").trim();
    // Efterbehandling af titlen: publikations-casing (småord i småt) og
    // og-tegn ud — de to ting Gemini oftest overhører i instruksen.
    safeTitle = pubCase(safeTitle.replace(/\s*&\s*/g, ' and '));
    // Søgeords-værnet (manglendeKerneord i src/lib/headline.mjs): mangler kerneord fra
    // spørgsmålet i overskriften, bedes Gemini rette KUN det — to forsøg —
    // ellers bliver spørgsmålet selv til overskrift. Artiklen afvises ikke:
    // teksten er i orden, det er kun skiltet udenpå der skal passe.
    if (targetQuestion) {
      let mangler = manglendeKerneord(safeTitle, targetQuestion);
      for (let forsoeg = 0; mangler.length && forsoeg < 2; forsoeg++) {
        console.log(`🔎 Overskriften mangler søgeordene [${mangler.join(', ')}] — beder om rettelse (${forsoeg + 1}/2)`);
        try {
          const rep = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0.3 } })
            .generateContent(`Rewrite this headline so that it reads the way people search for it. It must contain the words "${mangler.join('", "')}" in the same order as in the Google search "${targetQuestion}" (other words may sit between them), keep the same meaning, be natural English, and stay 40-62 characters. Title Case. No ampersand. No quotes. Output the headline only.\n\nHeadline: ${safeTitle}`);
          const ny = (rep.response.text() || '').split('\n')[0].replace(/^["“']|["”']$/g, '').replace(/"/g, "'").trim();
          if (ny.length >= 20 && ny.length <= 80) safeTitle = pubCase(ny.replace(/\s*&\s*/g, ' and '));
        } catch (e) { console.log(`   rettelse fejlede: ${e.message}`); }
        mangler = manglendeKerneord(safeTitle, targetQuestion);
      }
      if (mangler.length) {
        safeTitle = overskriftAfSpoergsmaal(targetQuestion);
        console.log(`🔎 Bruger spørgsmålet som overskrift: "${safeTitle}"`);
      } else {
        console.log(`🔎 Overskriften indeholder søgeordene: "${safeTitle}"`);
      }
    }

    // Længdeværn. Prompten beder om 40-62 tegn, men en instruks er ikke en
    // spærring: målt 20/9 stod 3 titler på 71-76 tegn, og alle tre kom fra
    // spørgsmåls-fallbacken ovenfor, som kopierer søgespørgsmålet råt.
    // Google klipper titlen omkring 60 tegn, så resten er spildt plads.
    // Vi beder om én forkortelse og accepterer kun et svar, der stadig
    // indeholder søgeordene — kortere er godt, men ikke på bekostning af dem.
    if (safeTitle.length > 65) {
      console.log(`✂️  Overskriften er ${safeTitle.length} tegn — beder om en kortere`);
      try {
        const rep = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 256, temperature: 0.3 } })
          .generateContent(`Shorten this headline to at most 62 characters. Keep the same meaning and keep the words a searcher would type. Natural English, Title Case, no ampersand, no quotes. If it is a question, it stays a question. Output the headline only.\n\nHeadline: ${safeTitle}`);
        const ny = pubCase((rep.response.text() || '').split('\n')[0].replace(/^["“']|["”']$/g, '').replace(/"/g, "'").replace(/\s*&\s*/g, ' and ').trim());
        const beholderOrd = !targetQuestion || manglendeKerneord(ny, targetQuestion).length === 0;
        if (ny.length >= 25 && ny.length <= 65 && beholderOrd) {
          console.log(`✂️  ${safeTitle.length} → ${ny.length} tegn: "${ny}"`);
          safeTitle = ny;
        } else {
          console.log(`✂️  Forkortelsen blev ikke brugt (${ny.length} tegn, søgeord bevaret: ${beholderOrd}) — beholder den lange.`);
        }
      } catch (e) { console.log(`   forkortelse fejlede: ${e.message}`); }
    }

    const baseSlug = slugify(safeTitle) || videoId.toLowerCase();
    const slug = erstatSlug || resolveUniqueSlug(baseSlug, videoId);
    const rawTagsList = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
    const safeTags = rawTagsList.filter(t => ALLOWED_TAGS.includes(t));

    // Søgeemnet står forrest og kan ikke overskrives. Gemini må bidrage med ét
    // ekstra mærke, så en fintech-artikel om AI stadig kan findes begge steder —
    // men den tæller som fintech, fordi det var dét robotten ledte efter.
    const finalTags = forcedTag
      ? [forcedTag, ...safeTags.filter(t => t !== forcedTag)].slice(0, 2)
      : (safeTags.length > 0 ? safeTags : ["AI & Tech"]);
    let safeSummary = fjernForbudteOrd((summaryMatch ? summaryMatch[1] : "").replace(/"/g, "'").replace(/\n/g, " ").trim());
    // Kort meta-beskrivelse til Google (~155 tegn). Falder tilbage til trunkeret summary hvis META mangler.
    // Prompten kræver korrekt engelsk: 24/9 satte robotten autocomplete-brokken "can i ai videos"
    // ind ordret ("Wondering can I AI videos?"). Googles forslag er ofte brokker, ikke sætninger.
    let safeMeta = fjernForbudteOrd((metaMatch ? metaMatch[1] : "").replace(/"/g, "'").replace(/\n/g, " ").trim());
    if (!safeMeta) safeMeta = safeSummary;
    // For lang META blev før klippet midt i sætningen med "…" — 45 artikler
    // stod sådan i Google. Nu beholdes kun hele sætninger; er første sætning
    // alene for lang, klippes ved sidste komma/bindeord og der sættes punktum.
    if (safeMeta.length > 155) {
      const dele = safeMeta.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      let kort = '';
      for (const d of dele) { if ((kort + ' ' + d).trim().length > 155) break; kort = (kort + ' ' + d).trim(); }
      if (kort.length < 60) {
        const s154 = safeMeta.slice(0, 154);
        const i = Math.max(s154.lastIndexOf(', '), s154.lastIndexOf(' and '), s154.lastIndexOf(' while '), s154.lastIndexOf(' with '));
        kort = (i > 60 ? s154.slice(0, i) : s154.replace(/\s+\S*$/, '')).replace(/[,;:\s]+$/, '') + '.';
      }
      safeMeta = kort;
    }

    // Klistret søgeord i META og SUMMARY (fase 2, 7/10): prøve #3 fik META'en
    // "Wondering what is virtual reality therapy? ..." — samme fejl, som tjekket
    // fanger i brødteksten, men her uden for den. Gemini får ét forsøg på at
    // omformulere feltet; holder det ikke, bruges en reserve uden søgeordet.
    async function udenKlistret(felt, tekst, maks) {
      if (!targetQuestion || !tekst || !klistretSoegeord(tekst, targetQuestion).length) return tekst;
      try {
        const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 2048, temperature: 0.2 } })
          .generateContent(`Rewrite this ${felt} in correct, natural English. The search words "${targetQuestion}" are pasted in ungrammatically - rephrase them (for example "What is X?" as its own question, or "X is ..."). Keep the meaning${maks ? ` and stay under ${maks} characters` : ''}. Plain text only, no quotes.\n\n${tekst}`);
        const ny = fjernForbudteOrd((r.response.text() || '').replace(/"/g, "'").replace(/\n/g, ' ').trim());
        if (ny && (!maks || ny.length <= maks) && ny.length >= 40 && !klistretSoegeord(ny, targetQuestion).length) {
          console.log(`🔧 ${felt}: søgeord ikke længere klistret ind`);
          return ny;
        }
      } catch (e) { console.log(`🔧 ${felt}: omformulering fejlede (${e.message.split('\n')[0]})`); }
      console.log(`🔧 ${felt}: omformulering holdt ikke — reserve bruges`);
      return null;
    }
    if (!isShort) {
      const nyMeta = await udenKlistret('meta description', safeMeta, 155);
      // Reserve for META: resuméets første hele sætning(er) under 155 tegn.
      if (nyMeta === null) {
        const dele = safeSummary.split(/(?<=[.!?])\s+(?=[A-Z0-9])/); let kort = '';
        for (const d of dele) { if ((kort + ' ' + d).trim().length > 155) break; kort = (kort + ' ' + d).trim(); }
        safeMeta = kort || safeMeta;
      } else safeMeta = nyMeta;
      const nySummary = await udenKlistret('summary', safeSummary, 0);
      if (nySummary !== null) safeSummary = nySummary;
    }

    // Saniter FAQ-tekst: fjern anførselstegn, klip markdown-links til bare teksten, trim
    function sanitizeFaqText(str) {
      return str
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/"/g, "'")
        .replace(/\n/g, ' ')
        .trim();
    }

    // Deler modellens svar i FAQ-blok og brødtekst.
    //
    // Markøren "CONTENT:" accepteres også som egen linje med fed/uden kolon
    // ("**CONTENT**"). Men målt 14/9 på 16 af 62 arkiv-artikler: modellen
    // skriver hele artiklen (overskrifter, afsnit, det hele) og udelader BARE
    // ordet CONTENT — brødteksten begynder direkte efter det sidste FAQ-svar.
    // Uden en reserve blev 16 færdige artikler kasseret som "0 ord".
    // Reserven: mangler markøren, er brødteksten alt efter den sidste "A:"-linje
    // i FAQ-blokken, og FAQ-blokken slutter samme sted (ellers ville det sidste
    // svar sluge hele artiklen). Kræver mindst ét Q/A-par for at slå til.
    function delSvar(raw) {
      let contentMatch = raw.match(/^[ \t]*\**CONTENT\**:?\**[ \t]*\r?\n([\s\S]*)/im) || raw.match(/CONTENT:\s*([\s\S]*)/i);
      // FAQ-blokken løber fra "FAQ:" til markøren (hvis den findes) — ellers til slut.
      const faqStart = raw.search(/FAQ:/i);
      let faqBlock = faqStart < 0 ? '' : raw.slice(faqStart + 4, contentMatch ? contentMatch.index : raw.length);
      if (!contentMatch) {
        const linjer = faqBlock.split(/\r?\n/);
        let sidsteA = -1;
        for (let i = 0; i < linjer.length; i++) if (/^\s*\**A\**:/.test(linjer[i])) sidsteA = i;
        if (sidsteA >= 0) {
          // Modellen sætter af og til en vandret streg (*** eller ---) som skille — væk med den.
          const rest = linjer.slice(sidsteA + 1).join('\n').trim().replace(/^(\*{3,}|-{3,})\s*/, '');
          if (rest.split(/\s+/).length >= 200) {
            contentMatch = [null, rest];
            faqBlock = linjer.slice(0, sidsteA + 1).join('\n');
            console.log('ℹ️ CONTENT-markøren mangler — brødteksten taget efter sidste FAQ-svar');
          }
        }
      }
      // Variant 2 (målt 15/9): FAQ'en står SIDST i svaret, og brødteksten ligger
      // før den — lige efter META-linjen. Så tages det, der står mellem META og FAQ.
      if (!contentMatch && faqStart > 0) {
        const metaM = raw.match(/^[ \t]*\**META\**:?\**[^\n]*\n/im);
        const fra = metaM ? metaM.index + metaM[0].length : -1;
        if (fra > 0 && fra < faqStart) {
          const foer = raw.slice(fra, faqStart).replace(/\**\s*$/, '').trim().replace(/^(\*{3,}|-{3,})\s*/, '');
          if (foer.split(/\s+/).length >= 200) {
            contentMatch = [null, foer];
            console.log('ℹ️ CONTENT-markøren mangler — brødteksten taget mellem META og FAQ');
          }
        }
      }
      // Variant 3 (målt 15/9): hele artiklen står FØRST, og felterne (TITLE, TAGS,
      // SUMMARY, META, FAQ) kommer til sidst. Så tages alt før det første felt.
      // Første linje er tit overskriften som ren tekst — den droppes, hvis den er
      // kort og uden punktum, så den ikke bliver et afsnit under den rigtige titel.
      if (!contentMatch) {
        const foerste = raw.search(/^[ \t]*\**(TITLE|TAGS|SUMMARY|META|FAQ)\**:/im);
        if (foerste > 0) {
          let foer = raw.slice(0, foerste).trim();
          const linjer = foer.split(/\r?\n/);
          if (linjer.length > 2 && linjer[0].length < 110 && !/[.!?]$/.test(linjer[0].trim()) && !/^#/.test(linjer[0])) foer = linjer.slice(1).join('\n').trim();
          if (foer.split(/\s+/).length >= 200) {
            contentMatch = [null, foer];
            console.log('ℹ️ CONTENT-markøren mangler — brødteksten taget før første felt');
          }
        }
      }
      return { faqBlock, contentMatch };
    }

    // YAML-escape til dobbelt-anførte strenge (håndterer backslash og resterende anførselstegn)
    function toYamlDoubleQuoted(str) {
      return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    // Shorts får hverken FAQ eller brødtekst
    const faqs = [];
    let content = "";

    if (!isShort) {
      const { faqBlock, contentMatch } = delSvar(rawText);
      const faqPairRegex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
      let faqPairMatch;
      while ((faqPairMatch = faqPairRegex.exec(faqBlock)) !== null) {
        const question = sanitizeFaqText(faqPairMatch[1]);
        const answer = sanitizeFaqText(faqPairMatch[2]);
        if (question && answer) {
          faqs.push({ question, answer });
        }
      }

      content = contentMatch ? contentMatch[1].trim() : "";
      content = content.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();
      content = sanitizeLinks(content);

      // Skriv ALDRIG en artikel uden brødtekst — og tjek det FØR kontrollen
      // mod faktaarket, så en tom tekst ikke sendes til rettelse (målt 12/9).
      //
      // Det her var hele fejlen: manglede CONTENT: i svaret, blev content til
      // en tom streng, og filen blev skrevet alligevel — med titel, resumé,
      // FAQ og video, men ingen artikel. 25 sider blev udgivet sådan uden at
      // noget sagde fra, og et site med tomme sider er præcis hvad en
      // AdSense-gennemgang falder over.
      //
      // Bedre at dagens artikel mangler end at den er tom: robotten kører hver
      // anden time og prøver igen med en anden video.
      let ordITekst = content ? content.split(/\s+/).length : 0;
      if (ordITekst < 200) {
        // Svaret gemmes til fejlsøgning (git ignorerer _*.txt) — ellers ved vi
        // kun AT markøren manglede, ikke hvordan svaret så ud.
        try { fs.writeFileSync(`./_raw-${videoId}.txt`, rawText, 'utf8'); } catch { /* ligegyldigt */ }
        // Målt 12/9: samme prompt gav CONTENT i 2. forsøg, efter at 1. svar
        // (14.500 tegn) manglede markøren. Fejlen er tilfældig, så ét forsøg
        // mere er billigere end at kassere en god kandidat.
        console.log(`⚠️ Brødteksten mangler (${ordITekst} ord) — prøver én gang til`);
        const igen = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 32768 } }).generateContent(prompt);
        const rawIgen = igen.response.text() || '';
        const { faqBlock: fm2, contentMatch: cmIgen } = delSvar(rawIgen);
        const nyContent = sanitizeLinks((cmIgen ? cmIgen[1] : '').replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim());
        if (nyContent.split(/\s+/).length >= 200) {
          content = nyContent;
          ordITekst = content.split(/\s+/).length;
          if (!faqs.length) {
            let p; const re2 = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
            while ((p = re2.exec(fm2)) !== null) { const q = sanitizeFaqText(p[1]), a = sanitizeFaqText(p[2]); if (q && a) faqs.push({ question: q, answer: a }); }
          }
        }
      }
      if (ordITekst < 200) {
        throw new Error(
          `Brødteksten er ${ordITekst} ord — under grænsen på 200. Artiklen skrives ikke. ` +
          `(Svaret var ${rawText.length} tegn; CONTENT: ${contentMatch ? 'fundet' : 'MANGLER'}.)`
        );
      }

      // TRIN 3 — kontrol mod faktaarket (12/9): tre ting måles deterministisk.
      //  a) brugte: hvor mange punkter fra arket kan genfindes i artiklen (mindst MIN_BRUGT)
      //  b) ukendte: tal i artiklen, som hverken står i arket eller transskriptet (skal være 0)
      //  c) kilden nævnt ved navn (som før)
      // Mangler noget, får modellen ÉT forsøg med arket ved hånden — ikke hele
      // transskriptet, for det var dét, der i første omgang druknede detaljerne.
      // Udvidet 15/9 (Jacobs forslag 5, 8, 9, 10):
      //  d) tal: har kilden mindst 2 tal på arket, skal artiklen have mindst 2 (håndhæves)
      //  e) score: konkrethedsscore (samme formel som audit-specificity) >= MIN_SCORE (håndhæves)
      //  f) svaret først: første afsnit deler et kerneord med spørgsmålet og er
      //     et rigtigt afsnit (mindst 40 ord), ikke en optakt (rettes, logges).
      //     Målt 15/9: krav om et tal i 1. afsnit bestod kun 10 af 227 — for strengt.
      //  g) læsbarhed: højst MAX_ORD_PR_SAETNING ord pr. sætning i snit (rettes, logges)
      // Kun tal med betydning tæller (samme målestok som taelTal på artiklen).
      // Målt 16/9: arket kaldte "two seconds" og "three different videos" for tal,
      // artiklen fik 0 efter den strenge regel — og blev afvist på et falsk krav.
      const kildensTal = fakta.filter((f) => f.type === 'tal' && taelTal(`${f.key} ${f.text}`) > 0).length;
      // Søgningens fakta tæller med (12/10): tallene skal nu helst komme derfra.
      const soegFaktaTekst = soeg.fakta.map((f) => f.tekst).join('\n');
      const soegTal = soeg.fakta.filter((f) => taelTal(f.tekst) > 0).length;
      const MIN_TAL = kildensTal + soegTal >= 2 ? 2 : 0;
      const foersteAfsnit = (md) => (md.split(/\n\s*\n/).map((x) => x.trim()).find((x) => x && !/^#/.test(x) && !/^[-*>]/.test(x)) || '');
      const spmUdenAi = (targetQuestion || '').replace(/\b(ai|tech)\b/gi, ' ').trim();
      const svarFoerstOk = (md) => {
        if (!spmUdenAi || !/[a-z]{3,}/i.test(spmUdenAi)) return true;
        const fa = foersteAfsnit(md);
        return faellesOrd(spmUdenAi, fa) > 0 && fa.split(/\s+/).length >= 40;
      };
      const status = () => {
        const brugte = brugteFakta(content, fakta);
        // Et tal er dækket, når det står i videoen ELLER i søgningens fakta (12/10).
        const ukendte = ukendteTal(content, fakta, text + '\n' + soegFaktaTekst);
        // Søgning først (12/10): videoens andel, dens ene afsnit, tal uden navngiven kilde, brugte websider.
        const va = videoAndel(content, channelTitle, fakta, soegFaktaTekst);
        const vAfsnit = videoAfsnit(content, channelTitle);
        const udenKilde = talUdenKilde(content, soeg.navne, channelTitle);
        const kilderBrugt = brugteKilder(content, soeg);
        const tal = taelTal(content);
        const sc = konkretScore(content, channelTitle);
        const laes = laesbarhed(content);
        const svarFoerst = svarFoerstOk(content);
        const m = [];
        if (brugte.length < MIN_VIDEO_DETALJER) m.push(`kun ${brugte.length} af ${fakta.length} punkter fra videoens ark brugt (mindst ${MIN_VIDEO_DETALJER})`);
        if (vAfsnit.length !== 1) m.push(`${vAfsnit.length} videoafsnit (præcis 1, med kanalens navn i overskriften)`);
        if (va.andel > VIDEO_ANDEL_MAKS) m.push(`video-andel ${Math.round(va.andel * 100)} % (højst ${Math.round(VIDEO_ANDEL_MAKS * 100)} %)`);
        if (udenKilde.length) m.push(`${udenKilde.length} sætning(er) med tal uden navngiven kilde`);
        if (kilderBrugt.length < MIN_KILDER_BRUGT) m.push(`kun ${kilderBrugt.length} websider nævnt (mindst ${MIN_KILDER_BRUGT})`);
        if (ukendte.length) m.push(`tal uden dækning i kilden: ${ukendte.join(', ')}`);
        if (manglerKonkret(content, channelTitle).includes('kilde')) m.push('kilden ikke nævnt ved navn');
        if (tal < MIN_TAL) m.push(`kun ${tal} tal i artiklen, kilden har ${kildensTal} (mindst ${MIN_TAL})`);
        if (sc.score < MIN_SCORE) m.push(`konkrethedsscore ${sc.score} (mindst ${MIN_SCORE}: tal ${sc.tal}, navne ${sc.navne}, citater ${sc.citater})`);
        if (!svarFoerst) m.push('første afsnit besvarer ikke spørgsmålet konkret');
        if (laes.ordPrSaetning > MAX_ORD_PR_SAETNING) m.push(`${laes.ordPrSaetning} ord pr. sætning (højst ${MAX_ORD_PR_SAETNING})`);
        // Skriveregler (fase 2, 6/10): src/lib/skriveregler.mjs, målt på alle 420 artikler.
        // 22/10: med holdnings-match må op til 4 jeg-sætninger stå (bremsen: én passage
        // på 2-4 sætninger); flere end 4 meldes ALLE. Video-talesprog fanges som før.
        const tale = talesprog(content, 0); // 25/10: ejerens stemme står i sit eget afsnit (My take), ikke i brødteksten
        const diagram = tekstDiagram(content);
        const uklar = uklareKilder(content);
        const klistret = klistretSoegeord(content, targetQuestion);
        const nLister = lister(content).length;
        if (tale.length) m.push(`talesprog: ${tale.map((x) => `"${x.ord}"`).join(', ')}`);
        if (diagram.length) m.push(`tekst-diagram (${diagram.map((x) => x.type).join(', ')})`);
        if (uklar.length) m.push(`uklare kilder: ${uklar.map((x) => `"${x.ord}"`).join(', ')}`);
        if (klistret.length) m.push(`søgeordet klistret ind i ${klistret.length} sætning(er)`);
        if (nLister < MIN_LISTER) m.push(`${nLister} lister (mindst ${MIN_LISTER})`);
        const ordret = ordretFraKilde(content, text);
        const ordretPct = Math.round(ordretAndel(content, text) * 100);
        if (ordret.length) m.push(`${ordret.length} sætning(er) afskrevet fra videoen (${ordretPct} %)`);
        // 14/10: tvungne interne links og AI-kendetegn rettes i samme omgang (stopper ikke).
        const tvungne = tvungneLinks(content, ARTIKEL_TITLER);
        const aiFr = aiFraser(content);
        if (tvungne.length) m.push(`${tvungne.length} tvunget/tvungne interne link(s)`);
        if (aiFr.length) m.push(`${aiFr.length} AI-vending(er): ${[...new Set(aiFr.map((x) => x.ord))].join(', ')}`);
        return { tvungne, aiFr, brugte, ukendte, tal, sc, laes, svarFoerst, tale, diagram, uklar, klistret, nLister, ordret, ordretPct, va, vAfsnit, udenKilde, kilderBrugt, m };
      };
      // En senere rettelse (læsertjek, redaktørtjek) kasseres, hvis den bringer en af
      // de fejl ind, der stopper udgivelsen. Samme regel begge steder.
      const nyeFejl = (kk) => kk.ukendte.length || kk.tale.length || kk.klistret.length || kk.ordretPct > ORDRET_MAKS * 100
        || kk.vAfsnit.length !== 1 || kk.va.andel > VIDEO_ANDEL_MAKS || kk.udenKilde.length > MAKS_TAL_UDEN_KILDE || kk.kilderBrugt.length < MIN_KILDER_BRUGT;
      let k = status();
      const stilFoer = { tvungne: k.tvungne.length, ai: k.aiFr.length }; // til STIL-linjen (14/10)
      if (k.m.length) {
        console.log(`🔎 Kontrol mod faktaarket: ${k.m.join(' · ')} — beder om rettelse`);
        const ubrugte = fakta.filter((f) => !k.brugte.includes(f)).slice(0, 12);
        try {
          // 32768 (20/10): rettelsen skriver HELE artiklen om, og tænkningen tæller med i
          // loftet — ved 16384 brugte tænkningen ~15.700, svaret blev klippet og kasseret
          // (kørsel 735 og 782). Samme loft som hovedskrivningen (17/10).
          const rep = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 32768, temperature: 0.3 } })
            .generateContent(`Revise the article below. Keep its structure, headings, length and links${k.tvungne.length ? ' (except as item 16 says)' : ''}. Change ONLY what is needed to satisfy these requirements:
${k.brugte.length < MIN_VIDEO_DETALJER ? `1. In the video section, use at least ${MIN_VIDEO_DETALJER} items from the VIDEO FACT SHEET. Write every number exactly as the fact sheet gives it.\n` : ''}${k.ukendte.length ? `2. These numbers appear in the article but NOT in the research or the video: ${k.ukendte.join(', ')}. Remove each of them or replace it with a number from the RESEARCH FACTS. Do not keep any figure the sources do not give.\n` : ''}${k.vAfsnit.length !== 1 ? `3. The article must have exactly ONE "## " section about the video, and its heading must contain the creator's name "${kildeNavn(channelTitle) || 'the creator'}". ${k.vAfsnit.length > 1 ? `Merge these into one: ${k.vAfsnit.map((h) => `"${h}"`).join(', ')}.` : 'Add it after the sections that answer the main question, or rename the section that is about the video.'}\n` : ''}${k.va.andel > VIDEO_ANDEL_MAKS ? `13. ${Math.round(k.va.andel * 100)} % of the article comes from the video; at most ${Math.round(VIDEO_ANDEL_MAAL * 100)} % may. Shorten the video section, and outside it replace details that only the video gives with facts from the RESEARCH FACTS.\n` : ''}${k.udenKilde.length ? `14. These sentences give a number without saying where it comes from. Name the source in the sentence itself (the publisher from the RESEARCH FACTS, or the creator for a video figure), or remove the number:\n${k.udenKilde.map((s) => `   - ${s}`).join('\n')}\n` : ''}${k.kilderBrugt.length < MIN_KILDER_BRUGT ? `15. Only ${k.kilderBrugt.length} of the research's web publishers are named in the article; at least ${MIN_KILDER_BRUGT} must be. Use more RESEARCH FACTS and name their publishers.\n` : ''}
${k.tal < MIN_TAL ? `4. Include at least ${MIN_TAL} specific figures from the RESEARCH FACTS, written exactly as given and with their publisher named.\n` : ''}${!k.svarFoerst && targetQuestion ? `5. Rewrite the opening paragraph (at least 40 words, no heading) so its first two sentences directly answer the question "${targetQuestion}" in plain words, naming the subject of the question.\n` : ''}${k.laes.ordPrSaetning > MAX_ORD_PR_SAETNING ? `6. Sentences average ${k.laes.ordPrSaetning} words. Split long sentences so the average is under ${MAX_ORD_PR_SAETNING} words. Do not remove information.\n` : ''}${k.tale.length ? `7. These sentences are spoken language from the video, not editorial writing. Rewrite each in the third person, as an editor would (or quote the creator in quotation marks):\n${k.tale.map((x) => `   - ${x.saetning}`).join('\n')}\n` : ''}${k.diagram.length ? `8. The article draws a diagram with characters (arrows, boxes or a code block). Replace it with a markdown table or a numbered list that says the same thing. No code blocks, no arrows, no box characters.\n` : ''}${k.uklar.length ? `9. These sentences cite an unnamed source. Name the source if the RESEARCH FACTS or the VIDEO FACT SHEET give it; otherwise state the point plainly without "experts", "studies", "critics" or "reports":\n${k.uklar.map((x) => `   - ${x.saetning}`).join('\n')}\n` : ''}${k.klistret.length ? `10. The search words "${targetQuestion}" are pasted into these sentences where they are not grammatical. Rephrase each naturally:\n${k.klistret.map((x) => `   - ${x.saetning}`).join('\n')}\n` : ''}${k.nLister < MIN_LISTER ? `11. The article has ${k.nLister} markdown list(s); it needs at least ${MIN_LISTER}. Turn ${MIN_LISTER - k.nLister} existing paragraph(s) whose content is naturally a list (steps, options, components, pros and cons) into a markdown list of 3-5 items ("- " or "1. "). Keep every fact and link from those paragraphs.\n` : ''}${k.ordret.length ? `12. These sentences copy the video's own wording (eight or more words in a row from the transcript). An article must explain in its own words. Rewrite each one in different words with the same meaning, or, if the exact wording matters, put it in quotation marks and name the creator:\n${k.ordret.map((x) => `   - ${x.saetning}`).join('\n')}\n` : ''}${k.tvungne.length ? `16. These sentences force a link to another article into a place where it does not belong (the link text is a whole headline or a question). For each: if the sentence is only there for the link, delete the sentence; otherwise keep the sentence's information, and either remove the link or make its text 2-6 natural words of the sentence:\n${k.tvungne.map((x) => `   - ${x.saetning}`).join('\n')}\n` : ''}${k.aiFr.length ? `17. These sentences use phrasing typical of machine-written text. Rewrite each as one plain, direct statement with the same facts - no "not just X, but Y", no "it is worth noting", no "plays a key role", no opening "Ultimately,"/"At its core,", no clichés and no hedging clauses:\n${k.aiFr.map((x) => `   - ${x.saetning}`).join('\n')}\n` : ''}Never invent numbers or names. Keep every existing H2 heading exactly as it is${k.vAfsnit.length !== 1 ? ' (except as item 3 says)' : ''}. Do not add a sources section. Output ONLY the revised article in markdown - no fact sheet, no commentary, no preamble.

RESEARCH (from Google):
${soegningTekst(soeg)}

VIDEO FACT SHEET (items not yet used are listed first):
${faktaarkTekst([...ubrugte, ...k.brugte])}

ARTICLE TO REVISE:
${content}`);
          const ny = sanitizeLinks((rep.response.text() || '').replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim());
          // Målt 11/9: modellen svarede én gang med transskriptet i stedet for
          // artiklen ("Welcome to ... >> Thanks, Megan"), og længden alene lod det
          // slippe igennem. Nu skal rettelsen bevise, at den stadig er artiklen.
          const h2Foer = (content.match(/^##\s.+$/gm) || []).map((h) => h.trim());
          const h2Efter = new Set((ny.match(/^##\s.+$/gm) || []).map((h) => h.trim()));
          const h2Bevaret = h2Foer.filter((h) => h2Efter.has(h)).length;
          const laengde = ny.split(/\s+/).length / Math.max(1, content.split(/\s+/).length);
          const ligner = h2Foer.length === 0 ? laengde >= 0.7 && laengde <= 1.4 : h2Bevaret >= Math.max(1, Math.ceil(h2Foer.length * 0.6)) && laengde >= 0.7 && laengde <= 1.4;
          if (ligner) content = ny;
          else console.log(`   rettelse kasseret: ligner ikke artiklen (H2 bevaret ${h2Bevaret}/${h2Foer.length}, længde ${Math.round(laengde * 100)} %)`);
        } catch (e) { console.log(`   rettelse fejlede: ${e.message}`); }
        k = status();
      }
      // Opfundne tal er det ene, der ALDRIG må ud: ét forkert tal, og læseren
      // (og AdSense) kan med rette kalde hele sitet utroværdigt. Så står der
      // stadig tal uden dækning efter rettelsen, skrives artiklen ikke —
      // robotten prøver næste kandidat. For få brugte punkter eller manglende
      // kildenavn logges kun, så audit-specificity.mjs kan følge det.
      if (k.ukendte.length) {
        throw new Error(`Artiklen har tal uden dækning i kilden efter rettelse: ${k.ukendte.join(', ')}. Artiklen skrives ikke.`);
      }
      // Håndhævet 15/9: for få tal (når kilden har dem) og for lav
      // konkrethedsscore stopper også udgivelsen — robotten prøver næste kandidat.
      if (k.tal < MIN_TAL) {
        throw new Error(`Artiklen har ${k.tal} tal efter rettelse; kilden har ${kildensTal} (mindst ${MIN_TAL}). Artiklen skrives ikke.`);
      }
      if (k.sc.score < MIN_SCORE) {
        throw new Error(`Konkrethedsscore ${k.sc.score} efter rettelse (mindst ${MIN_SCORE}). Artiklen skrives ikke.`);
      }
      // Fase 2 (6/10): fejl, læseren SER, må ikke udgives — videoens talesprog,
      // en tegnet tekst-figur og et søgeord klistret ind i en sætning. Målt på alle
      // 420 artikler: reglerne gav 0 falske fund efter justering (8 talesprog, 3
      // klistrede, alle ægte). Uklare kilder og for få lister logges kun.
      if (k.tale.length) throw new Error(`Talesprog efter rettelse: ${k.tale.map((x) => `"${x.ord}"`).join(', ')}. Artiklen skrives ikke.`);
      if (k.diagram.length) throw new Error(`Tekst-diagram efter rettelse (${k.diagram.map((x) => x.type).join(', ')}). Artiklen skrives ikke.`);
      if (k.klistret.length) throw new Error(`Søgeordet "${targetQuestion}" står stadig klistret ind i ${k.klistret.length} sætning(er). Artiklen skrives ikke.`);
      // Merværdi (8/10): en artikel, der for en stor del er videoens egne ord, giver
      // læseren intet, videoen ikke allerede gav - og Google kan læse undertekster.
      if (k.ordretPct > ORDRET_MAKS * 100) throw new Error(`${k.ordretPct} % af sætningerne er afskrevet fra videoen efter rettelse (højst ${ORDRET_MAKS * 100} %). Artiklen skrives ikke.`);
      console.log(`📝 Afskrift fra videoen: ${k.ordret.length} sætning(er), ${k.ordretPct} %`);
      // Søgning først (12/10): stop-tjek. Fase A målte 69 % video og 77 % tal uden
      // navngiven kilde. Videoen må ikke tage over igen, tal skal sige hvor de kommer
      // fra, og artiklen skal bygge på mindst MIN_KILDER_BRUGT websider.
      if (k.vAfsnit.length !== 1) throw new Error(`${k.vAfsnit.length} videoafsnit efter rettelse (præcis 1, med kanalens navn i overskriften). Artiklen skrives ikke.`);
      if (k.va.andel > VIDEO_ANDEL_MAKS) throw new Error(`Video-andel ${Math.round(k.va.andel * 100)} % efter rettelse (højst ${Math.round(VIDEO_ANDEL_MAKS * 100)} %). Artiklen skrives ikke.`);
      if (k.udenKilde.length > MAKS_TAL_UDEN_KILDE) throw new Error(`${k.udenKilde.length} sætninger med tal uden navngiven kilde efter rettelse (højst ${MAKS_TAL_UDEN_KILDE}): ${k.udenKilde.map((s) => `"${s.slice(0, 80)}"`).join(' · ')}. Artiklen skrives ikke.`);
      if (k.kilderBrugt.length < MIN_KILDER_BRUGT) throw new Error(`Kun ${k.kilderBrugt.length} websider fra søgningen nævnt (mindst ${MIN_KILDER_BRUGT}). Artiklen skrives ikke.`);
      console.log(`🌐 Søgning først: video-andel ${Math.round(k.va.andel * 100)} % · videoafsnit "${k.vAfsnit[0]}" · tal uden kilde ${k.udenKilde.length} · websider nævnt ${k.kilderBrugt.length} af ${soeg.kilder.length}`);

      // Tvungne interne links (14/10): det, rettelsen ikke fik ryddet, fjernes nu — FØR
      // læsertjekket, så en sætning, der læses forkert uden sit link, bliver fanget dér.
      const tv1 = fjernTvungneLinks(content, ARTIKEL_TITLER);
      if (tv1.saetningerFjernet || tv1.linksFjernet) {
        content = tv1.md;
        console.log(`🔗 Tvungne links: ${tv1.saetningerFjernet} sætning(er) fjernet, ${tv1.linksFjernet} link(s) gjort til tekst${tv1.fjernede.length ? `: ${tv1.fjernede.map((s) => `"${s.slice(0, 70)}"`).join(' · ')}` : ''}`);
      }
      // Linjen læses af _maal-*-scripts. Ændr ikke formatet.
      const aiNu = aiFraser(content);
      console.log(`STIL: ${JSON.stringify({ tvungneLinksFoer: stilFoer.tvungne, tvungneEfterRettelse: k.tvungne.length, saetningerFjernet: tv1.saetningerFjernet, linksGjortTilTekst: tv1.linksFjernet, aiVendingerFoer: stilFoer.ai, aiVendingerNu: aiNu.length, aiTyper: [...new Set(aiNu.map((x) => x.ord))] })}`);

      // Læsertjek (8/10): en model læser artiklen som en læser, der ikke har set videoen.
      let lf = await laeserTjek(genAI, content);
      if (lf === null) { console.log('👓 Læsertjek kunne ikke køre - artiklen udgives uden (ses i loggen)'); lf = []; }
      const lfFoer = lf.length;
      if (lf.length) {
        const foerLaeser = content, lfListe = lf;
        const r = await retLaeserFund(genAI, content, lf);
        content = r.md;
        // Rettelsen må ikke bringe nye fejl ind (opfundne tal, talesprog, klistret søgeord, afskrift).
        if (nyeFejl(status())) {
          content = foerLaeser;
          console.log('   læser-rettelse kasseret: den bragte nye fejl ind');
        }
        lf = content === foerLaeser ? lfListe : ((await laeserTjek(genAI, content)) ?? lfListe);
        console.log(`👓 Læsertjek: ${lfFoer} fund (${lfListe.map((x) => x.problem).join(', ')}), ${content === foerLaeser ? 0 : r.rettet} rettet, ${lf.length} tilbage`);
        for (const x of lf) console.log(`   - [${x.problem}] ${x.sentence.slice(0, 120)} (${x.why})`);
      } else console.log('👓 Læsertjek: 0 fund');
      // JARGON (25/10): uforklarede fagord rettes i en runde mere, men stopper ikke artiklen —
      // prøverne viste, at hver gennemlæsning finder nye kandidater. De øvrige fund stopper som før.
      const jargon = lf.filter((x) => x.problem === 'JARGON');
      if (jargon.length) {
        const foerJ = content;
        const r2 = await retLaeserFund(genAI, content, jargon);
        content = r2.md;
        if (content !== foerJ && nyeFejl(status())) { content = foerJ; console.log('   fagords-rettelse kasseret: den bragte nye fejl ind'); }
        else console.log(`👓 Fagord: ${r2.rettet} af ${jargon.length} forklaret i anden runde`);
      }
      const stopFund = lf.filter((x) => x.problem !== 'JARGON');
      if (stopFund.length >= LAESER_MAKS) throw new Error(`Læsertjek: ${stopFund.length} sætninger, en læser snubler over, efter rettelse (højst ${LAESER_MAKS - 1}). Artiklen skrives ikke.`);

      // Redaktørtjek (fase B, 12/10, src/lib/redaktoertjek.mjs): besvarer artiklen
      // søgningens delspørgsmål, og reklamerer den? Ét rettelsesforsøg; står fejlen
      // der stadig bagefter, skrives artiklen ikke.
      let rt = await redaktoerTjek(genAI, content, soeg.delspoergsmaal, targetQuestion);
      if (rt === null) console.log('🧑‍⚖️ Redaktørtjek kunne ikke køre - artiklen udgives uden (ses i loggen)');
      else if (rt.ubesvarede.length || rt.reklame.length || rt.ensidige.length) {
        console.log(`🧑‍⚖️ Redaktørtjek: ${rt.ubesvarede.length} ubesvarede delspørgsmål, ${rt.reklame.length} reklamesætning(er), ${rt.ensidige.length} ensidige sætning(er) — beder om rettelse`);
        const foerRed = content;
        try {
          // 32768 (20/10): samme grund som faktaark-rettelsen ovenfor — rettelsen skriver
          // hele artiklen om; 16384 gav klippede, kasserede svar (kørsel 735 og 782).
          const rep = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 32768, temperature: 0.3 } })
            .generateContent(`Revise the article below. Change ONLY what is needed for these requirements and keep everything else - headings, links, length - as it is:
${rt.ubesvarede.length ? `1. The article does not answer these questions that people searching "${targetQuestion}" have. Answer each one, using only the RESEARCH FACTS and naming the publisher of every number: add a short "## " section for it, or extend the section that comes closest.\n${rt.ubesvarede.map((u) => `   - ${u.spoergsmaal}`).join('\n')}\n` : ''}${rt.reklame.length ? `2. These sentences promote something instead of informing. Remove each one, or rewrite it as neutral information that recommends nothing:\n${rt.reklame.map((s) => `   - ${s}`).join('\n')}\n` : ''}${rt.ensidige.length ? `3. These sentences state a one-sided judgment as settled fact. Rewrite each one as a plain statement that names who says it, backed by the RESEARCH FACTS (for example "NIST recommends layered controls"), or narrow it to what the evidence shows. If there is a real limitation, state it as its own short sentence with its source. Do NOT add hedging clauses or qualifiers ("though ...", "not invariably", "may not always", "in some cases"):\n${rt.ensidige.map((s) => `   - ${s}`).join('\n')}\n` : ''}Never invent numbers or names. Do not add a sources section. Output ONLY the revised article in markdown - no commentary, no preamble.

RESEARCH (from Google):
${soegningTekst(soeg)}

ARTICLE TO REVISE:
${content}`);
          const ny = sanitizeLinks((rep.response.text() || '').replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim());
          const laengde = ny.split(/\s+/).length / Math.max(1, content.split(/\s+/).length);
          if (laengde >= 0.8 && laengde <= 1.5) content = ny;
          else console.log(`   redaktør-rettelse kasseret: længde ${Math.round(laengde * 100)} %`);
        } catch (e) { console.log(`   redaktør-rettelse fejlede: ${e.message.split('\n')[0]}`); }
        if (content !== foerRed && nyeFejl(status())) { content = foerRed; console.log('   redaktør-rettelse kasseret: den bragte nye fejl ind'); }
        rt = content === foerRed ? rt : ((await redaktoerTjek(genAI, content, soeg.delspoergsmaal, targetQuestion)) ?? rt);
      }
      if (rt && rt.ubesvarede.length) throw new Error(`Redaktørtjek: ${rt.ubesvarede.length} delspørgsmål ubesvaret efter rettelse (${rt.ubesvarede.map((u) => `"${u.spoergsmaal}"`).join(', ')}). Artiklen skrives ikke.`);
      if (rt && rt.reklame.length) throw new Error(`Redaktørtjek: ${rt.reklame.length} reklamesætning(er) efter rettelse (${rt.reklame.map((s) => `"${s.slice(0, 80)}"`).join(' · ')}). Artiklen skrives ikke.`);
      // Ensidighed: målt 12/10 på de 5 prøveartikler svingede dommen fra kørsel til kørsel
      // (0/1, 3/4, 5/3, 0/0, 0/0). "Stop ved én" ville stoppe 2-3 af 5, delvis af tilfældighed.
      // Derfor: 1-2 rettes og udgives (står i loggen), 3+ efter rettelse = ingen artikel.
      if (rt && rt.ensidige.length > MAKS_ENSIDIGE) throw new Error(`Redaktørtjek: ${rt.ensidige.length} ensidige sætninger efter rettelse (højst ${MAKS_ENSIDIGE}): ${rt.ensidige.map((s) => `"${s.slice(0, 80)}"`).join(' · ')}. Artiklen skrives ikke.`);
      if (rt && rt.ensidige.length) for (const s of rt.ensidige) console.log(`   ensidig sætning tilbage (tilladt, højst ${MAKS_ENSIDIGE}): ${s.slice(0, 120)}`);
      if (rt) console.log(`🧑‍⚖️ Redaktørtjek: alle ${soeg.delspoergsmaal.length} delspørgsmål besvaret, ingen reklame, ${rt.ensidige.length} ensidig(e) sætning(er)`);

      // ===== 25/10 (Jacob): læsbarhed og faktatjek før udgivelse — src/lib/faktatjek.mjs =====
      // Faktatjekket af 20 artikler fandt 15 talfejl: forkerte størrelsesordner, opfundne datoer
      // og tre "According to X", hvor X ikke sagde det. Rækkefølge: først forenkling (den skriver
      // teksten om), så faktatjekket — så det er den endelige tekst, der er tjekket.
      const videoTekst = `${text}\n${faktaarkTekst(fakta)}`;
      const kildeTekst = `${videoTekst}\n${soegFaktaTekst}`;
      const cifre = (md) => [...md.matchAll(/(?<![A-Za-z0-9])\d[\d,]*(?:\.\d+)?/g)].map((m) => m[0].replace(/,/g, '')).sort().join(' ');

      // A. Læsbarhed: klassetrin 9-10 (Jacob). Én forenkling, der ikke må ændre tal, overskrifter eller links.
      let kt = klassetrin(content);
      const ktFoer = kt.klassetrin;
      let forenklet = false;
      // 25/10: op til TO forenklinger. Målt: kvantecomputer-artiklen stod på 16,4 efter én og blev
      // stoppet - og en stoppet artikel prøves aldrig igen (Jacob: artikler må ikke springes over).
      for (let runde = 0; runde < 2 && (kt.klassetrin > KLASSETRIN_MAKS || kt.ordPrSaetning > ORD_MAAL); runde++) {
        const foerF = content;
        try {
          const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 32768, temperature: 0.3 } }).generateContent(forenklPrompt(content));
          const ny = sanitizeLinks((r.response.text() || '').replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim());
          const h2 = (md) => (md.match(/^##\s.+$/gm) || []).map((h) => h.trim()).join('\n');
          const laengde = ny.split(/\s+/).length / Math.max(1, content.split(/\s+/).length);
          const grund = [h2(ny) !== h2(content) && 'overskrifter ændret', cifre(ny) !== cifre(content) && 'tal ændret', (laengde < 0.8 || laengde > 1.4) && `længde ${Math.round(laengde * 100)} %`].filter(Boolean);
          if (!grund.length) { content = ny; forenklet = true; } else console.log(`   forenkling kasseret: ${grund.join(', ')}`);
        } catch (e) { console.log(`   forenkling fejlede: ${e.message.split('\n')[0]}`); }
        if (content !== foerF && nyeFejl(status())) { content = foerF; forenklet = false; console.log('   forenkling kasseret: den bragte nye fejl ind'); }
        kt = klassetrin(content);
      }
      // Linjen læses af målingerne. Ændr ikke formatet.
      console.log(`LAESBARHED: ${JSON.stringify({ foer: ktFoer, efter: kt.klassetrin, ordPrSaetning: kt.ordPrSaetning, forenklet })}`);
      if (kt.ordPrSaetning > ORD_STOP) throw new Error(`Læsbarhed: ${kt.ordPrSaetning} ord pr. sætning efter forenkling (højst ${ORD_STOP}). Artiklen skrives ikke.`);
      // Klassetrinnet er kun nødbremse (emnets egne ord, fx "quantum", kan ikke skiftes ud); kravet er
      // korte sætninger (stopper ovenfor). Over bremsen efter to forenklinger: advarsel, ikke stop.
      if (kt.klassetrin > KLASSETRIN_STOP) console.log(`   ⚠️ Læsbarhed: klassetrin ${kt.klassetrin} efter to forenklinger (bremse ${KLASSETRIN_STOP}) - sætningerne er korte nok, artiklen skrives.`);

      // B+C (faktatjek af alt, læseren ser) ligger nu i SLUTKONTROLLEN til sidst — src/lib/slutkontrol.mjs.
      console.log(k.m.length
        ? `🔎 Stadig: ${k.m.join(' · ')} — udgives alligevel, tælles i audit`
        : `🔎 Kontrol ok: ${k.brugte.length} af ${fakta.length} punkter fra arket brugt, ${k.tal} tal, kilden nævnt`);
      console.log(`📏 Score ${k.sc.score} (tal ${k.sc.tal}, navne ${k.sc.navne}, citater ${k.sc.citater}) · ${k.laes.ordPrSaetning} ord/sætning · svaret først: ${k.svarFoerst ? 'ja' : 'nej'}`);

      // Fyld (fase 2, 6/10): Gemini udpeger sætninger, man intet lærer af;
      // fjernSaetninger tager kun dem, reglerne tillader (aldrig første afsnit,
      // lister, sætninger med tal eller links, aldrig et afsnits sidste sætning),
      // højst hver 5. Ingen ord omskrives. Fejler kaldet, springes trinnet over.
      try {
        const kand = fyldKandidater(content);
        if (kand.length >= 5) {
          const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0 } })
            .generateContent(`An article answers the reader's question "${targetQuestion || safeTitle}". Below are numbered sentences from it. Which of them are FILLER - sentences a reader learns nothing from: generic statements, repeats of an earlier point, empty transitions, or vague praise (e.g. "This makes it a powerful tool for creators.")? Do NOT mark a sentence that carries a fact, an example, a reason, a limitation, a comparison or a step. Return ONLY a JSON array of the numbers, e.g. [2,7]. If none, return [].\n\n${kand.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
          const m = (r.response.text() || '').match(/\[[\d,\s]*\]/);
          const valgt = m ? JSON.parse(m[0]).map((n) => kand[n - 1]).filter(Boolean) : [];
          const fj = fjernSaetninger(content, valgt, Math.floor(kand.length / 5));
          content = fj.md.trim();
          console.log(`🧽 Fyld: Gemini udpegede ${valgt.length} af ${kand.length} kandidater; fjernet ${fj.fjernet}${fj.fjernede.length ? `: ${fj.fjernede.map((s) => `"${s.slice(0, 60)}"`).join(' · ')}` : ''}`);
        }
      } catch (e) { console.log(`🧽 Fyld-tjek sprunget over: ${e.message.split('\n')[0]}`); }

      // Korte afsnit (fase 2, 6/10): delt MELLEM sætninger, ingen ord ændres.
      // Første afsnit: deles efter 2. sætning, hvis det er over 60 ord eller over 3 sætninger.
      // Øvrige: regel B (højst 3 sætninger, 3 sætninger <= 60 ord, 2 <= 75) — valgt
      // efter måling på alle 420 artikler (én-sætningsafsnit 20,8 % mod 26,7 % med
      // den strengeste regel).
      const fa = delFoersteAfsnit(content);
      content = fa.md;
      const la = delLangeAfsnit(content);
      content = la.md;
      const at = afsnitsTal(content);
      console.log(`📐 Afsnit: første afsnit ${fa.delt ? 'delt' : 'uændret'} (${foersteAfsnitTal(content).ord} ord), ${la.delt} lange afsnit delt; nu ${at.afsnit} afsnit, ${at.enSaetning} på én sætning, længste ${at.maksOrd} ord · lister ${lister(content).length}${k.uklar.length ? ` · uklare kilder tilbage: ${k.uklar.length}` : ''}`);

      // Interne links: sidste værn mod tvungne links (redaktør- og læserrettelserne kan have
      // sat nye ind), derefter skal ankerteksten passe til målet (se ankerTjek).
      const tv2 = fjernTvungneLinks(content, ARTIKEL_TITLER);
      if (tv2.saetningerFjernet || tv2.linksFjernet) {
        content = tv2.md;
        console.log(`🔗 Tvungne links (sidste værn): ${tv2.saetningerFjernet} sætning(er) fjernet, ${tv2.linksFjernet} link(s) gjort til tekst`);
      }
      content = ankerTjek(content);

      // Kodeformatering hører ikke hjemme i en artikel. Målt 12/9: modellen
      // satte faktaarkets nøgler i backticks (`2d`, `Justin_tech`).
      content = content.replace(/`([^`\n]*)`/g, '$1');

      // Forbudte ord håndhæves her, ikke kun i prompten (src/lib/forbudt.mjs).
      const forbudte = findForbudte(content);
      if (forbudte.length) {
        content = fjernForbudteOrd(content);
        console.log(`🧹 Forbudte ord erstattet: ${forbudte.join(', ')}`);
      }

      // Eksterne links, aftalt med Jacob 23/9: højst 3 fra videoens egen
      // beskrivelse + højst 2 officielle sider for navne i teksten, alle hentet
      // live og kun sat på et navn, der allerede står i teksten. Ingen ord
      // ændres. Fejler noget, udgives artiklen uden — robotten stopper aldrig her.
      const ekst = await tilfoejEksterneLinks(content, {
        beskrivelse: videoBeskrivelse,
        spoerg: async (p) => (await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0 } }).generateContent(p)).response.text(),
      });
      content = ekst.content;

      // Kildeliste (fase B, 12/10): "## Sources" nederst, bygget af koden ud fra de
      // websider, artiklen faktisk nævner, plus videoen. Modellen skriver den aldrig selv.
      const brugteSider = brugteKilder(content, soeg);
      const slut = { va: videoAndel(content, channelTitle, fakta, soeg.fakta.map((f) => f.tekst).join('\n')), udenKilde: talUdenKilde(content, soeg.navne, channelTitle) };
      content = `${content.trim()}\n\n${kildelisteMd(brugteSider, { videoId, videoTitel, kanal: kildeNavn(channelTitle) })}`;
      // Faktaboks (trin 4, 16/10): 3-4 nøglefakta fra søgningen, gemt i frontmatter som keyFacts.
      noegle = noegleFakta(soeg, brugteSider);
      console.log(`FAKTABOKS: ${noegle.length} fakta`);
      // Værktøj (trin 4 del 2, 16/10): passer et af sitets værktøjer til selve spørgsmålet, får teksten
      // én sætning om, hvordan læseren bruger det på sit eget problem - lige før kildelisten.
      // Samme regel som siden (src/lib/vaerktoej.mjs), ingen modelkald.
      const vt = vaerktoejTil(`${safeTitle} ${targetQuestion || ''}`);
      const vtSaetning = brugsSaetning(vt, content, videoId);
      if (vtSaetning) content = content.replace(/\n## Sources\s*\n/, `\n${vtSaetning}\n\n## Sources\n`);
      console.log(`VAERKTOEJ: ${vt ? vt.slug : 'intet'}${vtSaetning ? ' (sætning sat ind)' : ''}`);
      // Måling af den endelige tekst til fase C (samme regler som stop-tjekkene). Ændr ikke formatet.
      const ob = plan ? outlineBrugt(content, plan) : null;
      console.log(`KILDETJEK: ${JSON.stringify({ videoAndel: Math.round(slut.va.andel * 100), videoAfsnitOrd: slut.va.afsnitOrd, ord: slut.va.ialt, talUdenKilde: slut.udenKilde.length, websider: brugteSider.length, delspoergsmaal: soeg.delspoergsmaal.length, outline: ob ? `${ob.brugt}/${ob.ialt}` : 'ingen', faqFraSoegninger: `${faqFraSoegninger(faqs, rigtigeSoegninger)}/${faqs.length}` })}`);

      // ===== JACOBS STEMME (25/10, Jacob: hans mening flettet ind - ingen boks, ingen overskrift) =====
      // Skrives ud fra hjernen og den færdige tekst og sættes ind sidst i den sektion, hvor den passer
      // bedst - FØR slutkontrollen, så et tal i afsnittet bliver faktatjekket som alt andet.
      if (hjerneStemme && !isShort) {
        try {
          const p = minHoldningPrompt(hjerne, `${soeg.emne || ''} ${targetQuestion || ''} ${videoTitel || ''}`, content, targetQuestion || safeTitle);
          let mt = { ok: false, grund: 'ingen prompt' };
          for (let forsoeg = 0; p && forsoeg < 2 && !mt.ok; forsoeg++) {
            const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0.4 } }).generateContent(p);
            mt = tjekMinHoldning(r.response.text(), content);
            if (!mt.ok) console.log(`   stemme forsøg ${forsoeg + 1} kasseret: ${mt.grund}`);
          }
          if (mt.ok) content = fletIndHoldning(content, mt.sektion, mt.tekst);
          console.log(`STEMME: ${JSON.stringify({ med: mt.ok, sektion: mt.ok ? mt.sektion : '', grund: mt.ok ? '' : mt.grund, saetninger: mt.ok ? mt.tekst.split(/(?<=[.!?])\s+/).length : 0 })}`);
        } catch (e) { console.log(`STEMME: ${JSON.stringify({ med: false, grund: e.message.split('\n')[0].slice(0, 120) })}`); }
      }

      // ===== SLUTKONTROL (25/10, Jacob: "én opskrift, én slutkontrol") — src/lib/slutkontrol.mjs =====
      // Kører på den FÆRDIGE artikel og dækker alt, læseren ser (LAESER_FELTER): titel, meta, resumé,
      // FAQ-svar, brødtekst og faktaboks. Fanget = rettet eller fjernet; uløst = ingen artikel.
      const felter = { titel: safeTitle, meta: safeMeta, resume: safeSummary, faqs, brodtekst: content, faktaboks: noegle };
      const rap = await slutkontrol(genAI, hentModel, GEMINI_MODEL, felter, {
        soeg, kanal: kildeNavn(channelTitle), videoTekst, research: soegningTekst(soeg), videoNoter: faktaarkTekst(fakta).slice(0, 6000),
      });
      safeTitle = felter.titel; safeMeta = felter.meta; safeSummary = felter.resume; content = felter.brodtekst; noegle = felter.faktaboks;
      faqs.splice(0, faqs.length, ...felter.faqs);
      // Linjen læses af målingerne og den daglige stikprøve. Ændr ikke formatet.
      console.log(`SLUTKONTROL: ${JSON.stringify(rap)}`);
    }

    // Ved omskrivning beholdes den oprindelige udgivelsesdato; rewrittenAt viser hvornår.
    const date = erstatGammel?.date || new Date().toISOString().split('T')[0];
    const rewrittenYaml = erstatGammel ? `rewrittenAt: "${new Date().toISOString().split('T')[0]}"\n` : "";
    // recipe 3 (25/10): skrevet med journalist-reglerne, læsbarhed og faktatjekket. omskriv-gamle.mjs
    // omskriver alle artikler uden dette mærke. Hæv tallet, når opskriften ændres markant igen.
    const recipeYaml = isShort ? "" : "recipe: 3\n";

    const faqsYaml = faqs.length > 0
      ? "faqs:\n" + faqs.map(f => `  - question: ${toYamlDoubleQuoted(f.question)}\n    answer: ${toYamlDoubleQuoted(f.answer)}`).join('\n') + "\n"
      : "";

    const tagsYaml = "tags:\n" + finalTags.map(t => `  - ${toYamlDoubleQuoted(t)}`).join('\n') + "\n";

    const metaYaml = (!isShort && safeMeta) ? `metaDescription: ${toYamlDoubleQuoted(safeMeta)}\n` : "";

    // Gemmes så vi senere kan måle om artikler med et søgespørgsmål klarer sig
    // bedre end dem uden. Uden det står vi om tre måneder med en fornemmelse.
    const questionYaml = (!isShort && targetQuestion) ? `targetQuestion: ${toYamlDoubleQuoted(targetQuestion)}\n` : "";

    // Kildeangivelse — udelades hvis YouTube ikke gav os data
    const sourceYaml =
      (channelTitle ? `channelTitle: ${toYamlDoubleQuoted(channelTitle)}\n` : "") +
      (channelId ? `channelId: ${toYamlDoubleQuoted(channelId)}\n` : "") +
      (publishedAt ? `publishedAt: ${toYamlDoubleQuoted(publishedAt)}\n` : "");

    // Visningstal med dato, så /popular kan sige hvor gammelt tallet er.
    const viewsYaml = viewCount === null
      ? ""
      : `viewCount: ${viewCount}\nviewsUpdated: "${new Date().toISOString().slice(0, 10)}"\nthumbMax: ${thumbMax}\n`;

    const keyFactsYaml = noegle.length
      ? "keyFacts:\n" + noegle.map((f) => `  - text: ${toYamlDoubleQuoted(f.text)}\n    source: ${toYamlDoubleQuoted(f.source)}\n    url: ${toYamlDoubleQuoted(f.url)}`).join('\n') + "\n"
      : "";

    const markdown = `---\ntitle: "${safeTitle}"\nyoutubeId: "${videoId}"\n${sourceYaml}date: "${date}"\n${tagsYaml}summary: "${safeSummary}"\n${metaYaml}${questionYaml}duration: "${duration}"\n${viewsYaml}isShort: ${isShort}\n${recipeYaml}${rewrittenYaml}${faqsYaml}${keyFactsYaml}---\n\n${content}\n`;

    if (!fs.existsSync('./src/content/videos')) { fs.mkdirSync('./src/content/videos', { recursive: true }); }
    fs.writeFileSync(`./src/content/videos/${slug}.md`, markdown);
    console.log(`✅ Succes! Fil oprettet: ${slug}.md (varighed ${duration}).`);
    // Billede til artiklen (13/10): AI-genereret billede med "AI-generated" og "TechFeedWatch.com"
    // (src/lib/aibillede.mjs) — øverst i artiklen, på kortene og som delebillede. Fejler det,
    // laves det abstrakte emnekort som før. Fejler stille: artiklen er allerede gemt.
    if (!isShort) {
      // Har artiklen allerede et AI-billede (fx ved omskrivning af en gammel artikel), genbruges
      // det — ellers betales billedet to gange (14/10, Jacob: billeder og omskrivning slås sammen).
      if (harAiBillede(slug)) console.log('🖼️ AI-billede: findes allerede — genbruges');
      // 25/10 (Jacob): et eksisterende AI-billede laves aldrig om; en artikel UDEN AI-billede får et.
      else {
        const ai = await lavAiBillede(genAI, { slug, titel: safeTitle, emne: finalTags[0] || '', resume: safeSummary }, sitetsStier(slug));
        if (!ai) await generateOgCard(videoId, slug);
      }
    } else {
      await generateOgCard(videoId, slug);
    }
  } catch (error) {
    console.log("❌ Fejl:", error.message);
  }
}

run();