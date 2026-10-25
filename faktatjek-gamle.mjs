// Faktatjek af gamle artikler UDEN omskrivning (25/10-2026): alle gamle artikler skrives om
// (omskriv-gamle.mjs, 5 om dagen), men det tager måneder. Indtil da får de, der venter, den samme
// slutkontrol som robotten (src/lib/slutkontrol.mjs) på alt, læseren ser; forkerte eller
// udokumenterede sætninger rettes eller fjernes. Stikprøvens fund (stikproeve.mjs) tages først.
// Artiklen mærkes "factChecked: <dato>" og tjekkes ikke igen.
//
// Videoens transskript bruges som noter, KUN hvis det ligger i cachen — at hente det koster
// (Gemini) og er ikke nødvendigt: faktatjekkeren søger selv på Google.
// Kør: node faktatjek-gamle.mjs --antal=10   (--vis: vis køen, intet koster)
import fs from 'node:fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './src/lib/model.mjs';
import { slutkontrol } from './src/lib/slutkontrol.mjs';
import { cacheSti } from './src/lib/transskript.mjs';
import { laesFelter, yaml } from './src/lib/artikelfelter.mjs';

const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=10').split('=')[1]) || 10;
const kun = (process.argv.find((a) => a.startsWith('--kun=')) || '').split('=')[1] || '';
const LOG = './src/data/faktatjek-log.json';
const laes = (f, std) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return std; } };
const prio = new Set(laes('./src/data/omskriv-prioritet.json', { slugs: [] }).slugs);
const idag = new Date().toISOString().slice(0, 10);
// Artikler, den daglige stikprøve (stikproeve.mjs) fandt fejl i: kontrolleres igen, FØR køen.
const FUND = './src/data/stikproeve-fund.json';
const fund = new Set(laes(FUND, { slugs: [] }).slugs);

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
    fund: fund.has(f.replace(/\.md$/, '')),
  };
}).filter((a) => (kun ? a.slug === kun : a.tjekkes || a.fund)).sort((a, b) => Number(b.fund) - Number(a.fund) || b.dato.localeCompare(a.dato));

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

  // Samme SLUTKONTROL som robotten (src/lib/slutkontrol.mjs): alt, læseren ser — titel, meta,
  // resumé, FAQ-svar, brødtekst og faktaboks. Uden research (gamle artikler har ingen), så lag 1
  // (kildebinding) springes over; belæg-tjekket og faktatjekkeren kører fuldt.
  const { felt, faqs, faktaboks, f } = laesFelter(a.raw);
  let rap;
  try {
    rap = await slutkontrol(genAI, hentModel, GEMINI_MODEL, f, { soeg: null, kanal: '', videoTekst: noter, research: '(no separate research - verify with Google Search)', videoNoter: noter });
  } catch (e) {
    console.log(`${a.slug}: ${e.message.split('\n')[0]}`);
    if (/midlertidig/.test(e.message)) continue;
    // Kunne kontrollen ikke gøre artiklen ren, skal den skrives om (og prøves ikke igen her).
    const pf = laes('./src/data/omskriv-prioritet.json', { slugs: [] });
    if (!pf.slugs.includes(a.slug)) { pf.slugs.unshift(a.slug); fs.writeFileSync('./src/data/omskriv-prioritet.json', JSON.stringify(pf, null, 1) + '\n'); }
    // Fra stikprøven: prøves ikke igen hver dag (det koster); fejlen står i loggen til status.
    if (fund.delete(a.slug)) fs.writeFileSync(FUND, JSON.stringify({ slugs: [...fund] }, null, 1) + '\n');
    koersel.artikler.push({ slug: a.slug, fejl: e.message.slice(0, 160), roert: false, tilOmskrivning: true });
    continue;
  }
  // Mange fejl (mere end hver fjerde tjekkede sætning): rettet nu, OG sat i omskrivningskøen.
  if (rap.fanget > Math.max(4, (rap.skeptikerTjekket || 0) / 4)) {
    const pf = laes('./src/data/omskriv-prioritet.json', { slugs: [] });
    if (!pf.slugs.includes(a.slug)) { pf.slugs.unshift(a.slug); fs.writeFileSync('./src/data/omskriv-prioritet.json', JSON.stringify(pf, null, 1) + '\n'); }
    console.log(`${a.slug}: ${rap.fanget} fund — rettet nu og sat i omskrivningskøen`);
  }
  // Frontmatter: kun de tjekkede felter skrives om; alt andet bevares tegn for tegn.
  let nyFm = fm;
  const saetFelt = (navn, gammel, ny) => { if (gammel && ny !== gammel) nyFm = nyFm.replace(`${navn}: ${yaml(gammel)}`, `${navn}: ${yaml(ny)}`); };
  saetFelt('title', felt('title'), f.titel); saetFelt('metaDescription', felt('metaDescription'), f.meta); saetFelt('summary', felt('summary'), f.resume);
  for (const q of faqs) { const nq = f.faqs.find((y) => y.question === q.question); nyFm = nq ? nyFm.replace(`answer: ${yaml(q.answer)}`, `answer: ${yaml(nq.answer)}`) : nyFm.replace(new RegExp(`\\s*- question: ${yaml(q.question).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n\\s*answer: ${yaml(q.answer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), ''); }
  for (const k of faktaboks) { const nk = f.faktaboks.find((y) => y.url === k.url && y.source === k.source); if (nk) nyFm = nyFm.replace(`text: ${yaml(k.text)}`, `text: ${yaml(nk.text)}`); }
  const ny = f.brodtekst;
  fs.writeFileSync(`./src/content/videos/${a.slug}.md`, `---${nyFm.replace(/^factChecked:.*\n?/m, '').replace(/\s*$/, '')}\nfactChecked: "${idag}"\n---${ny}`);
  console.log(`${a.slug}: SLUTKONTROL ${JSON.stringify(rap)}`);
  if (fund.delete(a.slug)) fs.writeFileSync(FUND, JSON.stringify({ slugs: [...fund] }, null, 1) + '\n');
  koersel.artikler.push({ slug: a.slug, ...rap, roert: true });
}
const log = laes(LOG, []);
log.push(koersel);
fs.writeFileSync(LOG, JSON.stringify(log.slice(-90), null, 1) + '\n');
// Linjen læses af statusarbejdet. Ændr ikke formatet.
console.log(`FAKTATJEK-GAMLE: ${JSON.stringify({ tjekket: koersel.artikler.length, roert: koersel.artikler.filter((x) => x.roert).length, fanget: koersel.artikler.reduce((n, x) => n + (x.fanget || 0), 0), tilbage: koe.length - koersel.artikler.length })}`);
