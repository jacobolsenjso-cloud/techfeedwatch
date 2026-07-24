import fs from 'fs';
import { generateOgCard } from './og-card.mjs';

const VIDEOS_DIR = './src/content/videos';
const OG_DIR = './public/og';
const FORCE = process.argv.includes('--force');

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  if (!fs.existsSync(VIDEOS_DIR)) { console.log('Ingen video-mappe.'); return; }
  const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`Fandt ${files.length} videoer. Genererer delekort${FORCE ? ' (--force: overskriver alle)' : ' (springer eksisterende over)'}...`);

  let made = 0, skipped = 0, failed = 0;
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    if (!FORCE && fs.existsSync(`${OG_DIR}/${slug}.jpg`)) { skipped++; continue; }

    const content = fs.readFileSync(`${VIDEOS_DIR}/${file}`, 'utf-8');
    const m = content.match(/youtubeId:\s*"(.*?)"/);
    if (!m) { console.log(`⚠️ Ingen youtubeId i ${file}`); failed++; continue; }

    const res = await generateOgCard(m[1], slug);
    if (res) { made++; if (made % 25 === 0) console.log(`  ...${made} lavet`); }
    else failed++;
    await sleep(120);
  }
  console.log(`\n✅ Færdig. ${made} lavet, ${skipped} sprunget over, ${failed} fejlede.`);
}

run();
