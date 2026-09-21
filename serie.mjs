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
// FELTET 'adresser' (tilføjet 21/9-2026): antal <loc> i dist/sitemap-0.xml den
// dag. Uden det tal kan serien læses helt forkert. Robotten lægger 1-3 nye
// adresser til hver dag, og en ny adresse er ikke-indekseret fra det sekund den
// findes — så "ikke indekseret" vokser af sig selv, uden at noget er blevet
// værre. 763 -> 780 ligner en tilbagegang og er i virkeligheden bare vækst.
// Netop dét tal er det, vi er uenige om (de 483 under "Registreret - endnu
// ikke indekseret"), så det skal kunne trækkes fra.
//
// ADVARSEL om nævneren: Søgekonsollen kender 845 adresser (82 + 763), mens
// sitemappet har 529. Forskellen er gamle /video/<id>-adresser og andet, der
// ikke står i sitemappet. Divider derfor ALDRIG 'indekseret' med 'adresser' —
// det er to forskellige mængder. Feltet bruges kun til at se væksten.
//
// Og en ærlig skavank: Søgekonsollens tal halter 2-3 dage, mens 'adresser'
// tælles samme aften. De to tal er altså ikke fra nøjagtig samme øjeblik. Det
// betyder ikke noget for FORSKELLEN mellem to aflæsninger, så længe adresserne
// altid tælles på aflæsningsdagen — men det er grunden til, at regnestykket
// nedenfor kaldes en pejling og ikke et facit.
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
  // Antallet af adresser SKAL stå der. Et punkt uden det tal kan ikke skelne
  // vækst fra tilbagegang, og et manglende felt ville ellers blive læst som 0
  // og gøre hele sammenligningen forkert — stille.
  if (!Number.isInteger(x.adresser) || x.adresser <= 0) {
    fejl.push(`${x.dato}: 'adresser' mangler eller er ikke et positivt heltal (fik ${JSON.stringify(x.adresser)})`);
  }
  if (x.dato <= sidsteDato) fejl.push(`${x.dato}: punkterne står ikke i dato-rækkefølge`);
  sidsteDato = x.dato;
}

if (!kunTjek) {
  const kol = (s, n) => String(s).padStart(n);
  console.log('\nSøgekonsollen over tid — techfeedwatch.com\n');
  console.log('  dato         adresser   indekseret   ikke indekseret   klik   eksponeringer   klikrate   position');
  console.log('  ' + '-'.repeat(99));
  for (const x of p) {
    const e = x.effektivitet;
    console.log(`  ${x.dato}  ${kol(x.adresser, 8)}   ${kol(x.indekseret, 10)}   ${kol(x.ikkeIndekseret, 15)}   ${kol(e.klik, 4)}   ${kol(e.eksponeringer, 13)}   ${kol(e.klikrate + ' %', 8)}   ${kol(e.position, 8)}`);
  }

  if (p.length >= 2) {
    const a = p[p.length - 2], b = p[p.length - 1];
    const pil = (n) => (n > 0 ? `+${n}` : String(n));
    const dAdr = b.adresser - a.adresser;
    const dIkke = b.ikkeIndekseret - a.ikkeIndekseret;
    console.log(`\n  Siden ${a.dato}: adresser ${pil(dAdr)}, indekseret ${pil(b.indekseret - a.indekseret)}, ikke indekseret ${pil(dIkke)}, klik ${pil(b.effektivitet.klik - a.effektivitet.klik)}, eksponeringer ${pil(b.effektivitet.eksponeringer - a.effektivitet.eksponeringer)}`);

    // Vækst er ikke tilbagegang. En ny adresse er ikke-indekseret fra start, så
    // en del af stigningen i "ikke indekseret" er bare sitet, der er blevet
    // større. Regnestykket er en pejling, ikke en sandhed: det forudsætter, at
    // hver ny adresse er landet som ikke-indekseret, hvilket ikke ALTID passer.
    if (dAdr !== 0) {
      const reelt = dIkke - dAdr;
      console.log(`\n  Vækst trukket fra: sitet fik ${pil(dAdr)} adresser, og en ny adresse er ikke-indekseret`);
      console.log(`  fra start. Regner man dem med, er den reelle bevægelse i "ikke indekseret" ${pil(reelt)}`);
      console.log(`  i stedet for ${pil(dIkke)}. (Pejling — forudsætter at alle nye adresser landede der.)`);
    }
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
