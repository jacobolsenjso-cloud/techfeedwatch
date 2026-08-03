import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OG_DIR = './public/og';
const W = 1200, H = 630;

// Henter det bedste tilgængelige thumbnail. maxres/sd findes ikke altid (især Shorts) -> falder tilbage til hqdefault som ALTID findes.
async function fetchThumb(youtubeId) {
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    try {
      const res = await fetch(`https://img.youtube.com/vi/${youtubeId}/${name}.jpg`);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if ((meta.width || 0) >= 320) return buf;
    } catch (e) {}
  }
  return null;
}

// Bund-gradient + logo, så kortet er brandet og teksten kan læses.
//
// Logoet er "feed bliver til play": tre stigende bjælker efterfulgt af en
// trekant. Kortene tegnede tidligere kun trekanten, så mærket var halvt.
const overlaySvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="50%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>

  <rect x="56" y="546" width="26" height="10" rx="5" fill="#d926c8"/>
  <rect x="56" y="564" width="35" height="10" rx="5" fill="#0891b2"/>
  <rect x="56" y="582" width="44" height="10" rx="5" fill="#22d3ee"/>
  <polygon points="114,540 114,598 158,569" fill="#22b8e6"/>

  <text x="180" y="585" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Tech Feed Watch</text>
</svg>`);

// Laver et 1200x630 delekort til public/og/[slug].jpg. Kaster aldrig - returnerer null ved fejl.
export async function generateOgCard(youtubeId, slug) {
  try {
    if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });
    const outPath = path.join(OG_DIR, `${slug}.jpg`);

    const thumb = await fetchThumb(youtubeId);
    let base;
    if (thumb) {
      base = await sharp(thumb).resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();
    } else {
      base = await sharp({ create: { width: W, height: H, channels: 3, background: { r: 20, g: 19, b: 23 } } }).jpeg().toBuffer();
    }

    await sharp(base).composite([{ input: overlaySvg, top: 0, left: 0 }]).jpeg({ quality: 82 }).toFile(outPath);
    return outPath;
  } catch (e) {
    console.log(`⚠️ Kunne ikke lave OG-kort for ${slug}: ${e.message}`);
    return null;
  }
}
