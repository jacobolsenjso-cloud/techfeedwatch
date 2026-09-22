// Tjekker at interne links peger på noget, der findes.
//
// Hvorfor filen findes: audit-links.mjs tjekker kun EKSTERNE links og
// YouTube-miniaturer. Ingen tjekkede de interne. Målt 20/9-2026: guiderne har
// 53 unikke interne links, hvoraf 27 peger på værktøjer og 27 på glossarord —
// alle levende i dag. Men slettes et værktøj eller et glossaropslag, dør de
// links stille, og ingen opdager det. Det er et VÆRN mod fremtidige huller,
// ikke en oprydning: kører det uden fund, er det svaret, ikke spild.
//
// Kører mod kildefilerne, ikke mod dist/, så det kan køre i robottens workflow
// uden et byg først.
//
// Kør: node audit-interne-links.mjs        (exit 1 hvis noget er dødt)
import fs from 'fs';
import path from 'path';

const MAPPER = ['src/content/guides', 'src/content/glossary', 'src/content/pages', 'src/content/videos'];

const filnavne = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : []);
const tagSlug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Hvad findes? Slås op i de samme kilder, som sitet selv bygger siderne af.
const findes = {
  video: new Set(filnavne('src/content/videos')),
  glossary: new Set(filnavne('src/content/glossary')),
  guides: new Set(filnavne('src/content/guides')),
  tools: new Set(),
  tag: new Set(),
};
{
  const t = fs.readFileSync('src/lib/tools.ts', 'utf8');
  for (const m of t.matchAll(/slug:\s*['"]([^'"]+)['"]/g)) findes.tools.add(m[1]);
  // Værktøjs-kategorier har deres egen side (/tools/<kategori>)
  for (const m of t.matchAll(/category:\s*['"]([^'"]+)['"]/g)) findes.tools.add(tagSlug(m[1]));
  const g = fs.readFileSync('src/lib/tags.ts', 'utf8');
  for (const m of g.matchAll(/['"]([^'"]+)['"]\s*:/g)) findes.tag.add(tagSlug(m[1]));
}

// Sider uden egen mappe-logik. /archive og /page har dynamiske undersider, som
// ikke kan slås op her — de springes over med vilje frem for at melde falsk alarm.
const STATISKE = new Set(['', 'latest', 'popular', 'library', 'trends', 'search', 'history', 'watch-later', 'sitemap', 'glossary', 'guides', 'tools', 'rss.xml']);
const SPRING_OVER = new Set(['archive', 'page', 'author', 'video-sitemap.xml']);
for (const s of filnavne('src/content/pages')) STATISKE.add(s);

const doede = [];
let tjekket = 0;
for (const mappe of MAPPER) {
  if (!fs.existsSync(mappe)) continue;
  for (const f of fs.readdirSync(mappe).filter((x) => x.endsWith('.md'))) {
    const tekst = fs.readFileSync(path.join(mappe, f), 'utf8');
    for (const m of tekst.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      const raa = m[1].split('#')[0].split('?')[0];
      const dele = raa.replace(/\/$/, '').split('/').filter(Boolean);
      tjekket++;
      const sektion = dele[0] ?? '';
      const rest = dele[1];
      if (SPRING_OVER.has(sektion)) continue;
      if (!rest) {
        if (!STATISKE.has(sektion)) doede.push({ fil: `${mappe}/${f}`, link: raa, hvorfor: 'ukendt side' });
        continue;
      }
      if (!(sektion in findes)) { doede.push({ fil: `${mappe}/${f}`, link: raa, hvorfor: `ukendt sektion "${sektion}"` }); continue; }
      if (!findes[sektion].has(rest)) doede.push({ fil: `${mappe}/${f}`, link: raa, hvorfor: `findes ikke i ${sektion}` });
    }
  }
}

