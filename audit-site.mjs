// Site-tjek over hele buildet. Kør efter `npm run build`.
//
// Hvorfor den findes: audit-content tjekker artiklernes indhold og
// audit-interne-links tjekker links i kilden. Ingen af dem så på det færdige
// HTML. Dobbelttjekket 20/9 fandt derfor 40 redirect-kæder (gammel adresse →
// slettet artikel → ny artikel), som Google skal igennem to spring for at nå
// frem. Den slags opdages kun ved at se på _redirects og dist samtidig.
//
// Tjekker: JSON-LD kan parses, skabelonhuller (undefined/NaN/[object Object]),
// dublerede id'er, præcis én h1, lang-attribut, døde interne links, manglende
// lokale billeder, canonical = sidens egen adresse, absolut og:image,
// sitemap-adresser findes og er ikke noindex, feeds kan læses, og at ingen
// 301 peger på en adresse der ikke findes eller på en anden 301.
//
// Afslutter med kode 1 hvis der er fund, så GitHub Actions fanger det.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const REDIRECTS = 'public/_redirects';
const fejl = [];
const f = (kat, fil, txt) => fejl.push({ kat, fil, txt });

if (!fs.existsSync(DIST)) {
  console.error('dist/ findes ikke — kør `npm run build` først.');
  process.exit(1);
}

function gaa(dir, ud = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) gaa(p, ud); else ud.push(p);
  }
  return ud;
}

const alle = gaa(DIST);
const filer = alle.filter((p) => p.endsWith('.html'));

// Alle adresser sitet faktisk serverer
const ruter = new Set();
for (const p of alle) {
  let r = '/' + path.relative(DIST, p).replace(/\\/g, '/');
  ruter.add(r);
  if (r.endsWith('/index.html')) {
    const mappe = r.slice(0, -'index.html'.length);
    ruter.add(mappe);
    if (mappe !== '/') ruter.add(mappe.slice(0, -1));
  }
}

// 301-kilder tæller som gyldige link-mål: linket lander et rigtigt sted,
// bare med et spring undervejs.
const rGlem = (s) => s.replace(/\/$/, '');
const regler = [];
if (fs.existsSync(REDIRECTS)) {
  for (const l of fs.readFileSync(REDIRECTS, 'utf8').split('\n')) {
    const d = l.trim().split(/\s+/);
    if (d.length >= 3 && /^\d{3}$/.test(d[2])) regler.push({ fra: d[0], til: d[1], kode: d[2] });
  }
}
const redirKilder = new Set(regler.map((r) => rGlem(r.fra)));
const findes = (sti) => ruter.has(sti) || ruter.has(rGlem(sti)) || ruter.has(rGlem(sti) + '/');

let antalLd = 0, antalLinks = 0;
for (const p of filer) {
  const s = fs.readFileSync(p, 'utf8');
  const navn = '/' + path.relative(DIST, p).replace(/\\/g, '/');
  // Alt undtagen ld+json-blokkene fjernes, så JavaScript-strenge inde i
  // sidens egne scripts ikke bliver læst som opmærkning. (Første udgave af
  // dette script meldte 1957 "døde links", der alle var JS-strenge.)
  const h = s
    .replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g, '')
    .replace(/<style\b[\s\S]*?<\/style>/g, '');

  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    antalLd++;
    try {
      const o = JSON.parse(m[1]);
      for (const n of (Array.isArray(o) ? o : [o])) {
        if (!n['@type']) f('schema', navn, 'JSON-LD-node uden @type');
        const t = JSON.stringify(n);
        const hul = t.match(/"(undefined|NaN)"|\[object Object\]/);
        if (hul) f('schema', navn, 'JSON-LD indeholder skabelonhul: ' + hul[0]);
      }
    } catch (e) {
      f('schema', navn, 'JSON-LD kan ikke parses: ' + e.message);
    }
  }

  // Skabelonhuller i den synlige tekst. "undefined" er også et almindeligt
  // engelsk ord ("undefined requirements"), så kun et tekstfelt der BESTÅR
  // af ordet tæller — ellers bliver tre helt korrekte artikler meldt som fejl.
  // <code>null</code> i en artikel om et programmeringssprog er ikke et hul,
  // så kodeeksempler holdes udenfor.
  const tekst = h.replace(/<(code|pre|kbd|samp)\b[\s\S]*?<\/\1>/g, '');
  for (const m of tekst.matchAll(/>([^<]{1,80})</g)) {
    const t = m[1].trim();
    if (t === 'undefined' || t === 'null' || t === 'NaN' || t.includes('[object Object]')) {
      f('indhold', navn, `skabelonhul i teksten: "${t}"`);
    }
  }

  const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const set = new Set(); const dub = new Set();
  for (const i of ids) (set.has(i) ? dub : set).add(i);
  if (dub.size) f('html', navn, 'dubleret id: ' + [...dub].join(', '));

  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) f('html', navn, `${h1} h1-overskrifter (skal være 1)`);
  if (!/<html[^>]*\slang="/.test(s)) f('html', navn, 'ingen lang-attribut på <html>');

  for (const m of h.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    let href = m[1];
    if (/^(https?:|mailto:|tel:|#|javascript:|data:)/.test(href) || !href.startsWith('/')) continue;
    antalLinks++;
    href = href.split('#')[0].split('?')[0];
    if (href && !findes(href) && !redirKilder.has(rGlem(href))) f('link', navn, 'dødt internt link: ' + href);
  }

  for (const m of h.matchAll(/<img\b[^>]*\ssrc="(\/[^"]+)"/g)) {
    const src = m[1].split('?')[0];
    if (!fs.existsSync(path.join(DIST, src))) f('billede', navn, 'billede findes ikke: ' + src);
  }

  const can = s.match(/<link rel="canonical" href="([^"]+)"/);
  if (can) {
    let egen = '/' + path.relative(DIST, p).replace(/\\/g, '/');
    if (egen.endsWith('/index.html')) egen = egen.slice(0, -'index.html'.length);
    const sti = can[1].replace('https://techfeedwatch.com', '');
    if (sti !== egen) f('canonical', navn, `canonical ${sti} ≠ egen adresse ${egen}`);
  }

  const og = s.match(/<meta property="og:image" content="([^"]+)"/);
  if (og && !og[1].startsWith('https://')) f('og', navn, 'og:image er ikke absolut: ' + og[1]);
}

