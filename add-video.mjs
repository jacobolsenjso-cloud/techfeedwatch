import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { manglerKonkret, kildeNavn, taelTal } from './src/lib/konkret.mjs';
import { MIN_FAKTA, MIN_BRUGT, faktaarkPrompt, parseFaktaark, faktaarkScore, faktaarkTekst, ukendteTal, brugteFakta } from './src/lib/faktaark.mjs';
import fs from 'fs';
import 'dotenv/config';
import { generateOgCard } from './og-card.mjs';
import { pubCase, manglendeKerneord, overskriftAfSpoergsmaal, kerneord, stamme } from './src/lib/headline.mjs';
import { faellesOrd } from './src/lib/question.mjs';
import { fjernForbudteOrd, findForbudte } from './src/lib/forbudt.mjs';
import { erRelevant } from './src/lib/relevans.mjs';
import { hentSegmenter } from './src/lib/transskript.mjs';

const ALLOWED_TAGS = ["AI & Tech", "SEO", "Automation", "Coding", "Business & Money", "AI Video", "Productivity", "Fintech", "Crypto", "Cybersecurity", "Quantum Computing", "Hardware & Chips", "AR & VR"];

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
    - "## Key Takeaways" - 3-4 bullets with the most critical, non-obvious insights.
    - "## Technical Breakdown" - explain the core concepts objectively and clearly.
    - "## Why This Matters" - the concrete real-world impact on workflows, security, or industry.
    - "## What Others Missed" - unbiased breakdown of risks, limitations, costs, or unexpected angles.
    - "## The Verdict" - final objective assessment: passing trend or permanent shift?`
  },
  {
    name: "News Brief",
    min: 700, max: 950,
    structure: `STRUCTURE (keep it tight and punchy - this is a short news brief):
    - Opening: 1-2 sentence summary of what happened (no heading, no label).
    - Two or three short paragraphs covering the essentials and why they matter. Use at most one "## " subheading, or none.
    - "## The Bottom Line" - one tight closing paragraph with your read on it.`
  },
  {
    name: "Explainer",
    min: 900, max: 1250,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence plain-language summary (no heading, no label).
    - "## What It Is" - define the subject clearly for a smart non-expert.
    - "## How It Works" - the mechanics, explained simply and accurately.
    - "## Who It's For" - who benefits, and who does not.
    - "## The Bottom Line" - a short, practical takeaway.`
  },
  {
    name: "Editorial",
    min: 900, max: 1250,
    structure: `STRUCTURE (an opinionated editorial - take a clear, reasoned stance while staying factually honest):
    - Opening: state your thesis or argument in 2-3 sentences (no heading, no label).
    - Two or three "## " sections that build the argument, with your own topic-specific headings.
    - "## Where This Lands" - a decisive editorial conclusion that commits to a view.`
  },
  {
    name: "Practical Q&A",
    min: 900, max: 1250,
    structure: `STRUCTURE (a practical, reader-first piece):
    - Opening: a 2 sentence summary of the practical question at stake (no heading, no label).
    - Two or three "## " headings phrased as the real questions readers are asking.
    - "## What To Actually Do" - concrete, honest guidance.`
  },
  {
    name: "Context & Implications",
    min: 900, max: 1250,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence summary (no heading, no label).
    - "## The Background" - the context and history the source skipped over.
    - "## What Changed" - what is actually new or different here.
    - "## The Ripple Effects" - the second-order consequences across the industry.
    - "## What To Watch Next" - where this is heading and the signals to track.`
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
// eget salt), så fordelingen bliver ~25% kolon, ~12% spørgsmål, resten udsagn.
const TITLE_FORMS = [
  'A plain declarative headline. No colon, no question mark.',
  'A how/what/why headline WITHOUT a question mark. No colon.',
  'A plain declarative headline. No colon, no question mark. Vary the opening word.',
  'A two-part headline with ONE colon; the part before the colon is 1-3 words.',
  'A genuine question ending in a question mark. No colon. The question a searcher would type.',
  'A plain declarative headline. No colon, no question mark. May start with a number if the article genuinely lists things.',
  'A "What ... Means for ..." or "How ... Changes ..." headline. No colon, no question mark.',
  'A two-part headline with ONE colon; the substance goes after the colon.',
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
  for (const file of fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md'))) {
    const raw = fs.readFileSync(`./src/content/videos/${file}`, 'utf-8');
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
  alle.sort((a, b) => b.score - a.score || b.dato.localeCompare(a.dato));
  const valgte = alle.filter((a) => a.score > 0).slice(0, 8);
  const kandidater = valgte.length >= 3 ? valgte : alle.slice(0, 8);
  if (kandidater.length) {
    const links = kandidater.map((a) => `[${a.title}](/video/${a.slug})`).join('\n');
    internalLinksContext = `\nRELATED ARTICLES ON THIS SITE (the only internal links you may use):\n${links}\nLINK RULES: Link 2 to 4 of them, only where a sentence is genuinely about that article's subject. The link text must be the article's title or a close paraphrase of it - never a phrase about something else. A link whose text does not match its target will be removed. Fewer links is fine; irrelevant links are not.`;
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

    // Kildeangivelse hentes ALTID (uafhængigt af Plan A/B), så hver artikel kan
    // kreditere den oprindelige kanal. Fejler dette, fortsætter vi uden kilde.
    let channelTitle = null;
    let channelId = null;
    let publishedAt = null;
    let viewCount = null;
    let thumbMax = false;
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
      const { segmenter: transcript, fraCache } = await hentSegmenter(videoId, {
        onVent: (s) => console.log(`   YouTube drosler — venter ${s / 60} min`),
      });
      if (fraCache) console.log('Transskript: læst fra cache');
      text = transcript.map(t => t.text).join(' ');

      const lastT = transcript[transcript.length - 1];
      const totalSeconds = Math.floor(lastT.offset / 1000 + lastT.duration);
      // Sikkerhedsnet: hvis metadata-kaldet ovenfor fejlede, fanges korte videoer her
      if (totalSeconds > 0 && totalSeconds < MIN_DURATION_SECONDS) {
        console.log(`⏭️ Sprunget over: videoen er ${totalSeconds}s (under ${MIN_DURATION_SECONDS}s).`);
        return;
      }
      duration = formatDuration(totalSeconds);
    } catch (transcriptError) {
      console.log(`⚠️ Undertekster mangler for ${videoId}. Starter Plan B (Titel + Beskrivelse)...`);

      // PLAN B: Hent titel og beskrivelse via YouTube API
      const ytApiKey = process.env.YOUTUBE_API_KEY;
      if (!ytApiKey) throw new Error("Mangler YOUTUBE_API_KEY til Plan B.");

      const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${ytApiKey}`;
      const response = await fetch(ytUrl);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const snippet = data.items[0].snippet;
        const contentDetails = data.items[0].contentDetails;
        text = `Videotitel: ${snippet.title}\n\nVideobeskrivelse:\n${snippet.description}`;
        youtubeTitle = snippet.title;

        // Udregn varighed og afgør ud fra den om videoen er en Short
        if (contentDetails && contentDetails.duration) {
          const match = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const h = match[1] ? parseInt(match[1]) : 0;
          const m = match[2] ? parseInt(match[2]) : 0;
          const s = match[3] ? parseInt(match[3]) : 0;
          const totalSeconds = h * 3600 + m * 60 + s;
          if (totalSeconds > 0 && totalSeconds < MIN_DURATION_SECONDS) {
            console.log(`⏭️ Sprunget over: videoen er ${totalSeconds}s (under ${MIN_DURATION_SECONDS}s).`);
            return;
          }
          duration = formatDuration(totalSeconds);
        }
      } else {
        throw new Error("Kunne hverken hente undertekster eller videodata fra YouTube.");
      }
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

    const langResult = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(langCheckPrompt);
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
        const fk = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 8192, temperature: 0 } })
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

    // Shorts får kun en let metadata-prompt (title/tags/summary) - ingen dyr artikel- eller FAQ-generering
    const prompt = isShort
      ? `Act as a metadata generator for "Tech Feed Watch", a tech news site.
    Analyze this Short's content (transcript or title/description) and return EXACTLY in this format:
    TITLE: A concise, engaging headline
    TAGS: Choose 1-2 tags that best fit the video, ONLY from this exact list: AI & Tech, SEO, Automation, Coding, Business & Money, AI Video, Productivity, Fintech, Crypto, Cybersecurity. Return them comma-separated, e.g. 'SEO, AI Video'. Do not invent new tags.
    SUMMARY: A sharp 1-2 sentence summary of the Short.

    Video Content Data: ${text.substring(0, 5000)}`
      : `You are the Lead Tech Analyst and Senior Journalist for Tech Feed Watch, a premium tech media outlet covering AI, Tech, FinTech, and Crypto with unbiased, high-quality journalism. You have researched the subject by watching one video; its FACT SHEET is below. The facts from the source are the skeleton of the article; your explanation is the flesh around them. Before writing, silently identify the core topic and the 3-5 key concepts/keywords the subject revolves around. Then write a reference piece about that TOPIC: explain what the reader needs to understand, and anchor every section in the specific numbers, names and examples the source gives. Do not retell the video in its own order - but do use what it says.

    ${targetQuestion ? `THE READER'S QUESTION: someone searching Google typed "${targetQuestion}". That question is this article's job. Answer it plainly in the opening, then spend the article explaining the subject well enough that the answer holds up: what it is, why it works that way, what it costs, and where people get it wrong. The headline and at least one H2 must reflect the question. If the source material does not address it, still write about the subject — just do not invent an answer to the question.` : `Write about the subject itself, not about the video. A reader who never watches it must come away with a complete answer.`}

    Return EXACTLY in this format:
    TITLE: A headline of 40-62 characters that includes the primary keyword/topic the way people search for it. REQUIRED FORM: ${TITLE_FORMS[hashString(videoId + 'titelform') % TITLE_FORMS.length]} Never use an ampersand. Never open with any of these words (recent headlines already do): ${senesteAabningsord().join(', ') || '(none)'}. Be concrete and specific; search clarity comes first. NEVER use vague or poetic openers such as "Understanding", "Beyond", "The Quiet", "The Dawn of", "Rethinking", "Inside", "Unpacking", "Decoding", "Navigating", "Demystifying", "Unlocking", "Exploring", or "The New Frontier" - start with the subject or the question word.
    TAGS: Choose 1-2 tags that best fit the video, ONLY from this exact list: ${ALLOWED_TAGS.join(', ')}. Return them comma-separated, e.g. 'SEO, AI Video'. Do not invent new tags.
    SUMMARY: A sharp, analytical 3-4 sentence introduction or TL;DR.
    META: A single-line search meta description, MAX 155 characters, written to earn clicks in Google and naturally including the main keyword. Plain text, no quotes.
    FAQ:
    Generate exactly 3-4 frequently asked questions with concise answers based on the video content. Format each strictly as:
    Q: [question]
    A: [answer]
    Each answer max 2 sentences. Do not use markdown links in the answers.
    CONTENT:
    Write the article following these STRICT RULES:
    1. Objectivity is mandatory - do not hype any product or technology.
    2. No author bio, greetings, sign-offs, or affiliate disclaimers.
    3. Do NOT start with an H1 or the video title (the page already shows the title). Start directly with a 2-3 sentence executive summary paragraph, no label.
    4. Avoid commodity/listicle filler unless backed by real analysis.
    5. BANNED WORDS - never use: delve, tapestry, realm, navigate, landscape, testament, crucial, robust, demystify, unlock, unleash, elevate, seamless, paradigm shift, "in today's digital age", firstly, moreover, furthermore, "in conclusion".
    6. Write with high burstiness: mix short punchy sentences with longer analytical ones. Active voice only.
    7. Aim for approximately ${targetWords} words.
    8. Never use filler like "in this video" or "the video discusses", and never write "the source material", "the transcript" or "the source" - the reader does not know there is one. Write as an independent editorial piece. The one exception is rule 14: attribute the source ONCE, by the creator's name.
    8b. The transcript is machine-generated speech-to-text: a name may be misheard. A fact-sheet item marked "(spelling uncertain)" must NOT be used as a name - describe the thing generically instead ("a Nigerian savings app").
    9. Ensure internal links are written strictly like this: [Link text](/video/slug). Never use code formatting (backticks) anywhere - this is an article, not documentation.
    10. THE SUBJECT IS THE ARTICLE, NOT THE VIDEO. Write a reference piece about the topic itself, the way an experienced writer would if they had watched this video as part of their research. The video is one input, not the subject. A reader who never watches it must get a complete, self-contained answer.
    11. Most of the article must be explanation the reader needs, not recap: what the thing is, why it works that way, what it means in practice, what the trade-offs are, and what commonly goes wrong. For general context use only well-established facts; for specifics use the FACT SHEET (rule 14). NEVER fabricate statistics, quotes, dates, company figures or events - every number must come from the FACT SHEET or the source material, written exactly as the source gives it (no rounding, no converting); names may also be common knowledge.
    12. Draw on the source for its specific claims, examples and framing, and reflect them accurately - in your own words and structure. Do not follow the video's running order, do not quote long passages, and do not reproduce it section by section.
    13. Weave the core topic and its key concepts/keywords naturally into the headline, the H2 headings, and the body so the piece ranks for what readers actually search - but never keyword-stuff or repeat awkwardly.
    14. CONCRETE DETAIL IS MANDATORY. A reader must be able to tell this article was researched, not generated. Use at least FIVE items from the FACT SHEET below - every NUMBER item you can place naturally, plus named products, companies, tools or people, and at least one EXAMPLE item told as a concrete case. Write numbers exactly as the fact sheet gives them. Put them where they support the argument, not in a list at the end. Attribute the source exactly once, by name, where its most specific point appears - for example "As ${kildeNavn(channelTitle) || 'the creator'} points out, ..." or "${kildeNavn(channelTitle) || 'The creator'} puts the figure at ...". An article that ignores the fact sheet is a failed article.

    This article MUST follow the "${articleProfile.name}" format below - match its structure, length, and voice so it reads differently from a standard template.

    ${articleProfile.structure}
    ${internalLinksContext}

    FACT SHEET (every concrete detail the source gives, in the source's own words - your ingredient list for rule 14):
    ${faktaarkTekst(fakta)}

    SOURCE MATERIAL (research input — the transcript of one video on this subject).
    Use it for context, framing and the angles it contributes. Do not treat
    it as an outline to follow, and do not write about the video itself:
    ${text.substring(0, 20000)}`;

    // maxOutputTokens sat eksplicit. Uden den bruger modellen sin standard, og
    // gemini-2.5 bruger også af output-budgettet på at tænke. Prompten beder om
    // TITLE, TAGS, SUMMARY, META, FAQ og til sidst CONTENT — så når budgettet
    // slipper op, er brødteksten præcis dét der mangler, mens alt andet står
    // der. 25 artikler blev udgivet som tomme skaller på den måde, og andelen
    // voksede til tre ud af fire.
    // Svaret skal have en TITLE-linje og slutte af sig selv (STOP). Mangler
    // det, er det tilfældigt (målt 12/9: samme prompt gav svar i 2. forsøg),
    // så vi prøver én gang til, før kandidaten kasseres.
    let rawText = '';
    for (let forsoeg = 0; forsoeg < 2; forsoeg++) {
      const result = await genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { maxOutputTokens: 16384 },
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
          const rep = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 1024, temperature: 0.3 } })
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
    const safeSummary = fjernForbudteOrd((summaryMatch ? summaryMatch[1] : "").replace(/"/g, "'").replace(/\n/g, " ").trim());
    // Kort meta-beskrivelse til Google (~155 tegn). Falder tilbage til trunkeret summary hvis META mangler.
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
        const igen = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 16384 } }).generateContent(prompt);
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
      const status = () => {
        const brugte = brugteFakta(content, fakta);
        const ukendte = ukendteTal(content, fakta, text);
        const m = [];
        if (brugte.length < MIN_BRUGT) m.push(`kun ${brugte.length} af ${fakta.length} punkter fra arket brugt (mindst ${MIN_BRUGT})`);
        if (ukendte.length) m.push(`tal uden dækning i kilden: ${ukendte.join(', ')}`);
        if (manglerKonkret(content, channelTitle).includes('kilde')) m.push('kilden ikke nævnt ved navn');
        return { brugte, ukendte, m };
      };
      let k = status();
      if (k.m.length) {
        console.log(`🔎 Kontrol mod faktaarket: ${k.m.join(' · ')} — beder om rettelse`);
        const ubrugte = fakta.filter((f) => !k.brugte.includes(f)).slice(0, 12);
        try {
          const rep = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 16384, temperature: 0.3 } })
            .generateContent(`Revise the article below. Keep its structure, headings, length and links. Change ONLY what is needed to satisfy these requirements:
1. Work at least ${Math.max(MIN_BRUGT, 5)} items from the FACT SHEET into the text, where they support the argument (not as a list). Write every number exactly as the fact sheet gives it.
${k.ukendte.length ? `2. These numbers appear in the article but NOT in the source: ${k.ukendte.join(', ')}. Remove each of them or replace it with a number from the FACT SHEET. Do not keep any figure the source does not give.\n` : ''}3. Attribute the source exactly once, by name: "${kildeNavn(channelTitle) || 'the creator'}" (for example "As ${kildeNavn(channelTitle) || 'the creator'} points out, ...").
Never invent numbers or names. Keep every existing H2 heading exactly as it is. Output ONLY the revised article in markdown - no fact sheet, no commentary, no preamble.

FACT SHEET (items not yet used are listed first):
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
      console.log(k.m.length
        ? `🔎 Stadig: ${k.m.join(' · ')} — udgives alligevel, tælles i audit`
        : `🔎 Kontrol ok: ${k.brugte.length} af ${fakta.length} punkter fra arket brugt, ${taelTal(content)} tal, kilden nævnt`);

      // Interne links: ankertekst skal passe til målet (se ankerTjek).
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
    }

    // Ved omskrivning beholdes den oprindelige udgivelsesdato; rewrittenAt viser hvornår.
    const date = erstatGammel?.date || new Date().toISOString().split('T')[0];
    const rewrittenYaml = erstatGammel ? `rewrittenAt: "${new Date().toISOString().split('T')[0]}"\n` : "";

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

    const markdown = `---\ntitle: "${safeTitle}"\nyoutubeId: "${videoId}"\n${sourceYaml}date: "${date}"\n${tagsYaml}summary: "${safeSummary}"\n${metaYaml}${questionYaml}duration: "${duration}"\n${viewsYaml}isShort: ${isShort}\n${rewrittenYaml}${faqsYaml}---\n\n${content}\n`;

    if (!fs.existsSync('./src/content/videos')) { fs.mkdirSync('./src/content/videos', { recursive: true }); }
    fs.writeFileSync(`./src/content/videos/${slug}.md`, markdown);
    console.log(`✅ Succes! Fil oprettet: ${slug}.md (varighed ${duration}).`);
    // Lav delekort til sociale medier (fejler stille - videoen er allerede oprettet)
    await generateOgCard(videoId, slug);
  } catch (error) {
    console.log("❌ Fejl:", error.message);
  }
}

run();