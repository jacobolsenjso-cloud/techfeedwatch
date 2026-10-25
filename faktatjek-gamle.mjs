// Faktatjek af gamle artikler UDEN omskrivning (25/10-2026, Jacob valgte "bland"):
// kun de ca. 40 artikler, Google har vist (src/data/omskriv-prioritet.json), skrives helt om
// (omskriv-gamle.mjs). Resten beholder deres tekst, men får det samme faktatjek som robotten
// (src/lib/faktatjek.mjs): en faktatjekker med Google-søgning læser hver sætning med tal, dato
// eller kildeangivelse, og forkerte eller udokumenterede sætninger rettes eller fjernes.
// Artiklen mærkes "factChecked: <dato>" og tjekkes ikke igen.
//
// Videoens transskript bruges som noter, KUN hvis det ligger i cachen — at hente det koster
// (Gemini) og er ikke nødvendigt: faktatjekkeren søger selv på Google.
// Kør: node faktatjek-gamle.mjs --antal=10   (--vis: vis køen, intet koster)
import fs from 'node:fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';
import { skeptiker, anvendRettelser } from './src/lib/faktatjek.mjs';
import { cacheSti } from './src/lib/transskript.mjs';

const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=10').split('=')[1]) || 10;
const kun = (process.argv.find((a) => a.startsWith('--kun=')) || '').split('=')[1] || '';
const LOG = './src/data/faktatjek-log.json';
const laes = (f, std) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return std; } };
const prio = new Set(laes('./src/data/omskriv-prioritet.json', { slugs: [] }).slugs);
const idag = new Date().toISOString().slice(0, 10);

const koe = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(`./src/content/videos/${f}`, 'utf8').replace(/\r/g, '');
  const fm = raw.split('---')[1] || '';
  return {
    slug: f.replace(/\.md$/, ''), raw,
    dato: fm.match(/^date:\s*"(.*)"/m)?.[1] || '',
    yid: fm.match(/^youtubeId:\s*"(.*)"/m)?.[1] || '',
    // Omskrevne (recipe 3) er allerede tjekket; de prioriterede venter på omskrivning;
    // de prioriterede UDEN søgespørgsmål kan ikke omskrives og faktatjekkes derfor her.
    tjekkes: !/^recipe:\s*3\b/m.test(fm) && !/^isShort:\s*true/m.test(fm) && !/^factChecked:/m.test(fm)
      && (!prio.has(f.replace(/\.md$/, '')) || !/^targetQuestion:/m.test(fm)),
  };
}).filter((a) => (kun ? a.slug === kun : a.tjekkes)).sort((a, b) => b.dato.localeCompare(a.dato));

