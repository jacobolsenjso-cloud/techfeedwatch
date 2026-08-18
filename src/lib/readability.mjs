// Måler læsbarhed (Flesch Reading Ease) på artiklerne.
//
// 60-70 er "plain English" — det de fleste voksne læser ubesværet. Under 50
// kræver en uddannelse; over 80 er børnebogsniveau.
//
// Formlen: 206.835 - 1.015*(ord/sætninger) - 84.6*(stavelser/ord)
// To ting driver den: lange sætninger og lange ord. Ingen af delene er onde i
// sig selv, men tilsammen gør de en tekst tung.
//
// Stavelsestælling er et skøn — engelsk har ingen enkel regel. Heuristikken
// nedenfor rammer inden for et par procent på almindelig prosa, og det er
// præcist nok til at se om vi ligger på 45 eller 65.
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/videos';

export function stavelser(ord) {
  let o = ord.toLowerCase().replace(/[^a-z]/g, '');
  if (!o) return 0;
  if (o.length <= 3) return 1;

  // Stumt e til sidst tæller ikke: "make" = 1, "creates" = 2.
  // Første udgave fjernede også konsonanten foran ("create" -> "crea" = 1),
  // hvilket undertalte alle ord på -ate, -ite, -ize. Kun e'et fjernes nu, og
  // ikke når det bæres af -le ("table" = 2).
  o = o.replace(/(?<![aeiouy])e?s$/, '');
  if (!/[aeiouy]le$/.test(o)) o = o.replace(/(?<=[^aeiouy])e$/, '');
  o = o.replace(/^y/, '');

  let n = (o.match(/[aeiouy]+/g) || []).length;

  // Nogle vokalpar udtales som to stavelser men tælles som én gruppe:
  // "idea", "create", "various", "video". Hvert fund lægger én til.
  n += (o.match(/ea|ia|io|ua|eo|ii|uu/g) || []).length;

  return Math.max(1, n);
}

export function flesch(tekst) {
  // Markdown-støj væk: overskrifter, links, punktopstilling, fed skrift.
  const ren = tekst
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>]/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();

  const saetninger = (ren.match(/[.!?]+(?=\s|$)/g) || []).length || 1;
  const ord = ren.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (!ord.length) return null;
  const stav = ord.reduce((s, w) => s + stavelser(w), 0);

  return {
    score: 206.835 - 1.015 * (ord.length / saetninger) - 84.6 * (stav / ord.length),
    // Flesch-Kincaid klassetrin: samme to input, oversat til amerikansk
    // skoletrin. 8 betyder at en typisk 13-14-årig kan læse teksten.
    // Mere brugbart end scoren, fordi det siger noget konkret om hvem.
    klassetrin: 0.39 * (ord.length / saetninger) + 11.8 * (stav / ord.length) - 15.59,
    ordPrSaetning: ord.length / saetninger,
    stavPrOrd: stav / ord.length,
    ord: ord.length,
  };
}

// Latinsk fyld med almindelige alternativer.
//
// Fagord kan ikke laves om — "authentication" og "infrastructure" hedder det
// de hedder. Men det meste af en artikel er ikke fagord; det er bindeled, og
// dér ligger gevinsten. "shows promise" er både kortere OG klarere end
// "demonstrates significant potential".
//
// Ordklassen SKAL bevares. Listen sendes som instruktion til modellen, og
// den bytter mekanisk. Da "capabilities" stod som 'what it can do' skrev
// den "AI what it can do" og "Offline what it can do" — 31 artikler, og alle
// automatiske kontroller bestod. Substantiv byttes til substantiv, adverbium
// til adverbium. En sætning kan aldrig stå i stedet for et ord.
export const TUNGE_ORD = {
  utilize: 'use', utilizes: 'uses', utilizing: 'using',
  approximately: 'about', additionally: 'also', furthermore: 'and',
  facilitate: 'help', facilitates: 'helps', demonstrates: 'shows',
  individuals: 'people', numerous: 'many', substantial: 'large',
  fundamental: 'basic', significant: 'major', significantly: 'greatly',
  implementation: 'setup', capabilities: 'abilities',
  functionality: 'features', methodologies: 'methods',
  subsequently: 'then', consequently: 'so', nevertheless: 'but',
  encompasses: 'covers', necessitates: 'needs', predominantly: 'mostly',
  ultimately: 'in the end', comprehensive: 'complete', optimal: 'best',
  leverage: 'use', leveraging: 'using', initiatives: 'efforts',
};