// ---------------------------------------------------------------------------
// Regel 2: LØFTET skal også holde, ikke kun målet.
//
// Målt 22/9-2026: 129 links pegede på en levende side, men linkteksten citerede
// en overskrift, som ikke fandtes mere — opsamlet gennem tre omgange
// titelrettelser (21/8, 9/9, 22/9). Reglen ovenfor kunne ikke se det, fordi den
// kun spørger "findes målet?". Linkteksten er både et løfte til læseren og et
// relevans-signal til Google, så en forældet titel er et ægte hul.
//
// Reglen er bevidst smal, så prosa ikke meldes som fejl:
//   - kun links til /video/<slug>
//   - kun i BRØDTEKSTEN, aldrig i frontmatter. `summary` kan indeholde et
//     markdown-link, og dér er teksten en del af en sætning, ikke et løfte.
//   - kun TITEL-FORMET linktekst (mindst halvdelen af ordene med stort
//     forbogstav, mindst 20 tegn, MINDST 6 ORD)
//   - og kun hvis teksten ikke svarer til NOGEN nuværende overskrift på sitet
// Dermed rammer den præcis det tilfælde, hvor en titel er blevet ændret uden at
// citaterne fulgte med.
//
// Hvorfor 6 ord og ikke 3: målt 22/9 var de tre korteste fund "Ethereum World
// State", "Zero Trust Security Model" og "Bull Mania by iVantage" — begreber
// og produktnavne midt i en sætning, ikke overskrifter. Fra 6 ord og op var
// alle 126 øvrige fund ægte, forældede titler.
const titler = new Map();
for (const f of fs.readdirSync('src/content/videos').filter((x) => x.endsWith('.md'))) {
  const m = fs.readFileSync(path.join('src/content/videos', f), 'utf8').match(/^title:\s*"(.*)"\s*$/m);
  if (m) titler.set(f.slice(0, -3), m[1]);
}
const ensret = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const alleTitler = new Set([...titler.values()].map(ensret));
const erTitelFormet = (t) => {
  const ord = t.trim().split(/\s+/);
  if (t.trim().length < 20 || ord.length < 6) return false;
  return ord.filter((o) => /^[A-Z0-9]/.test(o)).length / ord.length >= 0.5;
};
// Alt før den afsluttende '---' er frontmatter og tjekkes ikke.
const kunBrødtekst = (t) => {
  if (!t.startsWith('---')) return t;
  const slut = t.indexOf('\n---', 3);
  return slut === -1 ? t : t.slice(slut + 4);
};

const forloebne = [];
let tekstTjekket = 0;
for (const mappe of MAPPER) {
  if (!fs.existsSync(mappe)) continue;
  for (const f of fs.readdirSync(mappe).filter((x) => x.endsWith('.md'))) {
    const tekst = kunBrødtekst(fs.readFileSync(path.join(mappe, f), 'utf8'));
    for (const m of tekst.matchAll(/\[([^\]\n]+)\]\((\/video\/[^)\s#?]+)\/?\)/g)) {
      const slug = m[2].replace(/^\/video\//, '').replace(/\/$/, '');
      const nu = titler.get(slug);
      if (!nu) continue;
      tekstTjekket++;
      if (ensret(m[1]) === ensret(nu)) continue;
      if (!erTitelFormet(m[1])) continue;
      if (alleTitler.has(ensret(m[1]))) continue;
      forloebne.push({ fil: `${mappe}/${f}`, tekst: m[1], nu });
    }
  }
}

console.log(`Tjekket ${tjekket} interne links i ${MAPPER.length} indholdsmapper.`);
console.log(`Tjekket ${tekstTjekket} linktekster mod målsidens overskrift.`);

// Regel 2 STOPPER IKKE kørslen. Den er en måling, ikke en port.
//
// Hvorfor: et dødt link (regel 1) er et hul, kun et menneske kan lukke — dér
// er det rigtigt at standse udgivelsen. En forældet linktekst har derimod
// præcis ét rigtigt svar, nemlig målsidens nuværende overskrift, og det retter
// `ret-linktekster.mjs` af sig selv i robottens workflow, FØR dette tjek kører.
// Ville regel 2 også stoppe kørslen, ville den standse robotten over noget,
// huset allerede har rettet. Derfor: regel 1 = rød, regel 2 = tal i loggen.
// Står der et tal her efter en robotkørsel, er der noget, reparationen ikke
// kunne klare — se `ret-linktekster.mjs`.
if (forloebne.length) {
  console.log(`\n⚠️  ${forloebne.length} link(s) lover en overskrift, der ikke findes mere (stopper ikke kørslen):`);
  for (const d of forloebne) console.log(`   ${d.fil.split('/').pop()}\n      linktekst:  ${d.tekst}\n      siden hedder: ${d.nu}`);
  console.log('   Rettes automatisk med: node ret-linktekster.mjs --skriv');
}

if (doede.length === 0) {
  console.log(forloebne.length === 0
    ? '✅ Alle interne links peger på noget, der findes — og lover den rigtige overskrift.'
    : '✅ Alle interne links peger på noget, der findes.');
  process.exit(0);
}
console.log(`\n❌ ${doede.length} døde interne link(s):`);
for (const d of doede) console.log(`   ${d.fil.split('/').pop()}\n      ${d.link}  — ${d.hvorfor}`);
process.exit(1);
