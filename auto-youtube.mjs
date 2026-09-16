import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import { hentForslag } from './src/lib/suggest.mjs';
import { faellesOrd } from './src/lib/question.mjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// (De gamle TOPIC_CLUSTERS er fjernet. De var 12 klynger mod 10 mærker, og
// forbindelsen mellem "hvad vi søgte på" og "hvilket mærke artiklen fik" blev
// smidt væk efter søgningen. Søgeemnerne bor nu i TOPIC_BY_TAG længere nede,
// ét pr. mærke, så de to ikke kan komme ud af sync.)

// Kuraterede kvalitetskanaler. Robotten henter også fra én roterende kanal pr. kørsel, kombineret med
// dagens emneklynge, så indholdet holder sig på-emne. Alle channelId er verificeret via YouTube API.
const CHANNELS = [
  { id: 'UCAuUUnT6oDeKwE6v1NGQxug', name: 'TED' },
  { id: 'UCcefcZRL2oaA_uBNeo5UOWg', name: 'Y Combinator' },
  { id: 'UCSHZKyawb77ixDdsGog4iWA', name: 'Lex Fridman' },
  { id: 'UC9cn0TuPq4dnbTY-CBsm8XA', name: 'a16z' },
  { id: 'UCbfYPyITQ-7l4upoX8nvctg', name: 'Two Minute Papers' },
  { id: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship' },
  { id: 'UCqK_GSMbpiV8spgD3ZGloSw', name: 'Coin Bureau' },
  { id: 'UCknLrEdhRCp1aegoMqRaCZg', name: 'DW News' },
  { id: 'UCrM7B7SL_g1edFOnmj-SDKg', name: 'Bloomberg Tech' },
  { id: 'UCIALMKvObZNtJ6AmdCLP7Lg', name: 'Bloomberg Television' },
  { id: 'UCUMZ7gohGI9HcU9VNsr2FJQ', name: 'Bloomberg Originals' },
  { id: 'UCEAZeUIeJs0IjQiqTCdVSIg', name: 'Yahoo Finance' },
  { id: 'UC_fyAp919RnkKmBrMXGwnUQ', name: 'Google Career Certificates' },
  { id: 'UCeeFfhMcJa1kjtfZAGskOCA', name: 'TechLinked' },
  // Nye høj-CPC / analyse-tunge kanaler. ID'er opløses fra @handle ved kørsel (forHandle),
  // så en evt. forkert handle bare springes pænt over uden at stoppe robotten.
  { handle: '@mreflow', name: 'Matt Wolfe' },
  { handle: '@matthew_berman', name: 'Matthew Berman' },
  { handle: '@IBMTechnology', name: 'IBM Technology' },
  { handle: '@ColdFusion', name: 'ColdFusion' },
  { handle: '@GrahamStephan', name: 'Graham Stephan' },
  { handle: '@CNBC', name: 'CNBC' },
  { handle: '@AhrefsCom', name: 'Ahrefs' },
  { handle: '@NetworkChuck', name: 'NetworkChuck' },
];

// Højst én artikel pr. kørsel. Det er med vilje: med 3 pr. kørsel og et lavt
// dagsloft blev hele dagens output udgivet i de første par kørsler, og dermed
// hentet fra den ene eller to kanaler og emneklynger, som netop de kørsler ramte.
// Med 1 pr. kørsel fordeles dagens artikler over fire forskellige tidspunkter,
// kanaler og klynger.
const MAX_NORMAL_PER_RUN = 1;

// Dagligt udgivelsesLOFT — ikke et mål. Loftet varierer deterministisk med
// datoen (samme dag = samme loft på tværs af døgnets kørsler, uden delt
// hukommelse): hverdage 2-5 artikler, weekend 1-3. Præcis
// fire artikler hver eneste dag var et maskinaftryk; rigtige redaktioner
// svinger og udgiver mindre i weekenden. Kvaliteten bestemmer stadig: godkender
// kontrollerne kun én video en dag med loft 5, udgives én. En dag med 0 er OK.
function dagensLoft() {
  const nu = new Date();
  const dato = nu.toISOString().split('T')[0];
  let h = 0;
  for (let i = 0; i < dato.length; i++) h = (Math.imul(31, h) + dato.charCodeAt(i)) | 0;
  h = Math.abs(h);
  const ugedag = nu.getUTCDay(); // 0 = søndag, 6 = lørdag
  // Max 5 om dagen (Jacob, 15/9) — før kunne hverdage give 6.
  const muligheder = (ugedag === 0 || ugedag === 6) ? [1, 2, 3] : [2, 3, 4, 5];
  return muligheder[h % muligheder.length];
}
const MAX_PER_DAY = dagensLoft();

// Friskheds-vindue: kun videoer nyere end dette, så feedet føles aktuelt. Nem at justere.
const FRESHNESS_DAYS = 180;
const PUBLISHED_AFTER = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

// Ét søgeemne pr. mærke — de samme mærker som artiklerne bruger, så en søgning
// altid kan oversættes direkte til ét mærke. Tidligere var der 12 emneklynger
// og 10 mærker, og forbindelsen mellem dem blev smidt væk efter søgningen.
// "|" betyder ELLER i YouTube-søgningen.
const TOPIC_BY_TAG = {
  "AI & Tech": "AI|artificial intelligence|machine learning|LLM|ChatGPT|Claude|Gemini|OpenAI|AI agents|robotics|smart glasses|AR|VR|cloud computing|AWS|Azure|Kubernetes|DevOps",
  "Business & Money": "personal finance|investing|stock market|index funds|passive income|retirement planning|wealth building|ecommerce|Shopify|dropshipping|online business|digital products|startup",
  "Fintech": "fintech|financial technology|neobank|digital banking|payments|stablecoins|algorithmic trading|open banking|AI in finance|core banking",
  "Automation": "workflow automation|AI automation|no-code|n8n|Zapier|business process automation|agentic workflows|RPA|automated pipelines",
  "Crypto": "cryptocurrency|crypto|bitcoin|ethereum|solana|DeFi|blockchain|Web3|smart contracts|tokenization|altcoins",
  "Coding": "coding|programming|software engineering|Python|JavaScript|developer tools|vibe coding|AI coding|open source|system design",
  "Productivity": "productivity|AI assistant|Notion|NotebookLM|second brain|note taking|AI workflow|digital productivity|knowledge management",
  "SEO": "SEO|search engine optimization|generative engine optimization|AEO|technical SEO|link building|content strategy|Google ranking",
  "Cybersecurity": "cybersecurity|infosec|data breach|ransomware|zero trust|network security|ethical hacking|penetration testing|cloud security|AI security",
  "AI Video": "AI video|text to video|Sora|Runway|Veo|Kling|AI filmmaking|Midjourney|AI image generation|AI content creation",
  // Kvante og hardware er egne emner, ikke undergrupper af AI. Kvantecomputere
  // har intet med sprogmodeller at gøre, og chips er sin egen industri med sin
  // egen søgning. De blev udskilt fra AI & Tech-paraplyen, hvor de lå begravet.
  "Quantum Computing": "quantum computing|qubit|quantum supremacy|quantum advantage|post-quantum cryptography|quantum hardware|QPU|quantum error correction",
  "Hardware & Chips": "AI chips|semiconductors|GPU|TPU|Nvidia|data center|AI infrastructure|chip manufacturing|foundry|silicon|compute costs|edge AI hardware",
  // AR/VR laa spredt under AI & Tech og Productivity, hvor ingen fandt dem.
  // 19 artikler — flere end Hardware & Chips havde da det blev skilt ud.
  "AR & VR": "augmented reality|virtual reality|mixed reality|smart glasses|spatial computing|AR glasses|VR headset|immersive technology",
};

// Tæller hvor mange artikler der bærer hvert mærke. Bruges til at vælge det
// mærke der halter bagud, så fordelingen retter sig selv over tid.
function countArticlesByTag() {
  const dir = './src/content/videos';
  const counts = Object.fromEntries(Object.keys(TOPIC_BY_TAG).map((t) => [t, 0]));
  if (!fs.existsSync(dir)) return counts;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const block = content.match(/^tags:\r?\n((?:\s*-\s*.*\r?\n?)*)/m);
    if (!block) continue;
    for (const line of block[1].split(/\r?\n/)) {
      const tag = line.replace(/^\s*-\s*/, '').replace(/^"|"$/g, '').trim();
      if (tag in counts) counts[tag]++;
    }
  }
  return counts;
}

