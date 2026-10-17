import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Sitets eget kortbillede (fase B, 12/10-2026). Før blev kortet bygget oven på
// videoens miniature fra YouTube, så hver artikel lignede en video. Nu er
// artiklen hovedsagen og videoen et supplement, så kortet viser artiklen:
// titlen, emnet og logoet — ingen video.
//
// To filer pr. artikel:
//  - public/og/<slug>.jpg    1200x630, delekort (Facebook, LinkedIn, X) og schema-billede
//  - public/kort/<slug>.webp  960x540 (16:9), kortene i lister (forside, emner, arkiv …), lille fil
const OG_DIR = './public/og';
const KORT_DIR = './public/kort';
const W = 1200, H = 630;

// Emnefarverne (samme tabel som src/lib/tags.ts — .ts kan ikke importeres her).
// FARVEREGEL: en emnefarve bærer aldrig hvid tekst og står aldrig som tekst; her
// bruges den kun som stribe og prik.
const EMNEFARVE = {
  'AI & Tech': '#06b6d4', 'SEO': '#6366f1', 'Automation': '#14b8a6', 'Coding': '#2563eb',
  'Business & Money': '#059669', 'AI Video': '#d926c8', 'Productivity': '#8b5cf6', 'Fintech': '#1e3a8a',
  'Crypto': '#f59e0b', 'Cybersecurity': '#dc2626', 'Quantum Computing': '#7c3aed', 'Hardware & Chips': '#ea580c', 'AR & VR': '#db2777',
  'AI Agents': '#0ea5e9', 'Investing & Trading': '#65a30d', 'Smartphones & Gadgets': '#64748b', 'Robotics': '#be123c', 'PC Building & Gaming': '#ca8a04',
};
// En mørk emnefarve (Fintech) forsvinder på den mørke baggrund — den lysnes, som MainLayout gør i mørk tilstand.
function synlig(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const lys = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lys >= 0.25) return hex;
  const mix = (c) => Math.round(c + (255 - c) * 0.45);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Bryder titlen i linjer efter et skøn over tegnbredden. Skønnet er bevidst
// rummeligt (0,56 x skriftstørrelse pr. tegn): GitHubs maskiner har ikke Arial og
// tegner med en bredere skrift, og en for lang linje ville blive klippet af.
function linjer(titel, str) {
  const maks = Math.floor((W - 2 * 88) / (str * 0.56));
  const ud = [];
  let l = '';
  for (const ord of titel.split(/\s+/)) {
    if ((l + ' ' + ord).trim().length > maks && l) { ud.push(l); l = ord; } else l = (l + ' ' + ord).trim();
  }
  if (l) ud.push(l);
  return ud;
}

// h = højden: 630 til delekortet (1,91:1), 675 til listekortet (16:9 som kortenes ramme,
// ellers skærer rammen siderne af — og dermed emnestriben).
export function kortSvg({ titel, emne }, h = H) {
  const farve = synlig(EMNEFARVE[emne] || '#06b6d4');
  // Kortere titel = større skrift; højst 4 linjer
  let str = titel.length <= 42 ? 70 : titel.length <= 60 ? 62 : 54;
  let l = linjer(titel, str);
  while (l.length > 4 && str > 42) { str -= 6; l = linjer(titel, str); }
  if (l.length > 4) { l = l.slice(0, 4); l[3] = l[3].replace(/\s*\S*$/, '') + ' …'; }
  const lh = Math.round(str * 1.18);
  // d = ekstra højde i 16:9-udgaven: titlen rykker halvt ned, logoet helt ned
  const d = h - H;
  const top = 200 + d / 2 + Math.max(0, (4 - l.length) * lh * 0.35);
  return Buffer.from(`<svg width="${W}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#141317"/><stop offset="1" stop-color="#0c2730"/>
  </linearGradient></defs>
  <rect width="${W}" height="${h}" fill="url(#bg)"/>
  <rect x="0" y="0" width="18" height="${h}" fill="${farve}"/>
  <g opacity="0.10" fill="${farve}">
    <rect x="960" y="${478 + d}" width="100" height="28" rx="14"/><rect x="960" y="${522 + d}" width="140" height="28" rx="14"/><rect x="960" y="${566 + d}" width="180" height="28" rx="14"/>
  </g>
  <circle cx="98" cy="${112 + d / 3}" r="11" fill="${farve}"/>
  <text x="122" y="${123 + d / 3}" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" fill="#cbd5e1">${xml(emne || 'Tech')}</text>
  ${l.map((x, i) => `<text x="88" y="${Math.round(top + i * lh)}" font-family="Arial, Helvetica, sans-serif" font-size="${str}" font-weight="bold" fill="#ffffff">${xml(x)}</text>`).join('\n  ')}
  <rect x="88" y="${546 + d}" width="26" height="10" rx="5" fill="#d926c8"/>
  <rect x="88" y="${564 + d}" width="35" height="10" rx="5" fill="#0891b2"/>
  <rect x="88" y="${582 + d}" width="44" height="10" rx="5" fill="#22d3ee"/>
  <polygon points="146,${540 + d} 146,${598 + d} 190,${569 + d}" fill="#22b8e6"/>
  <text x="212" y="${585 + d}" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Tech Feed Watch</text>
</svg>`);
}

