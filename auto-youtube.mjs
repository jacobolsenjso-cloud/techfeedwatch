import { spawn } from 'child_process';

// Hent nøglen sikkert fra "miljøet" (GitHub Secrets)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function findNewestVideo() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  // URL'en er rettet, så den søger i Kategori 28 (Tech) i stedet for på søgeord
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&videoCategoryId=28&type=video&order=date&maxResults=1&key=${YOUTUBE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`✅ Fandt ny video i Tech-kategorien: ${videoUrl}`);
    
    const process = spawn('node', ['add-video.mjs', videoUrl]);
    process.stdout.on('data', (data) => console.log(`Resultat: ${data}`));
  } else {
    console.log("ℹ️ Fandt ingen videoer i denne kørsel.");
  }
}

findNewestVideo();