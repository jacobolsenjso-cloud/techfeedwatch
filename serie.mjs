// Måleserien fra Search Console — viser udviklingen og siger fra ved uorden.
//
// HVORFOR DEN FINDES: 21/9-2026 havde vi præcis ét tal — 82 indekserede sider
// af 845 — og vi opdagede det først, fordi Jacob loggede ind og kiggede. Uden
// en RÆKKE tal kan vi aldrig afgøre, om noget af det, vi bygger, virker; vi
// ender med at huske forkert og skændes om det. Det skete allerede én gang
// samme formiddag, hvor jeg tog fejl og Jacob havde ret.
//
// Serien afgør ikke hvorfor noget sker. Den holder os ærlige om HVAD der sker.
//
// Tallene tastes ikke fra hukommelsen. De aflæses i Search Console og skrives
// i search-console-serie.json samme dag.
//
// Brug:
//   node serie.mjs            viser hele serien og ændringen siden sidst
//   node serie.mjs --tjek     kun kontrollerne, ingen tabel (til et workflow)

import fs from 'node:fs';

const FIL = 'search-console-serie.json';
const kunTjek = process.argv.includes('--tjek');

const data = JSON.parse(fs.readFileSync(FIL, 'utf8'));
const p = data.punkter;
if (!p.length) { console.error('❌ Serien er tom.'); process.exit(1); }

// --- kontroller: en måling, der ikke hænger sammen, er værre end ingen ---
const fejl = [];
let sidsteDato = '';
for (const x of p) {
  const sum = Object.values(x.aarsager).reduce((a, b) => a + b, 0);
  // Søgekonsollens opdeling SKAL summe til totalen. Gør den ikke det, er en
  // årsag tastet forkert eller glemt — og så er hele punktet upålideligt.
  if (sum !== x.ikkeIndekseret) {
    fejl.push(`${x.dato}: årsagerne summer til ${sum}, men ikkeIndekseret er ${x.ikkeIndekseret} (forskel ${sum - x.ikkeIndekseret})`);
  }
  // Klikraten skal passe til klik og eksponeringer. Et punkt, hvor de tre tal
  // modsiger hinanden, er skrevet af forkert.
  const e = x.effektivitet;
  if (e.eksponeringer > 0) {
    const beregnet = (e.klik / e.eksponeringer) * 100;
    if (Math.abs(beregnet - e.klikrate) > 0.6) {
      fejl.push(`${x.dato}: ${e.klik} klik af ${e.eksponeringer} eksponeringer giver ${beregnet.toFixed(1)} %, men der står ${e.klikrate} %`);
    }
  }
  if (x.dato <= sidsteDato) fejl.push(`${x.dato}: punkterne står ikke i dato-rækkefølge`);
  sidsteDato = x.dato;
}

if (!kunTjek) {
  const kol = (s, n) => String(s).padStart(n);
  console.log('\nSøgekonsollen over tid — techfeedwatch.com\n');
  console.log('  dato         indekseret   ikke indekseret   klik   eksponeringer   klikrate   position');
  console.log('  ' + '-'.repeat(88));
  for (const x of p) {
    const e = x.effektivitet;
    console.log(`  ${x.dato}  ${kol(x.indekseret, 10)}   ${kol(x.ikkeIndekseret, 15)}   ${kol(e.klik, 4)}   ${kol(e.eksponeringer, 13)}   ${kol(e.klikrate + ' %', 8)}   ${kol(e.position, 8)}`);
  }

  if (p.length >= 2) {
    const a = p[p.length - 2], b = p[p.length - 1];
    const pil = (n) => (n > 0 ? `+${n}` : String(n));
    console.log(`\n  Siden ${a.dato}: indekseret ${pil(b.indekseret - a.indekseret)}, klik ${pil(b.effektivitet.klik - a.effektivitet.klik)}, eksponeringer ${pil(b.effektivitet.eksponeringer - a.effektivitet.eksponeringer)}`);
    const aars = new Set([...Object.keys(a.aarsager), ...Object.keys(b.aarsager)]);
    const flyttet = [...aars].map((k) => [k, (b.aarsager[k] || 0) - (a.aarsager[k] || 0)]).filter(([, v]) => v !== 0)
      .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
    if (flyttet.length) {
      console.log('\n  Årsager der har flyttet sig:');
      for (const [k, v] of flyttet) console.log(`    ${pil(v).padStart(6)}  ${k}`);
    }
  } else {
    console.log(`\n  Kun ét punkt. En serie på ét tal kan ikke vise en udvikling — næste aflæsning er det, der giver mening.`);
  }
  console.log('');
}

if (fejl.length) {
  console.error('❌ Serien hænger ikke sammen:');
  for (const f of fejl) console.error('   ' + f);
  process.exit(1);
}
console.log(`✅ ${p.length} punkt(er), alle kontroller passerer.`);
