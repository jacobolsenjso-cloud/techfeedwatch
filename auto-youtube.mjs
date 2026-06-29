import { spawn } from 'child_process';

// Nu henter vi nøglen sikkert fra "miljøet" (GitHub Secrets)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_QUERY = "Artificial Intelligence OR Tech";

async function findNewestVideo() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(SEARCH_QUERY)}&type=video&order=date&maxResults=1&key=${YOUTUBE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`✅ Fandt video: ${videoUrl}`);
    
    const process = spawn('node', ['add-video.mjs', videoUrl]);
    process.stdout.on('data', (data) => console.log(`Resultat: ${data}`));
  }
}

findNewestVideo();