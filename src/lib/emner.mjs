// Sitets emner ét sted (17/10-2026). Ren JavaScript, så både robotten (Node),
// astro.config.mjs (sitemap) og siderne kan bruge samme liste og samme grænser.
//
// Jacob 17/10: flere emner med selvstændig relevans. De fem nye starter tynde,
// så de får to særregler, indtil de har artikler nok:
//   - under INDEX_GRAENSE artikler: emnesiden er noindex, står ikke i sitemappet
//     og viser teksten "We're building this topic right now".
//   - under VOKSE_GRAENSE artikler: robotten giver de voksende emner hver anden
//     artikel, så de vokser hurtigt UDEN at de gamle 13 emner går i stå.

export const GAMLE_EMNER = ['AI & Tech', 'SEO', 'Automation', 'Coding', 'Business & Money', 'AI Video', 'Productivity', 'Fintech', 'Crypto', 'Cybersecurity', 'Quantum Computing', 'Hardware & Chips', 'AR & VR'];
export const NYE_EMNER = ['AI Agents', 'Investing & Trading', 'Smartphones & Gadgets', 'Robotics', 'PC Building & Gaming'];
export const ALLE_EMNER = [...GAMLE_EMNER, ...NYE_EMNER];

// Under 8 artikler er en emneside en tynd liste - Google og AdSense ser den som "intet indhold".
export const INDEX_GRAENSE = 8;
// Under 20 artikler får et nyt emne hver anden artikel fra robotten.
export const VOKSE_GRAENSE = 20;

// Samme slug som src/lib/tags.ts (tagSlug): "Investing & Trading" -> "investing-trading".
export const emneSlug = (emne) => String(emne).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Robottens rækkefølge af emner for én kørsel.
//  counts:  { emne: antal artikler }
//  antal:   alle artikler i alt - lige tal = de voksende emners tur, ulige = de gamles.
//           Hver udgivet artikel skifter tallet, så turen skifter efter hver udgivelse.
//  slot:    afgør uafgjort (samme antal), så to kørsler i træk ikke vælger det samme.
// Første emne = det tyndeste i gruppen, der har tur. Andet emne = det tyndeste i den
// ANDEN gruppe - så en kørsel, hvor de nye emner ikke giver en artikel, stadig kan
// give en til de gamle (ingen af grupperne kan sulte).
export function emneRaekke(counts, antal, slot = 0) {
  const emner = Object.keys(counts);
  const tyndesteFoerst = (liste) => {
    const sorteret = [...liste].sort((a, b) => counts[a] - counts[b]);
    if (!sorteret.length) return sorteret;
    const min = counts[sorteret[0]];
    const lige = sorteret.filter((e) => counts[e] === min);
    const foerste = lige[slot % lige.length];
    return [foerste, ...sorteret.filter((e) => e !== foerste)];
  };
  const voksende = emner.filter((e) => NYE_EMNER.includes(e) && counts[e] < VOKSE_GRAENSE);
  if (!voksende.length) return tyndesteFoerst(emner);
  // Aftalt med Jacob: hver anden artikel til de GAMLE 13. Et nyt emne over grænsen
  // (fx AI Agents med 33) deltager ikke i turene, men får igen artikler, når fasen er slut.
  const oevrige = emner.filter((e) => GAMLE_EMNER.includes(e));
  const [harTur, venter] = antal % 2 === 0 ? [voksende, oevrige] : [oevrige, voksende];
  const a = tyndesteFoerst(harTur), b = tyndesteFoerst(venter);
  const raekke = [a[0], b[0]].filter(Boolean);
  return [...raekke, ...tyndesteFoerst(emner.filter((e) => !raekke.includes(e)))];
}
