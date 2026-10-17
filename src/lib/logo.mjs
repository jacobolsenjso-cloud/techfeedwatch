// TechFeedWatch-logoet ét sted (17/10-2026, Jacob valgte udkast 2 "app-ikon").
// Et afrundet app-ikon i cyan -> blå -> violet med tre nyhedslinjer og en cyan "live"-prik.
// Bruges af lav-ikoner.mjs (favicon, app-ikoner, standard-delekort), og samme tegning står i
// MainLayout (toppen) og og-card.mjs (delekort). Ren JavaScript, ingen afhængigheder.
//
// Farvesættet (samme dag):
//   cyan #22D3EE · blå #2563EB · violet #7C3AED · blæk #0B1020
//   links #1D4ED8 (lys) / #67E8F9 (mørk) · hovedknapper #6D28D9 (lys) / #7C3AED (mørk)

export const FARVER = { cyan: '#22d3ee', blaa: '#2563eb', violet: '#7c3aed', blaek: '#0b1020' };

// Ikonets indhold i et 90x90-felt. lille = tykkere linjer og større prik til 16-48 px
// (ellers bliver 8-enheders linjer under 1,5 pixel og grumsede).
export function ikonIndhold({ id = 'tfwIkon', lille = false, fuldflade = false, skala = 1 } = {}) {
  const t = lille ? 12 : 8, r = lille ? 4 : 4;
  const y = lille ? [24, 41, 58] : [28, 42, 56];
  const b = lille ? [36, 50, 26] : [30, 44, 22];
  const prik = lille ? { cx: 66, cy: 26, r: 9, s: 3 } : { cx: 66, cy: 28, r: 7, s: 3 };
  // skala < 1 = indholdet trækkes ind mod midten (maskable-ikon: alt vigtigt i 80 % sikker zone)
  const tr = skala === 1 ? '' : ` transform="translate(${45 * (1 - skala)} ${45 * (1 - skala)}) scale(${skala})"`;
  const flade = fuldflade
    ? `<rect width="90" height="90" fill="url(#${id})"/>`
    : `<rect x="4" y="4" width="82" height="82" rx="22" fill="url(#${id})"/>`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${FARVER.cyan}"/><stop offset="0.55" stop-color="${FARVER.blaa}"/><stop offset="1" stop-color="${FARVER.violet}"/></linearGradient></defs>` +
    flade +
    `<g${tr}>` +
    `<rect x="20" y="${y[0]}" width="${b[0]}" height="${t}" rx="${r}" fill="#fff"/>` +
    `<rect x="20" y="${y[1]}" width="${b[1]}" height="${t}" rx="${r}" fill="#fff" opacity="0.85"/>` +
    `<rect x="20" y="${y[2]}" width="${b[2]}" height="${t}" rx="${r}" fill="#fff" opacity="0.65"/>` +
    `<circle cx="${prik.cx}" cy="${prik.cy}" r="${prik.r}" fill="${FARVER.cyan}" stroke="#fff" stroke-width="${prik.s}"/>` +
    `</g>`;
}

export function ikonSvg(storrelse = 90, valg = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${storrelse}" height="${storrelse}" viewBox="0 0 90 90">${ikonIndhold(valg)}</svg>`;
}
