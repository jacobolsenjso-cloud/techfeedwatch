// auto-youtube.mjs
import { execSync } from 'child_process';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function findNewestVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  // Henter de 10 nyeste videoer fra Kategori 28 (Science & Technology)
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&videoCategoryId=28&type=video&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      console.log(`ℹ️ Info: Fandt ${data.items.length} videoer på YouTube. Tjekker for nye...`);
      
      // Vender listen om, så vi opretter de ældste af de nye videoer først (kronologisk rækkefølge)
      const videos = data.items.reverse();

      // Kører videoerne igennem en kø én efter én
      for (const item of videos) {
        const videoId = item.id.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        console.log(`🔄 Behandler video: ${videoUrl}`);
        
        try {
          // execSync venter på at add-video.mjs er helt færdig med AI og filoprettelse, før den næste starter
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