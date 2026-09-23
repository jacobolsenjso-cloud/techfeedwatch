// Stempler service workeren med buildets eget id efter et build.
//
// Baggrund: cachen hed 'tfw-v2' og skiftede aldrig. Stylesheets har et hash i
// navnet og skifter ved hvert build, så en gemt HTML fra et gammelt deploy
// pegede på filer der ikke fandtes mere. Svigter nettet et øjeblik, serveres
// den gamle side — og artiklen kommer op helt uden sidens CSS.
//
// Service workeren opdager kun sig selv som ny hvis FILEN har ændret sig. Derfor
// skal versionen skrives ind efter buildet, ikke stå fast i kilden.
//
// Kører automatisk som en del af `npm run build`.
import fs from 'node:fs';
import crypto from 'node:crypto';

const SRC = 'public/sw.js';
const OUT = 'dist/sw.js';

if (!fs.existsSync(OUT)) {
  console.error(`${OUT} findes ikke — kør efter astro build.`);
  process.exit(1);
}

// Id'et bygges på indholdet af de byggede stylesheets. Ændrer de sig ikke,
// ændrer versionen sig heller ikke, og brugernes cache overlever unødige
// deploys. Ændrer de sig, ryddes alt fra før automatisk.
//
// Rettet 23/9: siden 27/8 inlines al CSS (astro.config.mjs), så der ER ingen
// .css-filer i dist/_astro. Id'et blev derfor hash af en tom streng —
// 'da39a3ee5e' ved hvert eneste build — og service workeren skiftede aldrig.
// Nu tæller alle filer i _astro (scripts og skrifttyper har også hash i
// navnet). Er mappen tom eller væk, bruges tidspunktet, så id'et ALDRIG
// kan fryse igen.
const filer = fs.existsSync('dist/_astro') ? fs.readdirSync('dist/_astro').sort() : [];
const assets = filer.length ? filer.join('|') : String(Date.now());
const buildId = crypto.createHash('sha1').update(assets).digest('hex').slice(0, 10);

const src = fs.readFileSync(SRC, 'utf8');
if (!src.includes('__BUILD_ID__')) {
  console.error('public/sw.js indeholder ikke __BUILD_ID__ — stemplet ville gøre ingenting.');
  process.exit(1);
}

fs.writeFileSync(OUT, src.replaceAll('__BUILD_ID__', buildId), 'utf8');
console.log(`sw.js stemplet med tfw-${buildId} (fra ${filer.length} filer i _astro)`);