let smAntal = 0;
for (const sm of fs.readdirSync(DIST).filter((n) => n.startsWith('sitemap') && n.endsWith('.xml'))) {
  for (const m of fs.readFileSync(path.join(DIST, sm), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (m[1].endsWith('.xml')) continue;
    smAntal++;
    const sti = m[1].replace('https://techfeedwatch.com', '');
    const fil = path.join(DIST, sti, 'index.html');
    if (!fs.existsSync(fil)) { f('sitemap', sm, 'adresse findes ikke: ' + sti); continue; }
    if (/<meta name="robots" content="noindex/.test(fs.readFileSync(fil, 'utf8'))) f('sitemap', sm, 'noindex-side i sitemap: ' + sti);
  }
}

for (const n of ['rss.xml', 'videos.json', 'videos-lite.json', 'video-sitemap.xml']) {
  const p = path.join(DIST, n);
  if (!fs.existsSync(p)) { f('feed', n, 'findes ikke i buildet'); continue; }
  const s = fs.readFileSync(p, 'utf8');
  if (n.endsWith('.json')) { try { JSON.parse(s); } catch (e) { f('feed', n, 'ugyldig JSON: ' + e.message); } }
  else if (!s.trimStart().startsWith('<?xml')) f('feed', n, 'starter ikke med xml-erklæring');
}

// Døde og kædede 301'er. En kæde er ikke en fejl for brugeren, men Google
// følger den modvilligt og giver mindre videre for hvert spring.
let kaeder = 0;
for (const r of regler) {
  if (r.kode !== '301') continue;
  if (r.fra.includes('*') || r.til.includes(':splat')) continue; // Cloudflares jokertegn
  const maal = r.til.split('#')[0];
  if (!maal.startsWith('/')) continue;
  if (redirKilder.has(rGlem(maal))) { kaeder++; if (kaeder <= 10) f('redirect', REDIRECTS, `301-kæde: ${r.fra} → ${maal} → videre`); }
  else if (!findes(maal)) f('redirect', REDIRECTS, `301-mål findes ikke: ${r.fra} → ${maal}`);
}
if (kaeder > 10) f('redirect', REDIRECTS, `... og ${kaeder - 10} kæder mere`);

console.log(`${filer.length} sider · ${antalLd} JSON-LD-blokke · ${antalLinks} interne links · ${smAntal} sitemap-adresser · ${regler.length} redirect-regler`);
if (!fejl.length) {
  console.log('✅ Ingen fejl fundet.');
  process.exit(0);
}
const efterKat = {};
for (const x of fejl) (efterKat[x.kat] ||= []).push(x);
for (const [k, v] of Object.entries(efterKat)) {
  console.log(`\n### ${k} (${v.length})`);
  for (const x of v.slice(0, 25)) console.log(`  ${x.fil}: ${x.txt}`);
  if (v.length > 25) console.log(`  ... og ${v.length - 25} mere`);
}
console.log(`\n❌ ${fejl.length} fund i alt.`);
process.exit(1);
