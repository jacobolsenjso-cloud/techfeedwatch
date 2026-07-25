// Engangs-script: markerer alle normale artikler uden revised-flag som revised: true.
// Bruges til de nyeste artikler, der ALLEREDE er lavet med 6-profil-systemet og derfor
// ikke skal genskrives - så revise-articles.mjs holder op med at prøve dem.
import fs from 'fs';
const DIR = './src/content/videos';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
let n = 0;
for (const f of files) {
  const p = `${DIR}/${f}`;
  const c = fs.readFileSync(p, 'utf-8');
  if (/isShort:\s*true/.test(c)) continue;
  if (/revised:\s*true/.test(c)) continue;
  const nc = c.replace(/(isShort:\s*false\s*\r?\n)/, `$1revised: true\n`);
  if (nc !== c) { fs.writeFileSync(p, nc); n++; console.log('markeret:', f); }
}
console.log('I alt markeret:', n);
