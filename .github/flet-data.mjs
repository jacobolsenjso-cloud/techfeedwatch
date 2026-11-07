// Fletter én datafil (src/data/*.json eller *.jsonl), når to robotkørsler har ændret den samtidig (7/11-2026).
// Kaldes af .github/udgiv.sh midt i en "git pull --rebase" med konflikt. Git har tre udgaver:
//   :1 = fælles udgangspunkt, :2 = main (den anden kørsels arbejde), :3 = denne kørsels arbejde.
// Regel: det, main har tilføjet eller ændret siden udgangspunktet, beholdes; det, denne kørsel har tilføjet
// eller ændret, beholdes; ændrer begge det samme felt, vinder denne kørsel (samme regel som techmediaarch 4/11).
// Resultatet skal kunne læses (JSON.parse), ellers afslutter scriptet med kode 1, og intet udgives.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const fil = process.argv[2];
if (!fil) { console.error('brug: node .github/flet-data.mjs <fil>'); process.exit(2); }
const udgave = (n) => { try { return execFileSync('git', ['show', `:${n}:${fil}`], { encoding: 'utf8', maxBuffer: 1e8 }); } catch { return null; } };
const [base, main, koersel] = [udgave(1), udgave(2), udgave(3)];
if (main === null || koersel === null) { console.error(`${fil}: mangler en udgave`); process.exit(1); }
const nøgle = (x) => JSON.stringify(x);

function fletLister(b, m, k) {
  // Elementer, main har fået siden udgangspunktet, og som kørslen ikke allerede har, sættes bagerst.
  const iBase = new Set((b || []).map(nøgle));
  const iKoersel = new Set(k.map(nøgle));
  return [...k, ...m.filter((x) => !iBase.has(nøgle(x)) && !iKoersel.has(nøgle(x)))];
}
function fletObjekter(b, m, k) {
  const ud = { ...k };
  for (const n of new Set([...Object.keys(b || {}), ...Object.keys(m)])) {
    const iB = b && n in b, iM = n in m, iK = n in k;
    const mAendret = !iB ? iM : (!iM || nøgle(m[n]) !== nøgle(b[n]));
    const kUroert = iB ? (iK && nøgle(k[n]) === nøgle(b[n])) : !iK;
    if (!mAendret || !kUroert) continue; // main rørte den ikke, eller kørslen ændrede den selv (kørslen vinder)
    if (iM) ud[n] = m[n]; else delete ud[n]; // main tilføjede/ændrede eller slettede den
  }
  return ud;
}

let resultat;
if (fil.endsWith('.jsonl')) {
  const linjer = (t) => String(t || '').split('\n').filter((l) => l.trim());
  const ud = fletLister(linjer(base), linjer(main), linjer(koersel));
  for (const l of ud) JSON.parse(l); // hver linje skal kunne læses
  resultat = ud.join('\n') + '\n';
} else {
  const [b, m, k] = [base === null ? null : JSON.parse(base), JSON.parse(main), JSON.parse(koersel)];
  const ud = Array.isArray(m) && Array.isArray(k) ? fletLister(b, m, k)
    : (m && k && typeof m === 'object' && typeof k === 'object' && !Array.isArray(m) && !Array.isArray(k)) ? fletObjekter(b, m, k)
    : k;
  resultat = JSON.stringify(ud, null, 2) + (koersel.endsWith('\n') ? '\n' : '');
  JSON.parse(resultat);
}
fs.writeFileSync(fil, resultat);
console.log(`${fil}: flettet (main + denne kørsel)`);
