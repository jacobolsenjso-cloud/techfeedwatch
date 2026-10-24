// Analyser til Search Console-værktøjerne (24/10-2026). Kører i browseren og i node.
// Alt er simpel, forklarlig regning - siderne viser antagelserne åbent.

// ---------- Quick Wins ----------
// Mål-CTR: sitets EGEN klikrate på søgninger i top 3 (mindst 5 af dem med 20+ visninger).
// Findes det ikke, bruges en antagelse (15 %), som brugeren selv kan ændre.
export function quickWins(data, { minPos = 4, maxPos = 20, minVisninger = 20, maalCtr = null } = {}) {
  const top3 = data.filter((d) => d.placering > 0 && d.placering <= 3 && d.visninger >= 20);
  let kilde = 'assumed', maal = 0.15;
  if (maalCtr != null) { maal = maalCtr; kilde = 'manual'; }
  else if (top3.length >= 5) {
    const v = top3.reduce((s, d) => s + d.visninger, 0);
    maal = v ? top3.reduce((s, d) => s + d.klik, 0) / v : 0.15;
    kilde = 'own';
  }
  const kandidater = data
    .filter((d) => d.placering >= minPos && d.placering <= maxPos && d.visninger >= minVisninger)
    .map((d) => ({ ...d, ekstra: Math.max(0, Math.round(d.visninger * (maal - d.ctr))) }))
    .sort((a, b) => b.ekstra - a.ekstra || b.visninger - a.visninger);
  const lavCtr = data
    .filter((d) => d.placering > 0 && d.placering <= 3 && d.visninger >= minVisninger && d.ctr < maal * 0.5)
    .map((d) => ({ ...d, ekstra: Math.max(0, Math.round(d.visninger * (maal - d.ctr))) }))
    .sort((a, b) => b.ekstra - a.ekstra);
  return { maal, kilde, antalTop3: top3.length, kandidater, lavCtr, totalEkstra: kandidater.reduce((s, d) => s + d.ekstra, 0) };
}

// ---------- Forecast ----------
const mandag = (iso) => { const d = new Date(iso + 'T00:00:00Z'); const dag = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dag); return d.toISOString().slice(0, 10); };
export function forecast(datoer, { uger = 26 } = {}) {
  const rk = [...datoer].sort((a, b) => a.noegle.localeCompare(b.noegle));
  const uge = new Map();
  for (const d of rk) { const k = mandag(d.noegle); const u = uge.get(k) || { start: k, klik: 0, visninger: 0, dage: 0 }; u.klik += d.klik; u.visninger += d.visninger; u.dage++; uge.set(k, u); }
  const hist = [...uge.values()].filter((u) => u.dage === 7);
  if (hist.length < 8) return { fejl: `Need at least 8 complete weeks of daily data - this file has ${hist.length}. Export the last 3, 6 or 12 months from the Search Console performance report.` };
  const n = hist.length, xs = hist.map((_, i) => i), ys = hist.map((u) => u.klik);
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  const b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const a = my - b * mx;
  const sd = Math.sqrt(ys.reduce((s, y, i) => s + (y - (a + b * xs[i])) ** 2, 0) / Math.max(1, n - 2));
  const frem = Array.from({ length: uger }, (_, i) => {
    const x = n + i, y = Math.max(0, a + b * x);
    const start = new Date(hist[n - 1].start + 'T00:00:00Z'); start.setUTCDate(start.getUTCDate() + 7 * (i + 1));
    return { start: start.toISOString().slice(0, 10), klik: y, lav: Math.max(0, y - 1.96 * sd), hoej: y + 1.96 * sd };
  });
  const sum = (k) => frem.slice(0, k).reduce((s, f) => s + f.klik, 0);
  const sidste4 = ys.slice(-4).reduce((s, y) => s + y, 0);
  return { hist, frem, a, b, sd, ugerData: n, sum4: sum(4), sum13: sum(13), sum26: sum(26), sidste4, procentPrUge: my ? (b / my) * 100 : 0 };
}

