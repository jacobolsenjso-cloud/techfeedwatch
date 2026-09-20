// Fælles regler for at fjerne en artikel, så sitet ikke efterlades med huller.
//
// Hvorfor filen findes: 20/9-2026 blev det målt, at 38 gamle adresser sendte
// Google videre til en 404. `prune-deleted-videos.mjs` havde slettet to artikler
// uden at skrive 301'er, og 36 eksisterende 301-regler pegede på den ene af dem.
// To ting skal altså ske ved enhver sletning, og kun den første stod i
// `slet-artikler.mjs`:
//   1) Den slettede artikels egne adresser får en 301 til nærmeste levende
//      artikel (/video/<slug>, med og uden skråstreg, plus /video/<youtubeId>).
//   2) EKSISTERENDE regler, der pegede på den slettede artikel, flyttes med.
//      Ellers peger de ind i et hul. De flyttes DIREKTE til det nye mål, ikke
//      via den slettede adresse — så der ikke opstår en kæde med to hop.
//
// `slet-artikler.mjs` har stadig kun punkt 1 og bør flyttes over på dette modul.
import fs from 'fs';
import { faellesOrd } from './question.mjs';

const DIR = 'src/content/videos';
const REDIRECTS = 'public/_redirects';

// Samme regel som src/lib/tags.ts (tagSlug) — kopieret, fordi .ts ikke kan importeres her.
export function tagSlug(tag) {
  return String(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function laesArtikel(slug, dir = DIR) {
  const raw = fs.readFileSync(`${dir}/${slug}.md`, 'utf8');
  const f = (k) => raw.match(new RegExp(`^${k}:\\s*"(.*?)"`, 'm'))?.[1] || '';
  const tags = [...raw.matchAll(/^\s+-\s+"(.*?)"/gm)].map((m) => m[1]);
  return { slug, youtubeId: f('youtubeId'), targetQuestion: f('targetQuestion'), title: f('title'), date: f('date'), tags };
}

export function alleArtikler(dir = DIR) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => laesArtikel(f.replace(/\.md$/, ''), dir));
}

// Bedste erstatning: samme primære emne, flest fælles ord med søgespørgsmålet,
// nyeste som tie-break. Deler ingen artikel et eneste ord med spørgsmålet, er en
// tilfældig artikel i emnet et dårligt mål for læseren — så peger vi på
// emnesiden i stedet. (Reglen er taget fra slet-artikler.mjs, uændret.)
export function bedsteErstatning(a, overlever) {
  const emne = a.tags[0];
  const kand = overlever.filter((b) => b.tags.includes(emne));
  const pulje = kand.length ? kand : overlever;
  if (!pulje.length) return { url: '/latest/', tekst: 'seneste artikler (ingen kandidater)' };
  const bedste = pulje
    .map((b) => ({ b, score: a.targetQuestion && b.targetQuestion ? faellesOrd(a.targetQuestion, b.targetQuestion) : 0 }))
    .sort((x, y) => y.score - x.score || y.b.date.localeCompare(x.b.date))[0];
  if (!bedste || bedste.score === 0) {
    return emne
      ? { url: `/tag/${tagSlug(emne)}/`, tekst: `emnesiden ${emne}` }
      : { url: '/latest/', tekst: 'seneste artikler (intet emne)' };
  }
  return { url: `/video/${bedste.b.slug}/`, tekst: `${bedste.b.tags[0]}, "${bedste.b.targetQuestion || bedste.b.title}"` };
}

// Indgående links fra andre sider fjernes, så der ikke opstår 404'er inde på
// sitet (fejlen fra august: 589 døde links). Linkteksten bliver stående.
export function fjernIndgaaendeLinks(slug, { dry = false } = {}) {
  const re = new RegExp(`\\[([^\\]]*)\\]\\(/video/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?\\)`, 'g');
  const mapper = ['src/content/videos', 'src/content/guides', 'src/content/glossary'];
  let fjernet = 0;
  for (const d of mapper) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const fil = `${d}/${f}`;
      if (fil.endsWith(`/${slug}.md`)) continue;
      const t = fs.readFileSync(fil, 'utf8');
      const n = (t.match(re) || []).length;
      if (!n) continue;
      fjernet += n;
      if (!dry) fs.writeFileSync(fil, t.replace(re, '$1'), 'utf8');
    }
  }
  return fjernet;
}

/**
 * Opdaterer _redirects for et sæt fjernede artikler.
 * fjernede: [{ slug, youtubeId, nyUrl }]
 * Returnerer { nyeRegler, flyttede } — flyttede er eksisterende regler, hvis
 * mål pegede på en af de fjernede artikler og nu er flyttet direkte videre.
 */
export function opdaterRedirects(fjernede, { dry = false, sti = REDIRECTS } = {}) {
  const nytMaal = new Map();           // "<slug>" -> ny url
  for (const f of fjernede) nytMaal.set(f.slug, f.nyUrl);

  const linjer = fs.readFileSync(sti, 'utf8').split('\n');
  let flyttede = 0;
  for (let i = 0; i < linjer.length; i++) {
    const p = linjer[i].split(/\s+/);
    if (p.length < 3 || p[2] !== '301' || !p[1].startsWith('/video/')) continue;
    const maalSlug = p[1].replace(/\/$/, '').slice('/video/'.length);
    const ny = nytMaal.get(maalSlug);
    // Peger reglen på en artikel, vi fjerner nu? Flyt den direkte til det nye
    // mål — ikke via den døde adresse, så der ikke opstår en kæde.
    if (ny && ny !== p[1]) { linjer[i] = `${p[0]} ${ny} 301`; flyttede++; }
  }

  const nye = [];
  for (const f of fjernede) {
    nye.push(`/video/${f.slug} ${f.nyUrl} 301`, `/video/${f.slug}/ ${f.nyUrl} 301`);
    if (f.youtubeId) nye.push(`/video/${f.youtubeId} ${f.nyUrl} 301`, `/video/${f.youtubeId}/ ${f.nyUrl} 301`);
  }

  if (!dry) {
    const ud = linjer.join('\n').replace(/\n+$/, '\n') + nye.join('\n') + '\n';
    fs.writeFileSync(sti, ud, 'utf8');
  }
  return { nyeRegler: nye.length, flyttede };
}