// Vælger det mærke med færrest artikler. Ved uafgjort afgør klokkeslættet, så
// to kørsler i træk ikke rammer det samme. Det erstatter den gamle vægtede
// rotation, der med vilje favoriserede høj-CPC-emner og dermed holdt de tynde
// emner tynde.
function pickThinnestTag(counts) {
  const min = Math.min(...Object.values(counts));
  const tied = Object.keys(counts).filter((t) => counts[t] === min);
  const slot = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % tied.length;
  return tied[slot];
}

// Henter spørgsmål fra Googles autocomplete og vælger ét vi ikke har brugt før.
//
// Emnet i TOPIC_BY_TAG er en søgestreng med lodrette streger ("AI|machine
// learning|LLM"). Autocomplete skal have almindelig tekst, så vi tager det
// første led — resten er alternativer til YouTube-søgningen, ikke til Google.
//
// Brugte spørgsmål gemmes, så robotten ikke skriver om det samme igen. Filen
// er lille: ét spørgsmål pr. artikel.
async function vaelgSpoergsmaal(tag, topic) {
  const BRUGTE = 'src/data/used-questions.json';
  let brugte = [];
  if (fs.existsSync(BRUGTE)) {
    try { brugte = JSON.parse(fs.readFileSync(BRUGTE, 'utf8')); } catch { brugte = []; }
  }
  const set = new Set(brugte.map((x) => x.q));

  const frø = String(topic).split('|')[0].trim();
  let forslag = [];
  try {
    forslag = await hentForslag(frø);
  } catch (e) {
    console.log(`Info: autocomplete svarede ikke (${e.message}) — fortsætter uden.`);
    return null;
  }

  let ubrugte = forslag.filter((s) => !set.has(s));
  if (!ubrugte.length) return null;

  // Gemini som redaktør: hvilke af forslagene er rigtige, klare spørgsmål,
  // man kan skrive en artikel om? Autocomplete gav 12/9 "how are ai chips
  // cooked" (slang for "færdige"), og overskrifts-værnet tvang ordet ind i
  // overskriften. Ét billigt kald pr. kørsel; fejler det, bruges listen som den er.
  if (process.env.GEMINI_API_KEY && ubrugte.length > 1) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const prompt = `Below is a numbered list of Google autocomplete searches. Which of them are clear, plain-English informational questions that a reference article could answer well? EXCLUDE any that use slang or meme language (e.g. "cooked", "goated"), that are jokes, that are ambiguous, that ask for a price, a purchase, a login or a job, or that only make sense for one person's situation. Return ONLY a JSON array of the numbers to keep, e.g. [1,3,4].\n\n${ubrugte.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
      const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 512, temperature: 0 } }).generateContent(prompt);
      const m = (r.response.text() || '').match(/\[[\d,\s]*\]/);
      if (m) {
        const behold = new Set(JSON.parse(m[0]).map((n) => n - 1));
        const godkendte = ubrugte.filter((_, i) => behold.has(i));
        const afviste = ubrugte.filter((_, i) => !behold.has(i));
        if (afviste.length) console.log(`Info: Spørgsmål afvist som uklare/slang: ${afviste.map((s) => `"${s}"`).join(', ')}`);
        if (godkendte.length) ubrugte = godkendte;
      }
    } catch (e) {
      console.log(`Info: spørgsmåls-tjek fejlede (${e.message}) — bruger listen som den er.`);
    }
  }

  // Klokkeslættet (timen) vælger, så to kørsler i træk ikke nødvendigvis
  // tager det samme spørgsmål, hvis den første ikke fik udgivet noget.
  const valgt = ubrugte[Math.floor(Date.now() / (1000 * 60 * 60)) % ubrugte.length];
  // Spørgsmålet gemmes IKKE her — først når en artikel faktisk er udgivet
  // (se markerSpoergsmaalBrugt). Målt 15/9: kørsel #523 brugte "what is ai
  // video specialist" op uden artikel, fordi YouTube blokerede alle videoer.
  return valgt;
}

// Gemmer spørgsmålet som brugt. Kaldes kun, når en artikel er skrevet.
function markerSpoergsmaalBrugt(q, tag) {
  const BRUGTE = 'src/data/used-questions.json';
  let brugte = [];
  try { brugte = JSON.parse(fs.readFileSync(BRUGTE, 'utf8')); } catch { brugte = []; }
  if (brugte.some((x) => x.q === q)) return;
  brugte.push({ q, tag, dato: new Date().toISOString().slice(0, 10) });
  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync(BRUGTE, JSON.stringify(brugte, null, 1) + '\n', 'utf8');
}

// Vælger kanal ud fra tidspunktet, så hver kørsel også tager næste kanal i rækken (roterer uafhængigt af klynger).
function pickChannel() {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % CHANNELS.length;
  return CHANNELS[idx];
}

async function searchVideos(query, { videoDuration, order, maxResults }) {
  const params = new URLSearchParams({
    part: 'snippet',
    videoCategoryId: '28',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    regionCode: 'US',
    videoDuration,
    order,
    publishedAfter: PUBLISHED_AFTER,
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}

// Opløser en @handle til et UC-kanal-ID via YouTube API (kanaler tilføjet med handle i stedet for fast id).
// Returnerer null ved fejl/ukendt handle, så robotten bare fortsætter med de øvrige søgninger.
async function resolveChannelId(handle) {
  const h = handle.startsWith('@') ? handle : '@' + handle;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(h)}&key=${YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items?.[0]?.id || null;
  } catch (e) {
    return null;
  }
}

// Henter videoer fra én specifik kanal, kombineret med dagens emne-query så vi holder os på-emne.
// Intet kategori-filter her (kanaler som TED spænder bredt) - engelsk-filter + Gemini-tjek fanger resten.
async function searchChannel(channelId, query, maxResults) {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    regionCode: 'US',
    order: 'relevance',
    publishedAfter: PUBLISHED_AFTER,
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}

// Ekstra opslag pr. video for at filtrere hårdere på engelsk lyd, før add-video.mjs kaldes
async function isEnglishAudio(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  const snippet = data.items?.[0]?.snippet;
  const lang = snippet?.defaultAudioLanguage || snippet?.defaultLanguage;

  if (lang && !lang.toLowerCase().startsWith('en')) {
    console.log(`ℹ️ Sprunget over: ikke-engelsk lyd (${lang}) for ${videoId}`);
    return false;
  }
  return true; // Sprog ukendt -> lad add-video.mjs's Gemini-tjek afgøre det
}

// Bygger ét sæt af youtubeIds der allerede findes i src/content/videos, ved at læse frontmatter
// i alle .md-filer. Filnavnet er nu en titel-slug, ikke videoId, så fs.existsSync(`${videoId}.md`)
// virker ikke længere - vi må slå youtubeId op inde i filerne i stedet.
function loadExistingVideoIds() {
  const dir = './src/content/videos';
  const ids = new Set();
  if (!fs.existsSync(dir)) return ids;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const match = content.match(/youtubeId:\s*"(.*?)"/);
    if (match) ids.add(match[1]);
  }
  return ids;
}

// Tæller hvor mange artikler der allerede er udgivet i dag, så MAX_PER_DAY kan
// håndhæves på tværs af døgnets 12 kørsler. Datoen læses fra frontmatter, som
// add-video.mjs sætter til udgivelsesdagen i UTC.
function countPublishedToday() {
  const dir = './src/content/videos';
  if (!fs.existsSync(dir)) return 0;

  const today = new Date().toISOString().split('T')[0];
  let count = 0;

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const match = content.match(/^date:\s*"(.*?)"/m);
    if (match && match[1] === today) count++;
  }
  return count;
}

// Fjerner dubletter på videoId. `seen` deles på tværs af kald, så normale og shorts aldrig overlapper.
function dedupeById(items, seen) {
  return items.filter(item => {
    const videoId = item.id?.videoId;
    if (!videoId || seen.has(videoId)) return false;
    seen.add(videoId);
    return true;
  });
}

// Behandler op til maxCount videoer fra én gruppe (normale ELLER shorts). Robottens links er altid /watch?v=.
// spoergsmaal sendes med som parameter — den var tidligere refereret fra ydre
// scope og fandtes ikke her: ReferenceError på hver eneste kandidat, 20 grønne
// kørsler uden én artikel. Fundet ved lokal kørsel 23/8.
//
// Bedste kandidat, ikke første (12/9): før blev den første video, der slap
// gennem kontrollerne, til dagens artikel — uanset om nummer to var langt
// rigere på fakta. Nu laves faktaark for op til KANDIDATER videoer (billige
// kald: transskript + sprogtjek + relevans + faktaark), og artiklen skrives
// kun for den med flest konkrete punkter. Falder den igennem (fx tal uden
// dækning), prøves den næstbedste.
const KANDIDATER = 4;

function faktaarkScoreFor(videoUrl, tag, qArg) {
  try {
    const ud = execSync(`node add-video.mjs "${videoUrl}" --tag "${tag}"${qArg} --faktaark-only`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    process.stdout.write(ud.split('\n').map((l) => '   │ ' + l).join('\n') + '\n');
    const m = ud.match(/FAKTAARK-SCORE:\s*(\d+)/);
    const score = m ? Number(m[1]) : 0;
    // Blokeret = YouTube droslede OG gav til sidst ingen undertekster. Det er
    // ikke videoens skyld men serverens adresse, så de næste kandidater er
    // blokeret med. Kalderen stopper kørslen efter to i træk.
    const blokeret = /drosler/.test(ud) && /ingen undertekster/.test(ud);
    // Afvist af et værn (sprog, relevans, for tynd) = ubrugelig, uanset score.
    return { score: /Sprunget over/.test(ud) ? 0 : score, blokeret };
  } catch (e) {
    console.log(`   │ faktaark fejlede: ${e.message.split('\n')[0]}`);
    return { score: 0, blokeret: false };
  }
}

async function processGroup(items, label, maxCount, existingIds, tag, spoergsmaal) {
  let processed = 0;
  const qArg = spoergsmaal ? ` --question "${spoergsmaal.replace(/"/g, '')}"` : '';

  // Første sigte: dubletter og ikke-engelsk lyd væk, så vi ikke betaler for dem.
  const kandidater = [];
  for (const item of items) {
    if (kandidater.length >= KANDIDATER) break;
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    // Filnavnet er en titel-slug, ikke videoId - tjekker derfor mod det forudindlæste sæt af
    // youtubeIds i stedet for fs.existsSync(`${videoId}.md`)
    if (existingIds.has(videoId)) {
      console.log(`ℹ️ Springer over: Video ${videoId} er allerede udgivet.`);
      continue;
    }
    // Gratis for-tjek (ingen ventetid, ingen modelkald): deler videoens titel
    // eller beskrivelse ikke ét eneste kerneord med spørgsmålet, er den nok ikke
    // svaret. Målt 15/9 (#523): to DeepSeek-videoer fik 12 min hver for
    // spørgsmålet "what is ai video specialist" og karakter 0 og 1.
    // "ai" og "tech" tæller ikke — dem deler alt (samme regel som ankerTjek).
    const spmUdenAi = (spoergsmaal || '').replace(/\b(ai|tech)\b/gi, ' ').trim();
    if (spmUdenAi && /[a-z]{3,}/i.test(spmUdenAi)) {
      const tekst = `${item.snippet?.title || ''} ${item.snippet?.description || ''}`;
      if (faellesOrd(spmUdenAi, tekst) === 0) {
        console.log(`ℹ️ Springer over: "${item.snippet?.title}" deler intet kerneord med spørgsmålet (${videoId}).`);
        continue;
      }
    }
    if (!(await isEnglishAudio(videoId))) continue;
    kandidater.push(videoId);
  }

  // Andet sigte: faktaark for hver, rangeret efter score.
  // Blokerer YouTube to kandidater i træk (12 min ventetid hver), er resten
  // også blokeret — så stopper vi i stedet for at spilde 48 min. Målt 15/9:
  // kørsel #523 og #525 ventede 4 x 12 min på ingenting.
  const rangeret = [];
  let blokeretITraek = 0;
  for (const videoId of kandidater) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`🔎 Vurderer kandidat: ${videoUrl}`);
    const { score, blokeret } = faktaarkScoreFor(videoUrl, tag, qArg);
    console.log(`   score ${score}`);
    if (score > 0) rangeret.push({ videoId, score });
    blokeretITraek = blokeret ? blokeretITraek + 1 : 0;
    if (blokeretITraek >= 2 && !rangeret.length) {
      console.log('⛔ YouTube blokerer undertekster fra denne server — stopper kørslen her (2 kandidater i træk uden undertekster).');
      break;
    }
  }
  rangeret.sort((a, b) => b.score - a.score);
  if (rangeret.length) console.log(`Info: Rangering: ${rangeret.map((r) => `${r.videoId} (${r.score})`).join(' · ')}`);
  else console.log('Info: Ingen af kandidaterne bestod kontrollerne.');

  for (const { videoId } of rangeret) {
    if (processed >= maxCount) break;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`▶️ Behandler NY ${label}: ${videoUrl}`);

    try {
      // Mærket sendes med, så artiklen havner under det emne robotten ledte efter.
      execSync(`node add-video.mjs "${videoUrl}" --tag "${tag}"${qArg}`, { stdio: 'inherit' });
      // add-video kan afvise (sprogtjek, tyndt transskript) og alligevel slutte
      // pænt. Kun en faktisk skrevet artikel tæller mod dagens loft — ellers
      // æder afvisninger budgettet, og næste kandidat får aldrig chancen.
      if (loadExistingVideoIds().has(videoId)) {
        processed++;
        existingIds.add(videoId); // undgår dubletbehandling inden for samme kørsel
        if (spoergsmaal) markerSpoergsmaalBrugt(spoergsmaal, tag); // først NU er spørgsmålet brugt
      } else {
        console.log(`ℹ️ Kandidat afvist af kvalitetsværn — prøver næste.`);
      }
    } catch (subError) {
      console.error(`❌ Fejl ved oprettelse af video ${videoId}:`, subError.message);
    }
  }

  return processed;
}

