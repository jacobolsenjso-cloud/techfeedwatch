import fs from 'fs';
import 'dotenv/config';

const VIDEOS_DIR = './src/content/videos';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Same formatting logic as add-video.mjs — keeps durations consistent
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Convert ISO 8601 duration (PT1H5M3S) to total seconds
function isoToSeconds(iso) {
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const h = match[1] ? parseInt(match[1]) : 0;
  const m = match[2] ? parseInt(match[2]) : 0;
  const s = match[3] ? parseInt(match[3]) : 0;
  return h * 3600 + m * 60 + s;
}

async function backfill() {
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Fejl: YOUTUBE_API_KEY er ikke sat!");
    process.exit(1);
  }
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`❌ Fejl: Mappen ${VIDEOS_DIR} findes ikke.`);
    process.exit(1);
  }

  const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  console.log(`Info: Fandt ${files.length} markdown-filer. Tjekker for manglende/tom/"0:00" duration...`);

  // Collect files that need fixing, mapped by youtubeId
  const toFix = [];
  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');

    const durationMatch = content.match(/duration:\s*"(.*?)"/);
    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);
    const isShortMatch = content.match(/isShort:\s*(true|false)/);

    const hasDurationLine = !!durationMatch;
    const currentDuration = durationMatch ? durationMatch[1] : null;
    const youtubeId = idMatch ? idMatch[1] : null;
    const isShort = isShortMatch ? isShortMatch[1] === 'true' : false;

    // Fix videos where duration-linjen mangler, er tom, eller er "0:00" (skip Shorts)
    const needsFix = !hasDurationLine || currentDuration === '' || currentDuration === '0:00';
    if (needsFix && youtubeId && !isShort) {
      toFix.push({ file, path, content, youtubeId, hasDurationLine });
    }
  }

  if (toFix.length === 0) {
    console.log("✅ Ingen filer med manglende/tom/\"0:00\" duration fundet. Intet at rette.");
    return;
  }

  console.log(`Info: ${toFix.length} filer skal rettes. Henter varigheder fra YouTube...`);

  // YouTube API accepts up to 50 ids per call — batch them
  let fixedCount = 0;
  for (let i = 0; i < toFix.length; i += 50) {
    const batch = toFix.slice(i, i + 50);
    const ids = batch.map(v => v.youtubeId).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) {
        console.error(`❌ API-fejl for batch:`, data.error?.message || 'Ukendt fejl');
        continue;
      }

      // Map returned durations back to their ids
      const durationById = {};
      for (const item of data.items) {
        if (item.contentDetails?.duration) {
          durationById[item.id] = isoToSeconds(item.contentDetails.duration);
        }
      }

      for (const video of batch) {
        const seconds = durationById[video.youtubeId];
        if (!seconds || seconds === 0) {
          console.log(`⚠️ Sprang over ${video.file}: ingen varighed returneret (video slettet/privat?).`);
          continue;
        }
        const newDuration = formatDuration(seconds);
        const updated = video.hasDurationLine
          ? video.content.replace(/duration:\s*".*?"/, `duration: "${newDuration}"`)
          : video.content.replace(/date:\s*".*?"/, (match) => `${match}\nduration: "${newDuration}"`);
        fs.writeFileSync(video.path, updated);
        console.log(`✅ ${video.file} → ${newDuration}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Netværksfejl:`, error.message);
    }
  }

  console.log(`\n✅ Færdig. Rettede ${fixedCount} af ${toFix.length} filer.`);
}

backfill();
