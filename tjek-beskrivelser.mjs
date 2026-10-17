// Kører efter hvert build (17/10-2026): advarer om sidebeskrivelser over 160 tegn, som Google
// skærer af med "...". Stopper ALDRIG buildet - en advarsel må ikke blokere robottens udgivelser.
import fs from 'node:fs';
import path from 'node:path';

const GRAENSE = 160;
try {
  const sider = [];
  const gaa = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); fs.statSync(p).isDirectory() ? gaa(p) : n === 'index.html' && sider.push(p); } };
  gaa('dist');
  const lange = [];
  for (const p of sider) {
    const h = fs.readFileSync(p, 'utf8');
    if (/<meta name="robots" content="[^"]*noindex/.test(h)) continue; // vises ikke i Google
    const m = h.match(/<meta name="description" content="([^"]*)"/);
    if (!m) continue;
    // HTML-tegn tælles som ét tegn, som Google ser dem
    const tekst = m[1].replace(/&(amp|lt|gt|quot|#39|apos);/g, 'x');
    if (tekst.length > GRAENSE) lange.push(`${tekst.length}  /${path.relative('dist', path.dirname(p)).split(path.sep).join('/')}/`);
  }
  if (lange.length) {
    console.log(`⚠️ ${lange.length} sidebeskrivelse(r) over ${GRAENSE} tegn (Google afkorter):`);
    lange.forEach((l) => console.log('   ' + l));
  } else {
    console.log(`Beskrivelser: alle ${sider.length} sider er højst ${GRAENSE} tegn`);
  }
} catch (e) {
  console.log('tjek-beskrivelser kunne ikke køre: ' + e.message);
}
process.exit(0);
