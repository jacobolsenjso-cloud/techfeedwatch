import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Fem emneklynger. Robotten roterer mellem dem, så alle dækkes i løbet af dagen.
const TOPIC_CLUSTERS = [
  "artificial intelligence|machine learning|LLM|ChatGPT|Gemini|generative AI|prompt engineering",
  "technology|quantum computing|GPU|robotics|5G|IoT|augmented reality|virtual reality",
  "web development|SEO|search engine optimization|no-code|automation|SaaS",
  "fintech|financial technology|neobank|algorithmic trading|passive income|open banking",
  "cryptocurrency|bitcoin|ethereum|DeFi|blockchain|Web3|smart contracts",
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
];

const MAX_NORMAL_PER_RUN = 9;
const MAX_SHORTS_PER_RUN = 1;

// Vælger klynge ud fra tidspunktet, så en 2-timers kørsel altid tager næste klynge i rækken.
function pickTopicCluster() {
  const clusterIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % TOPIC_CLUSTERS.length;
  return TOPIC_CLUSTERS[clusterIndex];
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
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
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
  console.log(`Info: Vælger emneklynge: "${topic}"`);
  console.log(`Info: Vælger kanal: "${channel.name}"`);

  try {
    // Henter videoer fra Kategori 28. safeSearch er fjernet for at undgå blokering af tech-nyheder.
    // Normale: medium + long (relevance) + én roterende kvalitetskanal. Shorts: short (date), maxResults=4, mål ~3.
    const [mediumVideos, longVideos, shortVideos, channelVideos] = await Promise.all([
      searchVideos(topic, { videoDuration: 'medium', order: 'relevance', maxResults: 5 }),
      searchVideos(topic, { videoDuration: 'long', order: 'relevance', maxResults: 5 }),
      searchVideos(topic, { videoDuration: 'short', order: 'date', maxResults: 4 }),
      searchChannel(channel.id, topic, 3),
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
