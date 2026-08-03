import sharp from 'sharp';
import fs from 'fs';

// Bygger favicon.ico ud fra det NUVÆRENDE logo (favicon.svg).
//
// Den gamle favicon.ico var fra 10. juni og viste det tidligere logo — en mørk
// firkant med et hvidt "A". Den lå stadig først i <head> med sizes="any", så
// browsere og linkforhåndsvisninger valgte den frem for favicon.svg.
//
// sharp kan ikke skrive .ico, men formatet er enkelt: en header, en post pr.
// størrelse, og PNG-data. Det bygger vi selv, så der ikke skal en pakke til.
//
// Kør: node make-favicon.mjs

const SRC = 'public/favicon.svg';
const OUT = 'public/favicon.ico';
const SIZES = [16, 32, 48, 64, 128, 256];

const pngs = [];
for (const s of SIZES) {
  const buf = await sharp(SRC, { density: 512 })
    .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  pngs.push({ size: s, buf });
  console.log(`  ${s}x${s}  ${buf.length} bytes`);
}

// ICONDIR: reserved(2) + type(2, 1=ikon) + antal(2)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);

// ICONDIRENTRY er 16 bytes pr. billede
const ENTRY = 16;
let offset = header.length + ENTRY * pngs.length;

const entries = pngs.map(({ size, buf }) => {
  const e = Buffer.alloc(ENTRY);
  e.writeUInt8(size >= 256 ? 0 : size, 0);   // bredde, 0 betyder 256
  e.writeUInt8(size >= 256 ? 0 : size, 1);   // højde
  e.writeUInt8(0, 2);                        // farver i paletten
  e.writeUInt8(0, 3);                        // reserveret
  e.writeUInt16LE(1, 4);                     // farveplaner
  e.writeUInt16LE(32, 6);                    // bits pr. pixel
  e.writeUInt32LE(buf.length, 8);            // datastørrelse
  e.writeUInt32LE(offset, 12);               // hvor data starter
  offset += buf.length;
  return e;
});

fs.writeFileSync(OUT, Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]));
console.log(`\n✅ ${OUT} — ${SIZES.join(', ')} px, ${fs.statSync(OUT).size} bytes`);