console.log(`${koe.length} artikler venter på faktatjek — tager ${Math.min(antal, koe.length)} nu (nyeste først)`);
if (process.argv.includes('--vis')) { for (const a of koe.slice(0, antal)) console.log(`  ${a.dato}  ${a.slug}`); process.exit(0); }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const koersel = { dato: new Date().toISOString(), artikler: [] };
for (const a of koe.slice(0, antal)) {
  const [, fm, ...rest] = a.raw.split('---');
  const krop = rest.join('---');
  let noter = '(no transcript available - verify with Google Search)';
  try {
    const t = JSON.parse(fs.readFileSync(cacheSti(a.yid), 'utf8'));
    const segs = Array.isArray(t) ? t : (t.segmenter || t.segments || []);
    const tekst = segs.map((s) => s.text || '').join(' ').trim();
    if (tekst) noter = tekst.slice(0, 8000);
  } catch { /* intet i cachen */ }

  const sk = await skeptiker(genAI, hentModel, GEMINI_MODEL, krop, '(no separate research - verify with Google Search)', noter);
  if (sk === null) { console.log(`${a.slug}: faktatjekket kunne ikke køre (midlertidig fejl) — prøves næste gang`); continue; }
  let ny = krop, rettet = 0, fjernet = 0;
  if (sk.fund.length) {
    const r = anvendRettelser(krop, sk.fund);
    ny = r.md;
    // De rettede sætninger tjekkes én gang til; holder en ikke, fjernes den.
    const rettede = sk.fund.filter((f) => f.rettet && !r.ikkeFundet.includes(f));
    if (rettede.length) {
      const igen = await skeptiker(genAI, hentModel, GEMINI_MODEL, rettede.map((f) => f.rettet).join('\n\n'), '(no separate research - verify with Google Search)', noter);
      if (igen && igen.fund.length) ny = anvendRettelser(ny, igen.fund.map((f) => ({ ...f, rettet: '' }))).md;
      rettet = rettede.length - (igen?.fund.length || 0);
    }
    fjernet = sk.fund.length - rettet - r.ikkeFundet.length;
    // Værn: fjernes eller ændres mere end hver fjerde tjekkede sætning, røres artiklen ikke —
    // så er noget galt (med artiklen eller med tjekket), og et menneske skal se på den.
    if (sk.fund.length > Math.max(4, sk.tjekket / 4)) {
      console.log(`${a.slug}: ${sk.fund.length} af ${sk.tjekket} sætninger fanget — for mange, artiklen røres ikke (se loggen)`);
      for (const f of sk.fund) console.log(`   - [${f.dom}] ${f.saetning.slice(0, 120)} (${f.grund.slice(0, 100)})`);
      koersel.artikler.push({ slug: a.slug, tjekket: sk.tjekket, fanget: sk.fund.length, roert: false });
      continue;
    }
    for (const f of sk.fund) console.log(`   - [${f.dom}] ${f.saetning.slice(0, 120)} (${f.grund.slice(0, 100)})`);
  }
  // FAQ-svar og resumé i frontmatter tjekkes også (25/10: en falsk NIST-henvisning stod i FAQ'en).
  let nyFm = fm;
  const felter = [...fm.matchAll(/^(\s*(?:answer|summary):\s*)"((?:[^"\\]|\\.)*)"\s*$/gm)].map((m) => ({ linje: m[0], foer: m[1], tekst: m[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\') }));
  let fmFund = 0;
  if (felter.length) {
    const skK = await skeptiker(genAI, hentModel, GEMINI_MODEL, felter.map((f) => f.tekst).join('\n\n'), '(no separate research - verify with Google Search)', noter);
    for (const f of skK?.fund || []) {
      for (const fl of felter) {
        const r = anvendRettelser(fl.tekst, [f]);
        if (r.ikkeFundet.length || r.md.trim() === fl.tekst) continue;
        const nyTekst = r.md.trim();
        nyFm = nyFm.replace(fl.linje, `${fl.foer}"${nyTekst.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
        fl.tekst = nyTekst; fmFund++;
        console.log(`   - [FAQ/resumé ${f.dom}] ${f.saetning.slice(0, 110)} (${f.grund.slice(0, 90)})`);
      }
    }
  }
  // factChecked lægges sidst i frontmatter. Artiklens tekst ellers uændret.
  fs.writeFileSync(`./src/content/videos/${a.slug}.md`, `---${nyFm.replace(/^factChecked:.*\n?/m, '').replace(/\s*$/, '')}\nfactChecked: "${idag}"\n---${ny}`);
  if (fmFund) console.log(`${a.slug}: ${fmFund} FAQ-svar/resumé rettet`);
  console.log(`${a.slug}: ${sk.tjekket} sætninger tjekket, ${sk.fund.length} fanget, ${rettet} rettet, ${fjernet} fjernet`);
  koersel.artikler.push({ slug: a.slug, tjekket: sk.tjekket, fanget: sk.fund.length, rettet, fjernet, roert: true });
}
const log = laes(LOG, []);
log.push(koersel);
fs.writeFileSync(LOG, JSON.stringify(log.slice(-90), null, 1) + '\n');
// Linjen læses af statusarbejdet. Ændr ikke formatet.
console.log(`FAKTATJEK-GAMLE: ${JSON.stringify({ tjekket: koersel.artikler.length, roert: koersel.artikler.filter((x) => x.roert).length, fanget: koersel.artikler.reduce((n, x) => n + x.fanget, 0), tilbage: koe.length - koersel.artikler.length })}`);
