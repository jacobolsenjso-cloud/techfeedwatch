import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Otte emneklynger (én pr. hovedemne). Robotten roterer mellem dem, så alle dækkes i løbet af dagen.
// "|" betyder ELLER i YouTube-søgningen, så hver klynge matcher videoer med et af ordene.
const TOPIC_CLUSTERS = [
  // AI & Tech
  "AI|artificial intelligence|machine learning|LLM|ChatGPT|Claude|Gemini|OpenAI|generative AI|AI agents|AGI",
  // Tech / hardware
  "tech|technology|tech news|quantum computing|GPU|semiconductors|AI chips|robotics|smart glasses|spatial computing|AR|VR",
  // Coding
  "coding|programming|software engineering|Python|JavaScript|developer tools|vibe coding|AI coding|open source",
  // SEO & Automation
  "SEO|search engine optimization|generative engine optimization|AEO|no-code|workflow automation|AI automation|n8n|SaaS",
  // AI Video & AI image
  "AI video|text to video|Sora|Runway|Veo|Kling|AI filmmaking|Midjourney|AI image generation|AI content creation",
  // Productivity
  "productivity|AI assistant|Notion|NotebookLM|second brain|note taking|AI workflow|automation tools|digital productivity",
  // Business & Money + Fintech
  "fintech|financial technology|neobank|digital banking|payments|stablecoins|algorithmic trading|open banking|AI in finance|startup",
  // Crypto
  "cryptocurrency|crypto|bitcoin|ethereum|solana|DeFi|blockchain|Web3|smart contracts|tokenization|altcoins",
  // Cybersecurity (høj CPC)
  "cybersecurity|infosec|data breach|ransomware|zero trust|network security|ethical hacking|penetration testing|cloud security|AI security",
  // Cloud & SaaS (høj CPC)
  "cloud computing|AWS|Azure|Google Cloud|Kubernetes|DevOps|serverless|SaaS|enterprise software|data engineering",
  // Personlig økonomi & investering (høj CPC)
  "personal finance|investing|stock market|index funds|passive income|retirement planning|wealth building|dividends|financial freedom|money management",
  // E-commerce & online business (høj CPC)
  "ecommerce|Shopify|dropshipping|online business|Amazon FBA|digital products|print on demand|online store|D2C|selling online",
];

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

const MAX_NORMAL_PER_RUN = 3;
const MAX_SHORTS_PER_RUN = 1;

// Friskheds-vindue: kun videoer nyere end dette, så feedet føles aktuelt. Nem at justere.
const FRESHNESS_DAYS = 180;
const PUBLISHED_AFTER = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

// Vægtet rotation mod høj-CPC-emner. Tallene er indeks ind i TOPIC_CLUSTERS (0-11).
// Høj CPC rammes oftest: fintech(6), crypto(7), SEO/automation(3), cybersikkerhed(8),
// cloud/SaaS(9), privatøkonomi(10), e-commerce(11) og AI(0). Alle 12 emner er dog stadig med.
const TOPIC_ROTATION = [0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];

// Vælger klynge ud fra tidspunktet via den vægtede rotation, så en 2-timers kørsel tager næste i rækken.
function pickTopicCluster() {
  const slot = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % TOPIC_ROTATION.length;
  return TOPIC_CLUSTERS[TOPIC_ROTATION[slot]];
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
async function processGroup(items, label, maxCount, existingIds) {
  let processed = 0;

  for (const item of items) {
    if (processed >= maxCount) break;

    const videoId = item.id?.videoId;
    if (!videoId) continue;

    // Filnavnet er en titel-slug, ikke videoId - tjekker derfor mod det forudindlæste sæt af
    // youtubeIds i stedet for fs.existsSync(`${videoId}.md`)
    if (existingIds.has(videoId)) {
      console.log(`ℹ️ Springer over: Video ${videoId} er allerede udgivet.`);
      continue;
    }

    const englishOk = await isEnglishAudio(videoId);
    if (!englishOk) continue;

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`▶️ Behandler NY ${label}: ${videoUrl}`);

    try {
      execSync(`node add-video.mjs "${videoUrl}"`, { stdio: 'inherit' });
      processed++;
      existingIds.add(videoId); // undgår dubletbehandling inden for samme kørsel
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

  const topic = pickTopicCluster();
  const channel = pickChannel();
  // Kanaler kan være defineret med fast id ELLER @handle (opløses her ved kørsel via forHandle).
  const channelId = channel.id || (channel.handle ? await resolveChannelId(channel.handle) : null);
  // Shorts tjener ikke penge (noindex, ingen annoncer), så de laves kun hver 3. kørsel (~hver 6. time).
  // Sparer samtidig API-kvote de øvrige kørsler, hvor short-søgningen springes helt over.
  const isShortsRun = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % 3 === 0;
  console.log(`Info: Vælger emneklynge: "${topic}"`);
  console.log(`Info: Vælger kanal: "${channel.name}"${channel.handle ? ` (${channel.handle} -> ${channelId || 'intet id'})` : ''}`);
  console.log(`Info: Shorts denne kørsel: ${isShortsRun ? 'JA' : 'nej'}`);

  try {
    // Henter videoer fra Kategori 28. safeSearch er fjernet for at undgå blokering af tech-nyheder.
    // Normale: medium (relevance) + long (date) + én roterende kvalitetskanal. Shorts: kun hver 3. kørsel.
    const [mediumVideos, longVideos, shortVideos, channelVideos] = await Promise.all([
      searchVideos(topic, { videoDuration: 'medium', order: 'relevance', maxResults: 5 }),
      searchVideos(topic, { videoDuration: 'long', order: 'date', maxResults: 5 }),
      isShortsRun ? searchVideos(topic, { videoDuration: 'short', order: 'date', maxResults: 4 }) : Promise.resolve([]),
      searchChannel(channelId, topic, 3),
    ]);

    const seen = new Set();
    // Kanal-videoer sættes forrest, så de får en reel chance inden for det normale loft pr. kørsel.
    const normalItems = dedupeById([...channelVideos, ...mediumVideos, ...longVideos], seen);
    const shortItems = dedupeById(shortVideos, seen);

    if (normalItems.length === 0 && shortItems.length === 0) {
      console.log("ℹ️ Info: Fandt ingen videoer (eller API'en afviste søgningen).");
      return;
    }

    console.log(`Info: Fandt ${normalItems.length} normale og ${shortItems.length} shorts. Behandler normale først (maks ${MAX_NORMAL_PER_RUN}/${MAX_SHORTS_PER_RUN})...`);

    // Indlæses én gang her (effektivt), og genbruges/opdateres på tværs af begge grupper
    const existingIds = loadExistingVideoIds();

    // 70/30-styring: normale prioriteres først, hver gruppe har sit eget loft pr. kørsel.
    const normalProcessed = await processGroup(normalItems, 'normal video', MAX_NORMAL_PER_RUN, existingIds);
    const shortsProcessed = await processGroup(shortItems, 'Short', MAX_SHORTS_PER_RUN, existingIds);

    console.log(`✅ Succes: Robot-kørsel er færdig. ${normalProcessed} normale og ${shortsProcessed} shorts behandlet.`);
  } catch (error) {
    console.error("❌ Kritisk fejl under kontakt til YouTube:", error.message);
  }
}

findNewestVideos();
