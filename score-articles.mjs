// Vurderer hvilke artikler der er værd at skrive om, og hvilke der ikke er.
//
// Sletning er farlig: en tidligere oprydning uden tjek forvandlede 589 interne
// links og 200 omdirigeringer til 404'er. Derfor MÅLER dette script kun — det
// sletter intet. Resultatet er en liste, ikke en handling.
//
// Det afgørende signal er transskriptet. Uden det kan artiklen ikke skrives om
// til at handle om emnet, for så har modellen intet at bygge på ud over sin
// egen hukommelse — og det er præcis dét der producerer opdigtede tal.
//
// Brug: node score-articles.mjs           (måler alt, tager ~15 min)
//       node score-articles.mjs --hurtig  (springer transskript-tjekket over)
import fs from 'node:fs';
import path from 'node:path';
import { YoutubeTranscript } from 'youtube-transcript';

const DIR = 'src/content/videos';
const DIST = 'dist';
const hurtig = process.argv.includes('--hurtig');

const felt = (raw, k) => raw.match(new RegExp(`^${k}:\\s*"([^"]*)"`, 'm'))?.[1] || '';
const fmAf = (raw) => raw.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] || '';

// Indgående interne links, talt i det byggede site. Et link fra en anden side
// er den bedste indikator på at sletning gør skade.
const ind = new Map();
const walk = (d, ud = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, ud);
    else if (e.name === 'index.html') ud.push(p);
  }
  return ud;
};
if (fs.existsSync(DIST)) {
  for (const f of walk(DIST)) {
    const h = fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, ' ');
    const set = new Set();
    for (const m of h.matchAll(/href="\/video\/([a-z0-9-]+)"/g)) set.add(m[1]);
    for (const s of set) ind.set(s, (ind.get(s) || 0) + 1);
  }
}

const filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const raekker = [];

for (const f of filer) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  const slug = f.replace('.md', '');
  const body = raw.slice(fmAf(raw).length).trim();
  raekker.push({
    slug, f,
    id: felt(raw, 'youtubeId'),
    titel: felt(raw, 'title'),
    dato: felt(raw, 'date').slice(0, 10),
    kanal: felt(raw, 'channelTitle').trim(),
    ord: body ? body.split(/\s+/).length : 0,
    isShort: /^isShort:\s*true/m.test(raw),
    omskrevet: /^rewrittenAt:/m.test(raw),
    links: ind.get(slug) || 0,
    faq: (raw.match(/^\s+- question:/gm) || []).length,
    transskript: null,   // udfyldes nedenfor
  });
}

if (!hurtig) {
  process.stdout.write('Tjekker transskripter');
  let i = 0;
  for (const r of raekker) {
    if (r.isShort) { r.transskript = 0; continue; }
    try {
      const t = await YoutubeTranscript.fetchTranscript(r.id);
      r.transskript = t.map((x) => x.text).join(' ').split(/\s+/).length;
    } catch {
      r.transskript = 0;   // slået fra, fjernet, eller ingen undertekster
    }
    if (++i % 25 === 0) process.stdout.write('.');
    await new Promise((res) => setTimeout(res, 120));
  }
  console.log(' færdig\n');
}

// Vurdering. Ikke en score fra 0-100 — en kategori, så beslutningen er tydelig.
const kat = (r) => {
  if (r.isShort) return 'shorts';
  if (r.omskrevet) return 'allerede omskrevet';
  // Uden transskript kan artiklen ikke skrives om til at handle om emnet.
  // Modellen ville skulle skrive ud fra sin egen hukommelse, og det er præcis
  // dét der producerede de opdigtede tal.
  if (!hurtig && r.transskript === 0) return 'kan IKKE omskrives (intet transskript)';
  if (!hurtig && r.transskript < 300) return 'tyndt grundlag (kort transskript)';
  return 'kan omskrives';
};

for (const r of raekker) r.kat = kat(r);

const grupper = {};
for (const r of raekker) (grupper[r.kat] ||= []).push(r);

console.log(`${raekker.length} artikler\n`);
console.log('=== fordeling ===');
for (const [k, liste] of Object.entries(grupper).sort((a, b) => b[1].length - a[1].length)) {
  const medLinks = liste.filter((r) => r.links > 0).length;
  console.log(`  ${String(liste.length).padStart(4)}  ${k.padEnd(38)} (${medLinks} har indgående links)`);
}

// Listerne skrives til filer, så de kan bruges direkte af rewrite-articles.mjs
// og af en eventuel oprydning.
const skriv = (navn, liste) => {
  fs.writeFileSync(navn, liste.map((r) => r.f).join('\n') + '\n', 'utf8');
  console.log(`  ${liste.length} -> ${navn}`);
};

console.log('\n=== lister ===');
skriv('_kan-omskrives.txt', grupper['kan omskrives'] || []);
if (!hurtig) {
  skriv('_uden-transskript.txt', grupper['kan IKKE omskrives (intet transskript)'] || []);
  skriv('_tyndt-grundlag.txt', grupper['tyndt grundlag (kort transskript)'] || []);
}

// De uden transskript er kandidater til sletning — men KUN dem uden indgående
// links kan fjernes uden at bryde noget. Resten skal have en 301.
const uden = grupper['kan IKKE omskrives (intet transskript)'] || [];
if (uden.length) {
  const fri = uden.filter((r) => r.links === 0);
  const bundet = uden.filter((r) => r.links > 0);
  console.log(`\n=== uden transskript: ${uden.length} ===`);
  console.log(`  ${fri.length} har INGEN indgående links — kan fjernes uden at bryde noget`);
  console.log(`  ${bundet.length} har links fra andre sider — kræver en 301 til en beslægtet artikel`);
}

fs.writeFileSync('_score.json', JSON.stringify(raekker, null, 1), 'utf8');
console.log('\nFuld måling i _score.json');
