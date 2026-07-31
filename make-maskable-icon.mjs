import sharp from 'sharp';
import fs from 'fs';

// Android beskærer maskable-ikoner til en cirkel eller squircle. Vores ikon
// fylder hele fladen uden luft, så som maskable blev omkring 51 px klippet af
// hver side — ind i selve logoet.
//
// Her bygges et separat maskable-ikon: samme motiv skaleret til 80% og centreret
// på en flade i ikonets egen baggrundsfarve, så der er den sikre zone Android
// forventer. Det oprindelige ikon bevares urørt til purpose "any".
//
// Kør: node make-maskable-icon.mjs

const SRC = 'public/icon-512.png';
const OUT = 'public/icon-maskable-512.png';
const SIZE = 512;
const SAFE = 0.8; // motivet fylder 80% — 10% luft hele vejen rundt

// Hent baggrundsfarven fra et hjørne, så fyldet matcher ikonet
const { data } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [r, g, b, a] = [data[0], data[1], data[2], data[3]];
const bg = a > 16 ? { r, g, b, alpha: 1 } : { r: 8, g: 145, b: 178, alpha: 1 }; // fallback: brand-teal
console.log(`Baggrundsfarve fra hjørne: rgb(${bg.r}, ${bg.g}, ${bg.b})`);

const inner = Math.round(SIZE * SAFE);
const offset = Math.round((SIZE - inner) / 2);

const resized = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: bg }).toBuffer();

await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: bg } })
  .composite([{ input: resized, top: offset, left: offset }])
  .png()
  .toFile(OUT);

const stat = fs.statSync(OUT);
console.log(`✅ ${OUT} — ${inner}x${inner} motiv centreret i ${SIZE}x${SIZE} (${stat.size} bytes)`);
console.log(`   luft i kanten: ${offset} px (Android kræver mindst ${Math.round(SIZE * 0.1)} px)`);
