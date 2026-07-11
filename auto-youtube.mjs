import { execSync } from 'child_process';
import fs from 'fs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const BASE_SEARCH_PARAMS = 'part=snippet&videoCategoryId=28&q=technology|AI&type=video&videoEmbeddable=true&order=date&relevanceLanguage=en&regionCode=US';

async function searchVideos(videoDuration, maxResults) {
  const url = `https://www.googleapis.com/youtube/v3/search?${BASE_SEARCH_PARAMS}&videoDuration=${videoDuration}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
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

async function findNewestVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  try {
    // Henter videoer fra Kategori 28. safeSearch er fjernet for at undgå blokering af tech-nyheder.
    // To søgninger: normale videoer (medium + long) og Shorts (short), for en jævn blanding.
    const [mediumVideos, longVideos, shortVideos] = await Promise.all([
      searchVideos('medium', 5),
      searchVideos('long', 5),
      searchVideos('short', 3),
    ]);

    const combined = [...mediumVideos, ...longVideos, ...shortVideos];
    const seen = new Set();
    const uniqueItems = combined.filter(item => {
      const videoId = item.id?.videoId;
      if (!videoId || seen.has(videoId)) return false;
      seen.add(videoId);
      return true;
    });

    if (uniqueItems.length === 0) {
      console.log("ℹ️ Info: Fandt ingen videoer (eller API'en afviste søgningen).");
      return;
    }

    // Ældste først, på tværs af de kombinerede søgeresultater
    uniqueItems.sort((a, b) => new Date(a.snippet.publishedAt) - new Date(b.snippet.publishedAt));

    console.log(`Info: Fandt ${uniqueItems.length} unikke videoer på YouTube. Tjekker for nye...`);

    for (const item of uniqueItems) {
      const videoId = item.id.videoId;
      if (!videoId) continue;

      // RETTELSE: Tjekker om markdown-filen allerede eksisterer
      if (fs.existsSync(`./src/content/videos/${videoId}.md`)) {
        console.log(`ℹ️ Springer over: Video ${videoId} er allerede udgivet.`);
        continue;
      }

      const englishOk = await isEnglishAudio(videoId);
      if (!englishOk) continue;

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`▶️ Behandler NY video: ${videoUrl}`);

      try {
        execSync(`node add-video.mjs "${videoUrl}"`, { stdio: 'inherit' });
      } catch (subError) {
        console.error(`❌ Fejl ved oprettelse af video ${videoId}:`, subError.message);
      }
    }
    console.log("✅ Succes: Robot-kørsel er færdig.");
  } catch (error) {
    console.error("❌ Kritisk fejl under kontakt til YouTube:", error.message);
  }
}

findNewestVideos();
