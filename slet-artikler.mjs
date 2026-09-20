// Sletter artikler i hånden — fx fordi kilden ikke dækker spørgsmålet (15/9-2026).
//
// Kilde: src/data/relevans2.json — artikler med karakter under GRAENSE_DAARLIG
// (Jacob besluttede 15/9: "de 30 der ikke dækker skal bare slettes"). De 30 er
// slettet, så i praksis bruges scriptet nu med --slugs.
// Alternativt: node slet-artikler.mjs --slugs a,b,c
//
// Flyttet 20/9-2026 over på src/lib/fjern-artikel.mjs, som prune-deleted-videos.mjs
// også bruger. Udvælgelsen af artikler og flagene er uændrede; det, der er nyt, er
// punkt 3 herunder — scriptet manglede det, og netop dét hul skabte de 38 gamle
// adresser, der 20/9 blev målt til at sende Google videre til en 404.
//
// For hver artikel:
//  1) Indgående links fra andre sider fjernes (linkteksten bliver stående),
//     så der ikke opstår 404'er inde på sitet (fejlen fra august: 589 døde links).
//  2) 301-redirect til den mest beslægtede artikel, der overlever: samme emne
//     og flest fælles kerneord med søgespørgsmålet. Både /video/<slug>,
//     /video/<slug>/ og /video/<youtubeId> omdirigeres.
//  3) NYT: eksisterende 301-regler, der pegede på den slettede artikel, flyttes
//     med — direkte til det nye mål, så der ikke opstår en kæde med to hop.
//  4) .md og OG-billedet slettes.
// Til sidst køres sort-redirects.mjs. Intet committes — det gør Jacob/Claude bagefter.
//
// Kør: node slet-artikler.mjs --dry-run   (viser kun hvad der ville ske)
//      node slet-artikler.mjs
import fs from 'fs';
import { execSync } from 'child_process';
import { GRAENSE_DAARLIG } from './src/lib/relevans.mjs';
import { alleArtikler, laesArtikel, bedsteErstatning, fjernIndgaaendeLinks, opdaterRedirects } from './src/lib/fjern-artikel.mjs';

const DRY = process.argv.includes('--dry-run');
const argSlugs = process.argv.includes('--slugs') ? process.argv[process.argv.indexOf('--slugs') + 1].split(',') : null;
const DIR = 'src/content/videos';

const alle = alleArtikler();
let slugs = argSlugs;
if (!slugs) {
  const r = JSON.parse(fs.readFileSync('src/data/relevans2.json', 'utf8'));
  slugs = Object.values(r).filter((x) => x.score !== null && x.score < GRAENSE_DAARLIG).map((x) => x.slug);
}
slugs = slugs.filter((s) => fs.existsSync(`${DIR}/${s}.md`));
const doede = new Set(slugs);
const overlever = alle.filter((a) => !doede.has(a.slug));
console.log(`Sletter ${slugs.length} artikler (${DRY ? 'TØR KØRSEL' : 'rigtigt'})\n`);

const fjernede = [];
let linksFjernet = 0;
for (const slug of slugs) {
  const a = laesArtikel(slug);
  const til = bedsteErstatning(a, overlever);
  console.log(`- ${slug}\n    → ${til.url}  (${til.tekst})`);
  fjernede.push({ slug, youtubeId: a.youtubeId, nyUrl: til.url });
  const n = fjernIndgaaendeLinks(slug, { dry: DRY });
  if (n) console.log(`    ${n} indgående link(s) fjernet`);
  linksFjernet += n;
}

const plan = opdaterRedirects(fjernede, { dry: DRY });
console.log(`\n${slugs.length} artikler, ${plan.nyeRegler} nye redirect-regler, ${plan.flyttede} eksisterende regler flyttet med, ${linksFjernet} indgående links fjernet.`);

if (!DRY) {
  for (const { slug } of fjernede) {
    fs.unlinkSync(`${DIR}/${slug}.md`);
    try { fs.unlinkSync(`public/og/${slug}.jpg`); } catch { /* intet billede */ }
  }
  execSync('node sort-redirects.mjs', { stdio: 'inherit' });
  console.log('Gjort. Kør npm run build og commit bagefter.');
}
