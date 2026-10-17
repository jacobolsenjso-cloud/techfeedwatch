// Laver alle ikonfiler ud fra logoet i src/lib/logo.mjs (17/10-2026). Kør: node lav-ikoner.mjs
//   favicon.svg, favicon.ico (16+32+48), favicon-48.png  - lille udgave (tykkere linjer)
//   icon-192.png, icon-512.png                            - "any": afrundet ikon, gennemsigtige hjørner
//   icon-maskable-512.png                                 - fuld flade, indhold i 80 % sikker zone
//   apple-touch-icon.png (180)                            - fuld flade (Apple runder selv hjørnerne)
//   og-default-v3.png (1200x630)                          - standard-delekort
import fs from 'node:fs';
import sharp from 'sharp';
import { ikonSvg, ikonIndhold, FARVER } from './src/lib/logo.mjs';

const P = 'public/';
const png = (svg, str) => sharp(Buffer.from(svg), { density: 300 }).resize(str, str).png().toBuffer();

fs.writeFileSync(P + 'favicon.svg', ikonSvg(90, { lille: true }) + '\n');
const ico = await Promise.all([16, 32, 48].map((s) => png(ikonSvg(90, { lille: true }), s)));
fs.writeFileSync(P + 'favicon-48.png', ico[2]);
// ICO-fil med PNG-billeder indeni (understøttet af alle browsere siden Vista/IE9).
const hoved = Buffer.alloc(6 + 16 * ico.length);
hoved.writeUInt16LE(0, 0); hoved.writeUInt16LE(1, 2); hoved.writeUInt16LE(ico.length, 4);
let pos = hoved.length;
ico.forEach((b, i) => {
  const s = [16, 32, 48][i], o = 6 + 16 * i;
  hoved.writeUInt8(s, o); hoved.writeUInt8(s, o + 1); hoved.writeUInt8(0, o + 2); hoved.writeUInt8(0, o + 3);
  hoved.writeUInt16LE(1, o + 4); hoved.writeUInt16LE(32, o + 6); hoved.writeUInt32LE(b.length, o + 8); hoved.writeUInt32LE(pos, o + 12);
  pos += b.length;
});
fs.writeFileSync(P + 'favicon.ico', Buffer.concat([hoved, ...ico]));

fs.writeFileSync(P + 'icon-192.png', await png(ikonSvg(90), 192));
fs.writeFileSync(P + 'icon-512.png', await png(ikonSvg(90), 512));
fs.writeFileSync(P + 'icon-maskable-512.png', await png(ikonSvg(90, { fuldflade: true, skala: 0.8 }), 512));
fs.writeFileSync(P + 'apple-touch-icon.png', await png(ikonSvg(90, { fuldflade: true, skala: 0.86 }), 180));

// Standard-delekort: blæk-baggrund, stort ikon, navn og tagline.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${FARVER.blaek}"/><stop offset="1" stop-color="#111a33"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <svg x="110" y="185" width="260" height="260" viewBox="0 0 90 90">${ikonIndhold({ id: 'ogIk' })}</svg>
  <text x="420" y="315" font-family="Arial, Helvetica, sans-serif" font-size="84" fill="#f8fafc"><tspan font-weight="bold">TechFeed</tspan>Watch</text>
  <text x="424" y="385" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#94a3b8">Straight answers on AI, tech, fintech and crypto.</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(P + 'og-default-v3.png');
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-48.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'og-default-v3.png']) {
  console.log(`${f.padEnd(24)} ${fs.statSync(P + f).size} bytes`);
}
