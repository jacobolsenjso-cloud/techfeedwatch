// Selvtest af noindex for gamle artikler (src/lib/noindex-gamle.mjs, 13/11-2026). Kør: node test-noindex-gamle.mjs
// Måler også på de rigtige artikler: hvor mange får noindex, og ingen Google-vist artikel må få det.
import fs from 'node:fs';
import { venterPaaOmskrivning, venterPaaOmskrivningFil } from './src/lib/noindex-gamle.mjs';
let fejl = 0;
const t = (navn, ok) => { console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}`); if (!ok) fejl++; };
const vist = JSON.parse(fs.readFileSync('src/data/omskriv-prioritet.json', 'utf8')).slugs;
t('ny opskrift (recipe 3) må indekseres', venterPaaOmskrivning({ recipe: 3 }, 'x') === false && venterPaaOmskrivning({ recipe: '3' }, 'x') === false);
t('gammel opskrift, ikke vist af Google = noindex', venterPaaOmskrivning({}, 'findes-ikke-paa-listen') === true);
t('gammel opskrift, VIST af Google = må indekseres', venterPaaOmskrivning({}, vist[0]) === false);
t('Shorts styres for sig (ikke denne regel)', venterPaaOmskrivning({ isShort: true }, 'x') === false);
const D = 'src/content/videos';
const filer = fs.readdirSync(D).filter((f) => f.endsWith('.md'));
const ventende = filer.filter((f) => venterPaaOmskrivningFil(`${D}/${f}`));
const ny = filer.filter((f) => /^recipe:\s*3\b/m.test(fs.readFileSync(`${D}/${f}`, 'utf8')));
t(`ingen Google-vist artikel får noindex (${vist.filter((s) => ventende.includes(`${s}.md`)).length})`, vist.every((s) => !ventende.includes(`${s}.md`)));
t(`ingen artikel med ny opskrift får noindex`, ny.every((f) => !ventende.includes(f)));
console.log(`Måling: ${filer.length} artikler · ${ny.length} ny opskrift · ${ventende.length} får noindex · ${filer.length - ventende.length} må indekseres`);
console.log(fejl ? `${fejl} FEJL` : 'alt OK'); process.exit(fejl ? 1 : 0);
