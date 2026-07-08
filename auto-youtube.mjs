import { execSync } from 'child_process';
import fs from 'fs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function findNewestVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  // Henter videoer fra Kategori 28. safeSearch er fjernet for at undgå blokering af tech-nyheder.
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&videoCategoryId=28&q=technology|AI&type=video&videoEmbeddable=true&order=date&maxResults=5&relevanceLanguage=en&regionCode=US&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      console.log(`Info: Fandt ${data.items.length} videoer på YouTube. Tjekker for nye...`);
      const videos = data.items.reverse();

      for (const item of videos) {
        const videoId = item.id.videoId;
        if (!videoId) continue;

        // RETTELSE: Tjekker om markdown-filen allerede eksisterer
        if (fs.existsSync(`./src/content/videos/${videoId}.md`)) {
          console.log(`ℹ️ Springer over: Video ${videoId} er allerede udgivet.`);
          continue;
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`▶️ Behandler NY video: ${videoUrl}`);

        try {
          execSync(`node add-video.mjs "${videoUrl}"`, { stdio: 'inherit' });
        } catch (subError) {
          console.error(`❌ Fejl ved oprettelse af video ${videoId}:`, subError.message);
        }
      }
      console.log("✅ Succes: Robot-kørsel er færdig.");
    } else {
      console.log("ℹ️ Info: Fandt ingen videoer (eller API'en afviste søgningen).");
    }
  } catch (error) {
    console.error("❌ Kritisk fejl under kontakt til YouTube:", error.message);
  }
}

findNewestVideos();