// Listekortet (960x540) har INGEN titel: på sitet står titlen lige under kortet, og målt
// 12/10 (skærmbillede af forsiden) gav titel i billedet + titel under det samme tekst to
// gange — og på små kort blev teksten i billedet ulæselig støj. Kortet viser emnet og
// sitets "feed"-mærke i emnets farve; bjælkernes længder og en ring varierer pr. artikel
// (fast hash af slug), så en række kort fra samme emne ikke ser ens ud.
function hashTal(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function listeKortSvg({ emne }, slug) {
  const farve = synlig(EMNEFARVE[emne] || '#06b6d4');
  const h = hashTal(slug);
  const b = [0, 1, 2].map((i) => 180 + ((h >>> (i * 6)) % 64) * 6);   // 180-558 px
  const cx = 820 + ((h >>> 20) % 220), cy = 160 + ((h >>> 12) % 200), r = 120 + ((h >>> 4) % 90);
  return Buffer.from(`<svg width="${W}" height="675" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#141317"/><stop offset="1" stop-color="#0c2730"/>
  </linearGradient></defs>
  <rect width="${W}" height="675" fill="url(#bg)"/>
  <rect x="0" y="0" width="22" height="675" fill="${farve}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${farve}" stroke-width="26" opacity="0.35"/>
  <circle cx="110" cy="138" r="16" fill="${farve}"/>
  <text x="146" y="155" font-family="Arial, Helvetica, sans-serif" font-size="50" font-weight="bold" fill="#e2e8f0">${xml(emne || 'Tech')}</text>
  <rect x="96" y="360" width="${b[0]}" height="46" rx="23" fill="${farve}"/>
  <rect x="96" y="430" width="${b[1]}" height="46" rx="23" fill="${farve}" opacity="0.75"/>
  <rect x="96" y="500" width="${b[2]}" height="46" rx="23" fill="${farve}" opacity="0.5"/>
</svg>`);
  // Ingen afspil-trekant her (12/10): på et kort læses en stor trekant som "video" — det
  // var præcis det, kortet skulle væk fra. Logoets trekant står kun på delekortet.
}

// Titel og første emne læses fra artiklens egen fil, så kaldet fra add-video.mjs
// er uændret: generateOgCard(youtubeId, slug). youtubeId bruges ikke længere.
function frontmatter(slug) {
  const raw = fs.readFileSync(`./src/content/videos/${slug}.md`, 'utf8');
  return {
    titel: raw.match(/^title:\s*"(.*)"\s*$/m)?.[1]?.replace(/\\"/g, '"') || slug,
    emne: raw.match(/^tags:\r?\n\s*-\s*"(.*?)"/m)?.[1] || '',
  };
}

// Laver begge billeder for én artikel. Kaster aldrig — returnerer null ved fejl.
export async function generateOgCard(youtubeId, slug) {
  try {
    fs.mkdirSync(OG_DIR, { recursive: true });
    fs.mkdirSync(KORT_DIR, { recursive: true });
    const fm = frontmatter(slug);
    const ogSti = path.join(OG_DIR, `${slug}.jpg`);
    await sharp(kortSvg(fm)).jpeg({ quality: 84 }).toFile(ogSti);
    // Listekortet: 16:9 som kortenes ramme, 960x540 så det også er skarpt som forsidens tophistorie
    await sharp(listeKortSvg(fm, slug)).resize(960, 540).webp({ quality: 72 }).toFile(path.join(KORT_DIR, `${slug}.webp`));
    return ogSti;
  } catch (e) {
    console.log(`⚠️ Kunne ikke lave kortbillede for ${slug}: ${e.message}`);
    return null;
  }
}
