// Mindre billedudgaver til mobil (25/10-2026). Køres efter "astro build" (se package.json) og skriver
// direkte i dist/, så intet ekstra skal i git, og ingen skal huske at køre den.
//
// Hvorfor: PageSpeed målte, at forsiden sender større billeder end skærmen viser (ca. 136 KB spild på
// mobil): top-5-miniaturer vises 100 px brede men hentes i 480 px, og topbilledet vises ca. 650 px men
// hentes i 960 px. Forsiden bruger srcset, så telefonen selv vælger den mindste udgave, der er skarp nok.
//
//   public/kort/<slug>.webp      -> dist/kort-240/<slug>.webp     (240 px bred)
//   public/billeder/<slug>.webp  -> dist/billeder-720/<slug>.webp (720 px bred)
//
// Fejler noget, stopper bygningen (exit 1) - så bliver det gamle site stående i stedet for et site
// med manglende billeder.
import fs from 'node:fs';
import path from 'node:path';

let sharp;
try { sharp = (await import('sharp')).default; } catch (e) {
  console.error('lav-smaa-billeder: sharp kunne ikke indlæses - bygning stoppes:', e.message);
  process.exit(1);
}

const JOB = [
  { fra: 'public/kort', til: 'dist/kort-240', bredde: 240 },
  { fra: 'public/billeder', til: 'dist/billeder-720', bredde: 720 },
];
const t0 = Date.now();
let lavet = 0, fejl = 0, foer = 0, efter = 0;
for (const j of JOB) {
  fs.mkdirSync(j.til, { recursive: true });
  const filer = fs.readdirSync(j.fra).filter((f) => f.endsWith('.webp'));
  // 8 ad gangen: hurtigt nok på Cloudflare uden at bruge al hukommelsen
  for (let i = 0; i < filer.length; i += 8) {
    await Promise.all(filer.slice(i, i + 8).map(async (f) => {
      try {
        const ud = path.join(j.til, f);
        await sharp(path.join(j.fra, f)).resize({ width: j.bredde, withoutEnlargement: true }).webp({ quality: 72 }).toFile(ud);
        foer += fs.statSync(path.join(j.fra, f)).size; efter += fs.statSync(ud).size; lavet++;
      } catch (e) { fejl++; console.error(`lav-smaa-billeder: ${j.fra}/${f}: ${e.message}`); }
    }));
  }
}
console.log(`lav-smaa-billeder: ${lavet} lavet, ${fejl} fejl · ${(foer / 1048576).toFixed(1)} MB -> ${(efter / 1048576).toFixed(1)} MB · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fejl ? 1 : 0);
