import fs from 'fs';
import 'dotenv/config';

const VIDEOS_DIR = './src/content/videos';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SHORT_MAX_SECONDS = 180; // YouTubes nuvaerende Short-graense

// Kør på én fil: node backfill-isshort.mjs VIDEOID
const onlyId = process.argv[2] || null;

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isoToSeconds(iso) {
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const h = match[1] ? parseInt(match[1]) : 0;
  const m = match[2] ? parseInt(match[2]) : 0;
  const s = match[3] ? parseInt(match[3]) : 0;
  return h * 3600 + m * 60 + s;
}

async function backfill() {
  if (!YOUTUBE_API_KEY) { console.error("Fejl: YOUTUBE_API_KEY er ikke sat!"); process.exit(1); }

  let files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  if (onlyId) files = files.filter(f => f === `${onlyId}.md`);

  // Saml alle filer + deres youtubeId
  const items = [];
  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');
    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);
    if (idMatch) items.push({ file, path, content, youtubeId: idMatch[1] });
  }

  console.log(`Info: ${items.length} filer. Henter faktiske varigheder fra YouTube...`);

  let updated = 0, unchanged = 0, skipped = 0;
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const ids = batch.map(v => v.youtubeId).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.items) { console.error("API-fejl:", data.error?.message || 'ukendt'); continue; }

      const secById = {};
      for (const it of data.items) {
        if (it.contentDetails?.duration) secById[it.id] = isoToSeconds(it.contentDetails.duration);
      }

      for (const v of batch) {
        const seconds = secById[v.youtubeId];
        if (!seconds || seconds === 0) {
          console.log(`Sprang over ${v.file}: ingen varighed (slettet/privat?).`);
          skipped++;
          continue;
        }
        const newDuration = formatDuration(seconds);
        const newIsShort = seconds <= SHORT_MAX_SECONDS;

        let c = v.content;
        // Erstat duration (uanset om det er tal eller teksten "Short")
        if (/duration:\s*".*?"/.test(c)) {
          c = c.replace(/duration:\s*".*?"/, `duration: "${newDuration}"`);
        } else {
          c = c.replace(/(youtubeId:\s*".*?")/, `$1\nduration: "${newDuration}"`);
        }
        // Erstat isShort
        if (/isShort:\s*(true|false)/.test(c)) {
          c = c.replace(/isShort:\s*(true|false)/, `isShort: ${newIsShort}`);
        } else {
          c = c.replace(/(duration:\s*".*?")/, `$1\nisShort: ${newIsShort}`);
        }

        if (c !== v.content) {
          fs.writeFileSync(v.path, c);
          console.log(`OK ${v.file} -> ${newDuration}, isShort: ${newIsShort}`);
          updated++;
        } else {
          unchanged++;
        }
      }
    } catch (err) {
      console.error("Netvaerksfejl:", err.message);
    }
  }

  console.log(`\nFaerdig. ${updated} rettet, ${unchanged} uaendret, ${skipped} sprunget over.`);
}

backfill();
