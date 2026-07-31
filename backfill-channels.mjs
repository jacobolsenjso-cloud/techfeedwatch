import fs from 'fs';
import 'dotenv/config';

// Backfiller kildeangivelse på alle eksisterende artikler:
//   channelTitle  – navnet på den YouTube-kanal videoen kommer fra
//   channelId     – så vi kan linke direkte til kanalen
//   publishedAt   – videoens egen udgivelsesdato (til VideoObject-schema)
//
// Idempotent: filer der allerede har channelTitle springes over.
// Kør: node backfill-channels.mjs

const VIDEOS_DIR = './src/content/videos';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// YAML-værdier skal escapes — kanalnavne indeholder ofte " og :
const yamlString = (str) => `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

async function backfill() {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ Fejl: YOUTUBE_API_KEY er ikke sat!');
    process.exit(1);
  }
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`❌ Fejl: Mappen ${VIDEOS_DIR} findes ikke.`);
    process.exit(1);
  }

  const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`Info: Fandt ${files.length} markdown-filer. Tjekker for manglende channelTitle...`);

  const toFix = [];
  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');

    if (/^channelTitle:/m.test(content)) continue; // allerede sat

    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);
    if (!idMatch) {
      console.log(`⚠️  Sprang over ${file}: ingen youtubeId.`);
      continue;
    }
    toFix.push({ file, path, content, youtubeId: idMatch[1] });
  }

  if (toFix.length === 0) {
    console.log('✅ Alle filer har allerede channelTitle. Intet at gøre.');
    return;
  }

  console.log(`Info: ${toFix.length} filer mangler kilde. Henter fra YouTube...`);

  let fixedCount = 0;
  let missingCount = 0;

  // YouTube API tager op til 50 id'er pr. kald
  for (let i = 0; i < toFix.length; i += 50) {
    const batch = toFix.slice(i, i + 50);
    const ids = batch.map((v) => v.youtubeId).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${YOUTUBE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) {
        console.error('❌ API-fejl for batch:', data.error?.message || 'Ukendt fejl');
        continue;
      }

      const infoById = {};
      for (const item of data.items) {
        if (item.snippet) {
          infoById[item.id] = {
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            publishedAt: item.snippet.publishedAt,
          };
        }
      }

      for (const video of batch) {
        const info = infoById[video.youtubeId];
        if (!info || !info.channelTitle) {
          console.log(`⚠️  Sprang over ${video.file}: ingen data (video slettet/privat?).`);
          missingCount++;
          continue;
        }

        // Indsæt de tre felter lige efter youtubeId-linjen.
        // \r? fordi Git giver filerne CRLF på Windows.
        const insert =
          `\nchannelTitle: ${yamlString(info.channelTitle)}` +
          `\nchannelId: ${yamlString(info.channelId)}` +
          `\npublishedAt: ${yamlString(info.publishedAt)}`;

        const updated = video.content.replace(
          /(youtubeId:\s*".*?")(\r?\n)/,
          (_m, line, nl) => `${line}${insert}${nl}`
        );

        if (updated === video.content) {
          console.log(`⚠️  Kunne ikke indsætte i ${video.file} (uventet format).`);
          missingCount++;
          continue;
        }

        fs.writeFileSync(video.path, updated);
        console.log(`✅ ${video.file} → ${info.channelTitle}`);
        fixedCount++;
      }
    } catch (error) {
      console.error('❌ Netværksfejl:', error.message);
    }
  }

  console.log(`\n✅ Færdig. Satte kilde på ${fixedCount} filer. ${missingCount} sprunget over.`);
}

backfill();
