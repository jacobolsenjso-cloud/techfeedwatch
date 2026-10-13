// Laver sitets eget kortbillede for ALLE artikler (fase B, 12/10-2026): public/og/<slug>.jpg
// (delekort) og public/kort/<slug>.webp (kort i lister). Tegnes lokalt med sharp — ingen
// hentning fra YouTube, ingen modelkald, intet koster noget. Kan køres igen når som helst;
// eksisterende filer overskrives med samme design.
// Kør: node lav-kortbilleder.mjs
import fs from 'node:fs';
import { generateOgCard } from './og-card.mjs';

const slugs = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
let ok = 0, fejl = 0;
let sprunget = 0;
for (const slug of slugs) {
  // 13/10: artikler med AI-billede (public/billeder) springes over — emnekortet må ikke overskrive det
  if (fs.existsSync(`./public/billeder/${slug}.webp`)) { sprunget++; continue; }
  if (await generateOgCard(null, slug)) ok++; else fejl++;
}
if (sprunget) console.log(`${sprunget} artikler har AI-billede og blev sprunget over`);
const kort = fs.readdirSync('./public/kort').filter((f) => f.endsWith('.webp')).length;
console.log(`${ok} kortbilleder lavet, ${fejl} fejl · ${slugs.length} artikler · ${kort} filer i public/kort`);
process.exit(fejl ? 1 : 0);
