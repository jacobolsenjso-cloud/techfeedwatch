// Måler om der er søge-efterspørgsel bag artiklernes overskrifter.
// Spørger Googles autocomplete (samme kilde som robotten bruger i src/lib/suggest.mjs).
// Læser kun. Output: _demand.json + kort opsummering i konsollen.
//
// Hvorfor: en artikel kan være velskrevet og stadig usynlig, hvis ingen
// søger på det overskriften handler om. Autocomplete er det gratis
// fingerpeg vi har på, hvad folk faktisk skriver i Google.
import fs from 'fs';
import path from 'path';

const dir = 'src/content/videos';
const STOP = new Set('the a an of in on for to and or with your you how what why is are its it this that from by as at vs into new now'.split(' '));
const sig = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 2 && !STOP.has(w)); // 'ai' er 2 bogstaver og må ikke ryge ud

async function suggest(q) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    return (j[1] || []).map((s) => s.toLowerCase());
  } catch { return null; }
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
const rows = [];
let n = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const fm = src.split(/^---\s*$/m)[1] || '';
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) || [])[1];
  const title = get('title') || '';
  const tq = get('targetQuestion');
  const isShort = /^isShort:\s*true/m.test(fm);
  if (isShort) continue;
  // Overskriften uden kolon-hale, de første 4 betydende ord som forespørgsel
  const head = title.split(':')[0];
  const words = sig(head);
  const q = words.slice(0, 4).join(' ');
  const s = q ? await suggest(q) : null;
  await new Promise((r) => setTimeout(r, 250));
  let tqHit = null;
  if (tq) {
    // Præfiks = spørgsmålet uden sidste ord — sådan ser Google det, mens man skriver
    const s2 = await suggest(tq.split(' ').slice(0, -1).join(' '));
    await new Promise((r) => setTimeout(r, 250));
    tqHit = s2 ? s2.some((x) => x === tq.toLowerCase() || x.startsWith(tq.toLowerCase())) : null;
  }
  // Match: mindst 2 betydende ord fra overskriften går igen i et forslag
  const hit = s ? s.filter((x) => { const w = sig(x); return words.filter((v) => w.includes(v)).length >= 2; }) : [];
  rows.push({ file: f, title, tq: tq || null, tqHit, q, suggestions: s, hits: hit, ok: s !== null });
  n++;
  if (n % 25 === 0) console.log(n, 'af', files.length);
}
fs.writeFileSync('_demand.json', JSON.stringify(rows, null, 1));
const ok = rows.filter((r) => r.ok);
console.log('artikler:', rows.length, ' svar fra Google:', ok.length);
console.log('overskrifter med mindst ét beslægtet forslag:', ok.filter((r) => r.hits.length).length);
console.log('overskrifter uden noget beslægtet forslag:', ok.filter((r) => !r.hits.length).length);
const tqs = rows.filter((r) => r.tq);
console.log('artikler med targetQuestion:', tqs.length, ' spørgsmålet findes stadig i autocomplete:', tqs.filter((r) => r.tqHit).length);
