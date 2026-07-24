import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEOS_DIR = './src/content/videos';
const BATCH_SIZE = 50;             // YouTube videos.list tillader op til 50 id'er pr. kald.
const MAX_DELETE_RATIO = 0.30;     // Sikkerhedsgrænse: slet aldrig mere end 30% på én kørsel.

// Uden --apply kører scriptet som TØR-TEST og sletter intet. Workflowen kalder det med --apply.
const APPLY = process.argv.includes('--apply');

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Læser alle video-filer og mapper youtubeId -> filsti. Springer filer uden youtubeId over.
function loadVideoFiles() {
  if (!fs.existsSync(VIDEOS_DIR)) return [];
  const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));
  const entries = [];
  for (const file of files) {
    const full = path.join(VIDEOS_DIR, file);
    const content = fs.readFileSync(full, 'utf-8');
    const match = content.match(/youtubeId:\s*"(.*?)"/);
    if (match) entries.push({ id: match[1], file, full });
    else console.log(`⚠️ Ingen youtubeId i ${file} - springes over.`);
  }
  return entries;
}

// Slår en batch af id'er op og returnerer settet af id'er der STADIG findes (offentligt) på YouTube.
async function fetchExistingIds(ids) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=id&id=${ids.join(',')}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'ukendt API-fejl');
  return new Set((data.items || []).map((it) => it.id));
}

async function run() {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY er ikke sat!');
    process.exit(1);
  }

  const entries = loadVideoFiles();
  const total = entries.length;
  if (total === 0) {
    console.log('Ingen video-filer fundet.');
    return;
  }

  console.log(`Scanner ${total} videoer mod YouTube API${APPLY ? '' : '  (TØR-TEST - sletter intet)'}...`);

  const dead = [];
  let checked = 0;
  let failedBatches = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    try {
      const existing = await fetchExistingIds(batch.map((e) => e.id));
      checked += batch.length;
      // En video regnes som "død" hvis API'en ikke længere returnerer den (slettet, privat eller kanal lukket).
      for (const e of batch) {
        if (!existing.has(e.id)) dead.push(e);
      }
    } catch (err) {
      failedBatches++;
      console.log(`⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1} fejlede (${err.message}) - springes over, sletter intet for den.`);
    }
    if (i + BATCH_SIZE < entries.length) await sleep(300);
  }

  console.log(`\nTjekket ${checked}/${total} videoer. Fandt ${dead.length} døde.`);
  if (failedBatches > 0) console.log(`⚠️ ${failedBatches} batch(es) fejlede og blev sprunget over (intet slettet for dem).`);

  if (dead.length === 0) {
    console.log('✅ Ingen døde videoer. Intet at gøre.');
    return;
  }

  console.log('\nDøde videoer:');
  dead.forEach((e) => console.log(`   ${e.id}  ${e.file}`));

  // Sikkerhedsgrænse: hvis en usædvanlig stor andel ser "død" ud, er der nok noget galt med API/nøglen - stop.
  const ratio = checked > 0 ? dead.length / checked : 0;
  if (checked >= 10 && ratio > MAX_DELETE_RATIO) {
    console.log(`\n🛑 STOP: ${(ratio * 100).toFixed(0)}% ville blive slettet (over grænsen på ${MAX_DELETE_RATIO * 100}%). Sletter INTET - tjek om API/nøglen fejler.`);
    process.exit(1);
  }

  if (!APPLY) {
    console.log(`\nTØR-TEST: ingen filer slettet. Kør 'node prune-deleted-videos.mjs --apply' for at slette dem.`);
    return;
  }

  let deleted = 0;
  for (const e of dead) {
    try {
      fs.unlinkSync(e.full);
      // Fjern også delekortet hvis det findes
      try { fs.unlinkSync(`./public/og/${e.file.replace(/\.md$/, '')}.jpg`); } catch (e2) {}
      deleted++;
      console.log(`🗑️ Slettet: ${e.file}`);
    } catch (err) {
      console.log(`❌ Kunne ikke slette ${e.file}: ${err.message}`);
    }
  }
  console.log(`\n✅ Færdig. ${deleted} døde video-filer fjernet.`);
}

run();