// ---------- Topic Map ----------
const STOP = new Set('a an the and or of to for in on at by with from as is are was were be been being do does did can could should would will i you me my your we our it its this that these those what whats how why when where which who whom vs versus about into than then there their they them not no yes if so just best top good new free use using get make also more most very really ever 2024 2025 2026 near'.split(' '));
// Beskrivende ord, der går igen på tværs af emner. De må gerne stå i søgningen, men må
// ikke blive gruppens emne (målt i test 24/10: "explained" slugte "quantum computing explained").
const MODIFIKATORER = new Set('explained explain explanation work works working meaning mean definition define example examples guide tutorial price prices cost costs review reviews pro pros con cons benefit benefits used uses beginner beginners simple easy list type types difference between way ways step steps tip tips idea ideas really actually important need'.split(' '));
const ental = (w) => (w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is') ? w.slice(0, -1) : w);
// Indholdsord i rækkefølge (til navne med to ord) og som mængde (til gruppering).
const ordFolge = (q) => String(q).toLowerCase().replace(/[^a-z0-9æøå\s-]/g, ' ').split(/\s+/).map((w) => w.replace(/^-+|-+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w)).map(ental);
export const tokens = (q) => [...new Set(ordFolge(q))];
const emneOrd = (q) => tokens(q).filter((w) => !MODIFIKATORER.has(w));

export function klynger(data) {
  const vaegt = new Map();
  for (const d of data) for (const t of emneOrd(d.noegle)) vaegt.set(t, (vaegt.get(t) || 0) + Math.max(1, d.visninger));
  const grupper = new Map();
  for (const d of data) {
    const alle = tokens(d.noegle);
    const tk = emneOrd(d.noegle).length ? emneOrd(d.noegle) : alle;
    const hoved = tk.length ? tk.reduce((best, t) => ((vaegt.get(t) || 0) > (vaegt.get(best) || 0) ? t : best), tk[0]) : '(other)';
    const g = grupper.get(hoved) || { emne: hoved, sporgsmaal: [], klik: 0, visninger: 0, posVaegt: 0, under: new Map() };
    g.sporgsmaal.push(d); g.klik += d.klik; g.visninger += d.visninger; g.posVaegt += d.placering * Math.max(1, d.visninger);
    for (const t of tk) if (t !== hoved) g.under.set(t, (g.under.get(t) || 0) + Math.max(1, d.visninger));
    grupper.set(hoved, g);
  }
  return [...grupper.values()].map((g) => {
    const vSum = g.sporgsmaal.reduce((s, d) => s + Math.max(1, d.visninger), 0);
    const pos = vSum ? g.posVaegt / vSum : 0;
    const handling = pos > 10 ? 'Write a dedicated article' : pos > 3 ? 'Improve and expand the page' : 'Keep it updated';
    // Navn: det hyppigste ordpar med hovedordet, hvis det står i mindst halvdelen af søgningerne.
    const par = new Map();
    for (const d of g.sporgsmaal) {
      const f = ordFolge(d.noegle), set = new Set();
      for (let i = 0; i < f.length - 1; i++) if ((f[i] === g.emne || f[i + 1] === g.emne) && !MODIFIKATORER.has(f[i]) && !MODIFIKATORER.has(f[i + 1])) set.add(`${f[i]} ${f[i + 1]}`);
      for (const p of set) par.set(p, (par.get(p) || 0) + 1);
    }
    const [bedstePar, parAntal] = [...par.entries()].sort((a, b) => b[1] - a[1])[0] || ['', 0];
    const navn = parAntal >= Math.max(2, g.sporgsmaal.length / 2) ? bedstePar : g.emne;
    return {
      emne: navn, antal: g.sporgsmaal.length, klik: g.klik, visninger: g.visninger, placering: pos, handling,
      underemner: [...g.under.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t),
      top: [...g.sporgsmaal].sort((a, b) => b.visninger - a.visninger).slice(0, 5),
    };
  }).sort((a, b) => b.visninger - a.visninger);
}
