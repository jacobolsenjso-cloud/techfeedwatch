import { execSync } from 'child_process';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function findNewestVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  // Henter de 10 nyeste videoer (KUN dem der tillader indlejring og er alders-sikre)
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&videoCategoryId=28&q=technology|AI&type=video&videoEmbeddable=true&safeSearch=strict&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      console.log(`Info: Fandt ${data.items.length} videoer på YouTube. Tjekker for nye..`);
      
      const videos = data.items.reverse();

      for (const item of videos) {
        const videoId = item.id.videoId;
        if (!videoId) continue;

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`Behandler video: ${videoUrl}`);

        try {
          execSync(`node add-video.mjs "${videoUrl}"`, { stdio: 'inherit' });
        } catch (subError) {
          console.error(`❌ Fejl ved oprettelse af video ${videoId}:`, subError.message);
        }
      }
      console.log("✅ Succes: Køen er gennemført.");
    } else {
      console.log("ℹ️ Info: Fandt ingen videoer i denne kørsel.");
    }
  } catch (error) {
    console.error("❌ Kritisk fejl under kontakt til YouTube API:", error.message);
  }
}

findNewestVideos();