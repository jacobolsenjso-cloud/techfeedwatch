// Retter linktekster, der lover en overskrift, sitet ikke har mere.
//
// Hvorfor filen findes: ændrer man en artikels titel, bliver alle de steder,
// andre artikler CITERER den gamle titel som linktekst, til et brudt løfte.
// Linket virker — men teksten lover noget andet, end læseren får, og Google
// læser linkteksten som et relevans-signal. Målt 22/9-2026: 129 sådanne links,
// opsamlet gennem tre omgange titelrettelser (21/8, 9/9, 22/9).
//
// VIGTIGT — den må ALDRIG stoppe robotten. Scriptet slutter altid med kode 0,
// også hvis noget går galt undervejs. Det er en reparation, ikke et værn:
// værnet (audit-interne-links.mjs, regel 2) måler bagefter og melder tallet,
// men stopper heller ikke kørslen. Rådner noget, healer det af sig selv ved
// næste robotkørsel, typisk inden for et par timer.
//
// Kør:  node ret-linktekster.mjs            (tør kørsel — viser kun)
//       node ret-linktekster.mjs --skriv    (retter filerne)
import fs from 'node:fs';
import path from 'node:path';

const MAPPER = ['src/content/guides', 'src/content/glossary', 'src/content/pages', 'src/content/videos'];
const VIDEOER = 'src/content/videos';

// Hvis ÉN kørsel vil ændre mere end dette, er der sket noget større end en
// enkelt titelrettelse — f.eks. en masse-omdøbning. Så skriver den ingenting
// og melder det i stedet. Et menneske skal se på den slags, men kørslen må
// stadig ikke stoppe.
// (RET_LOFT kan sættes i miljøet, så loftet kan afprøves uden at ødelægge 41
//  filer for at bevise, at det virker.)
const LOFT = Number(process.env.RET_LOFT ?? 40);

const skriv = process.argv.includes('--skriv');

function hovedarbejde() {
  // Nuværende overskrifter, slået op i samme kilde som sitet selv bygger af.
  const titler = new Map();
  for (const f of fs.readdirSync(VIDEOER).filter((x) => x.endsWith('.md'))) {
    const m = fs.readFileSync(path.join(VIDEOER, f), 'utf8').match(/^title:\s*"(.*)"\s*$/m);
    if (m) titler.set(f.slice(0, -3), m[1]);
  }
  const ensret = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const alleTitler = new Set([...titler.values()].map(ensret));

  // Reglen er bevidst smal, så prosa ikke bliver rettet:
  // mindst 6 ord, fordi de tre korteste fund 22/9 ("Ethereum World State",
  // "Zero Trust Security Model", "Bull Mania by iVantage") var begreber og
  // produktnavne midt i en sætning — ikke overskrifter.
  const erTitelFormet = (t) => {
    const ord = t.trim().split(/\s+/);
    if (t.trim().length < 20 || ord.length < 6) return false;
    return ord.filter((o) => /^[A-Z0-9]/.test(o)).length / ord.length >= 0.5;
  };
  // Frontmatter røres aldrig: dér er et markdown-link ikke et link, men tekst
  // i en sætning, der også fodrer Article-schemaets description.
  const delFrontmatter = (t) => {
    if (!t.startsWith('---')) return ['', t];
    const slut = t.indexOf('\n---', 3);
    return slut === -1 ? ['', t] : [t.slice(0, slut + 4), t.slice(slut + 4)];
  };

  const LINK = /\[([^\]\n]+)\]\((\/video\/[^)\s#?]+)\/?\)/g;
  const planlagt = [];
  for (const mappe of MAPPER) {
    if (!fs.existsSync(mappe)) continue;
    for (const f of fs.readdirSync(mappe).filter((x) => x.endsWith('.md'))) {
      const sti = path.join(mappe, f);
      const [, krop] = delFrontmatter(fs.readFileSync(sti, 'utf8'));
      for (const m of krop.matchAll(LINK)) {
        const slug = m[2].replace(/^\/video\//, '').replace(/\/$/, '');
        const nu = titler.get(slug);
        if (!nu) continue;                                   // målet er ikke en artikel
        if (ensret(m[1]) === ensret(nu)) continue;           // allerede rigtig
        if (!erTitelFormet(m[1])) continue;                  // prosa — lad den være
        if (alleTitler.has(ensret(m[1]))) continue;          // er en anden sides titel
        if (nu.includes(']') || nu.includes('[')) continue;  // ville ødelægge markdown
        planlagt.push({ sti, hele: m[0], adr: m[2], gammel: m[1], ny: nu });
      }
    }
  }
  return planlagt;
}

// Hele kørslen ligger i try/catch, og der er kun ÉN exit til sidst: kode 0.
// Går noget galt, bliver det skrevet i loggen og kørslen fortsætter — en
// reparation, der ikke lykkes, må ikke koste en artikel sin udgivelse.
let planlagt = [];
try {
  planlagt = hovedarbejde();
} catch (e) {
  console.log(`⚠️  ret-linktekster kunne ikke gennemføres: ${e.message}`);
  console.log('   Kørslen fortsætter — dette trin stopper aldrig robotten.');
  process.exit(0);
}

if (planlagt.length === 0) {
  console.log('Ingen forældede linktekster. Alle citater passer med målsidens overskrift.');
  process.exit(0);
}

for (const r of planlagt) {
  console.log(`${path.basename(r.sti)}`);
  console.log(`   - ${r.gammel}`);
  console.log(`   + ${r.ny}`);
}

if (planlagt.length > LOFT) {
  console.log(`\n⚠️  ${planlagt.length} rettelser er over loftet på ${LOFT} — SKRIVER IKKE.`);
  console.log('   Så mange på én gang betyder en masse-omdøbning, ikke en enkelt titelrettelse.');
  console.log('   Kør `node ret-linktekster.mjs --skriv` i hånden, når du har set listen igennem.');
  process.exit(0);
}

if (!skriv) {
  console.log(`\n${planlagt.length} linktekster ville blive rettet (tør kørsel — brug --skriv).`);
  process.exit(0);
}

let rettet = 0;
try {
  const perFil = new Map();
  for (const r of planlagt) {
    if (!perFil.has(r.sti)) perFil.set(r.sti, []);
    perFil.get(r.sti).push(r);
  }
  for (const [sti, liste] of perFil) {
    let t = fs.readFileSync(sti, 'utf8');
    for (const r of liste) {
      if (!t.includes(r.hele)) continue;          // filen har ændret sig — spring over
      t = t.replace(r.hele, `[${r.ny}](${r.adr})`);
      rettet++;
    }
    fs.writeFileSync(sti, t);
  }
} catch (e) {
  console.log(`\n⚠️  skrivningen blev afbrudt: ${e.message}`);
}
console.log(`\n${rettet} af ${planlagt.length} linktekster rettet.`);
process.exit(0);