async function findNewestVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  // node auto-youtube.mjs --dry-run: viser fordelingen og hvad der ville blive
  // valgt, uden at bruge et eneste API-kald eller udgive noget. Ligger FØR
  // dagsloftet, så man kan tjekke fordelingen selv når dagens kvote er brugt.
  if (process.argv.includes('--dry-run')) {
    const dryCounts = countArticlesByTag();
    console.log('TØRT LØB — intet udgives.\n');
    for (const [t, n] of Object.entries(dryCounts).sort((a, b) => a[1] - b[1])) {
      console.log(`  ${String(n).padStart(4)}  ${t}`);
    }
    const dryTag = pickThinnestTag(dryCounts);
    console.log(`\nVille vælge mærket: "${dryTag}"`);

    // Spørgsmålet hentes også i det tørre løb — ellers tester man kun halvdelen
    // af kæden. Autocomplete koster ingenting og kræver ingen nøgle.
    // --keep gemmer valget; uden det rulles filen tilbage, så et tjek ikke
    // bruger et spørgsmål op.
    const foer = fs.existsSync('src/data/used-questions.json')
      ? fs.readFileSync('src/data/used-questions.json', 'utf8') : null;
    const q = await vaelgSpoergsmaal(dryTag, TOPIC_BY_TAG[dryTag]);
    if (!process.argv.includes('--keep')) {
      if (foer === null) fs.rmSync('src/data/used-questions.json', { force: true });
      else fs.writeFileSync('src/data/used-questions.json', foer, 'utf8');
    }
    console.log(`Ville søge på:   "${q || TOPIC_BY_TAG[dryTag]}"`);
    console.log(q ? '                 (spørgsmål fra autocomplete)' : '                 (emnet alene — intet spørgsmål fundet)');
    return;
  }

  // Dagsloftet tjekkes FØRST, så en kørsel over kvoten ikke bruger API-kald.
  // --ignorer-loft: kun til lokale testkørsler af selve kæden (kandidater →
  // faktaark → artikel), når dagens kvote allerede er brugt. Robotten på
  // GitHub kører aldrig med flaget.
  const publishedToday = countPublishedToday();
  if (publishedToday >= MAX_PER_DAY && !process.argv.includes('--ignorer-loft')) {
    console.log(`⏸️ Dagsloftet er nået: ${publishedToday}/${MAX_PER_DAY} artikler udgivet i dag. Springer denne kørsel over.`);
    return;
  }
  const remainingToday = MAX_PER_DAY - publishedToday;
  // Aldrig flere end der er tilbage af dagens kvote.
  const runBudget = process.argv.includes('--ignorer-loft') ? MAX_NORMAL_PER_RUN : Math.min(MAX_NORMAL_PER_RUN, remainingToday);

  const counts = countArticlesByTag();
  const tag = pickThinnestTag(counts);
  const topic = TOPIC_BY_TAG[tag];

  // Emnet siger HVAD vi skriver om. Spørgsmålet siger hvad nogen faktisk
  // søger på inden for emnet. Uden det valgte robotten et emne, fandt en
  // video, og skrev en artikel uden at nogen i kæden spurgte om der var
  // efterspørgsel. Fejler opslaget, kører vi videre på emnet alene — det er en
  // forbedring, ikke en forudsætning.
  const spoergsmaal = await vaelgSpoergsmaal(tag, topic);
  const soegetekst = spoergsmaal || topic;
  if (spoergsmaal) console.log(`Info: Spørgsmål fra autocomplete: "${spoergsmaal}"`);
  else console.log('Info: Intet ubrugt spørgsmål fundet — søger på emnet alene.');

  const channel = pickChannel();
  // Kanaler kan være defineret med fast id ELLER @handle (opløses her ved kørsel via forHandle).
  const channelId = channel.id || (channel.handle ? await resolveChannelId(channel.handle) : null);
  console.log(`Info: Udgivet i dag: ${publishedToday}/${MAX_PER_DAY} — plads til ${runBudget} i denne kørsel.`);
  console.log(`Info: Fordeling: ${Object.entries(counts).sort((a, b) => a[1] - b[1]).map(([t, n]) => `${t} ${n}`).join(' · ')}`);
  console.log(`Info: Vælger emnet der halter mest: "${tag}" (${counts[tag]} artikler)`);
  console.log(`Info: Vælger kanal: "${channel.name}"${channel.handle ? ` (${channel.handle} -> ${channelId || 'intet id'})` : ''}`);

  try {
    // Henter videoer fra Kategori 28. safeSearch er fjernet for at undgå blokering af tech-nyheder.
    // Medium + long (begge efter relevans) + én roterende kvalitetskanal.
    // Korte videoer søges ikke længere — de gav sider uden brødtekst.
    const [mediumVideos, longVideos, channelVideos] = await Promise.all([
      searchVideos(soegetekst, { videoDuration: 'medium', order: 'relevance', maxResults: 5 }),
      searchVideos(soegetekst, { videoDuration: 'long', order: 'relevance', maxResults: 5 }),
      searchChannel(channelId, soegetekst, 3),
    ]);

    const seen = new Set();
    // Spørgsmålets egne søgeresultater først, kanalens videoer SIDST. Før stod
    // kanalen forrest og fik de første (dyre) pladser, selv når dens videoer
    // ikke handlede om spørgsmålet (målt 15/9, #522/#523: Y Combinator og
    // Two Minute Papers gav kandidater uden om spørgsmålet).
    const normalItems = dedupeById([...mediumVideos, ...longVideos, ...channelVideos], seen);

    if (normalItems.length === 0) {
      console.log("ℹ️ Info: Fandt ingen videoer (eller API'en afviste søgningen).");
      return;
    }

    console.log(`Info: Fandt ${normalItems.length} kandidater. Behandler maks ${runBudget}...`);

    const existingIds = loadExistingVideoIds();
    const processed = await processGroup(normalItems, 'video', runBudget, existingIds, tag, spoergsmaal);

    console.log(`✅ Succes: Robot-kørsel er færdig. ${processed} artikler behandlet (${publishedToday + processed}/${MAX_PER_DAY} i dag).`);
    // Faktaark-filerne fra kandidatvurderingen er kun mellemregninger (git ignorerer dem).
    for (const f of fs.readdirSync('.').filter((x) => /^_faktaark-.*\.json$/.test(x))) fs.rmSync(f, { force: true });
  } catch (error) {
    console.error("❌ Kritisk fejl under kontakt til YouTube:", error.message);
  }
}

findNewestVideos();
