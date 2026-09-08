// Giver de gamle artikler (uden targetQuestion) en overskrift, som folk
// faktisk søger på.
//
// Hvorfor: de 384 artikler fra før 24/8 blev til ud fra en video — ingen
// tjekkede om nogen søgte på emnet. Målt 8/9 (audit-demand.mjs): 239 af dem
// har en overskrift, Google ikke har ét beslægtet søgeforslag til. Teksten er
// en analyse af emnet og er i orden; det er skiltet udenpå der ikke matcher
// nogen søgning.
//
// Sådan: for hver artikel
//   1) Gemini foreslår 3 korte emneord (som folk skriver dem) ud fra titel +
//      summary + begyndelsen af teksten.
//   2) Googles autocomplete (src/lib/suggest.mjs — samme som robotten) giver
//      de RIGTIGE spørgsmål folk stiller om de emneord. Ingen forslag = ingen
//      efterspørgsel = artiklen rører vi ikke.
//   3) Gemini vælger det spørgsmål artiklen faktisk besvarer (eller NONE) og
//      skriver en overskrift der indeholder spørgsmålets kerneord i rækkefølge
//      (samme værn som robotten: manglendeKerneord i src/lib/headline.mjs).
//      Kan værnet ikke opfyldes, bruges spørgsmålet selv som overskrift.
//
// SIKKERHED (faldgrube 13): standardkørslen skriver ALDRIG i artiklerne.
//   node retitle-to-demand.mjs                 -> _retitle-plan.json + _retitle-gennemsyn.html
//   node retitle-to-demand.mjs --limit=25      -> kun de første 25 (til test)
//   node retitle-to-demand.mjs --apply         -> skriver title + targetQuestion
//                                                 for alle IKKE-afviste rækker i planen
//   Afvisning: skriv filnavnene, én pr. linje, i _retitle-afvist.txt før --apply.
// URL'erne ændres ikke (slug = filnavn), så ingen redirects. OG-billederne
// bygges af YouTube-miniaturen, ikke af titlen, så de skal ikke laves om.
import fs from 'node:fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hentForslag } from './src/lib/suggest.mjs';
import { pubCase, manglendeKerneord, overskriftAfSpoergsmaal, kerneord } from './src/lib/headline.mjs';

const DIR = 'src/content/videos';
const apply = process.argv.includes('--apply');
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const felt = (raw, k) => raw.match(new RegExp(`^${k}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'm'))?.[1]?.replace(/\\"/g, '"') || '';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (apply) { anvend(); } else { await planlaeg(); }

async function planlaeg() {
  if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY mangler'); process.exit(1); }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 2048, temperature: 0.3 } });
  const spoerg = async (prompt) => (await model.generateContent(prompt)).response.text().trim();

  // Genoptag: allerede planlagte artikler springes over, så en afbrudt kørsel
  // ikke koster alle kaldene igen (YouTube/Google-kald i bunker, faldgrube 5).
  const plan = fs.existsSync('_retitle-plan.json') ? JSON.parse(fs.readFileSync('_retitle-plan.json', 'utf-8')) : {};
  const filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort();
  // Ét spørgsmål pr. artikel. To sider om samme søgning kæmper mod hinanden i
  // Google (kannibalisering) — så spørgsmål der allerede er brugt (af robotten
  // eller tidligere i planen) fjernes fra kandidaterne.
  const brugt = new Set(Object.values(plan).map((r) => r.question).filter(Boolean));
  for (const f of filer) { const q = felt(fs.readFileSync(`${DIR}/${f}`, 'utf-8'), 'targetQuestion'); if (q) brugt.add(q.toLowerCase()); }
  // Fyldord som åbning siger intet og æder plads i de ~60 tegn Google viser.
  const FYLD = /^(understanding|exploring|unpacking|beyond|inside|rethinking|decoding|navigating|demystifying|unlocking|discover(ing)?|explaining)\b/i;
  let n = 0;
  for (const f of filer) {
    if (n >= limit) break;
    if (plan[f]) continue;
    const raw = fs.readFileSync(`${DIR}/${f}`, 'utf-8');
    if (/^targetQuestion:/m.test(raw) || /^isShort:\s*true/m.test(raw)) continue;
    const title = felt(raw, 'title'), summary = felt(raw, 'summary');
    const body = raw.split(/^---\s*$/m)[2]?.replace(/\s+/g, ' ').slice(0, 1500) || '';
    n++;
    const r = { title, status: '', question: '', newTitle: '', candidates: [], topics: [] };
    plan[f] = r;
    try {
      // 1) emneord
      const t = await spoerg(`List 3 short search topics (2-4 words each, lowercase, the way people type them into Google) that this article answers. One per line, no numbering, no punctuation.\n\nTitle: ${title}\nSummary: ${summary}\nText: ${body}`);
      r.topics = t.split('\n').map((x) => x.replace(/^[-*\d.\s]+/, '').trim().toLowerCase()).filter((x) => x && x.length <= 40).slice(0, 3);
      // 2) rigtige spørgsmål fra Google
      const kand = new Set();
      for (const emne of r.topics) for (const q of await hentForslag(emne)) kand.add(q);
      r.candidates = [...kand].filter((q) => !brugt.has(q)).slice(0, 20);
      if (!r.candidates.length) { r.status = 'ingen-efterspørgsel'; console.log(`— ${f}: ingen søgeforslag`); fortsaet(plan); continue; }
      // 3) vælg + skriv overskrift
      const svar = await spoerg(`Below is an article summary and a list of real Google searches. Pick the ONE search the article genuinely answers (the text must already cover it — do not pick a search the article would need new facts for). If none fits, answer NONE.\nThen write a headline of 40-62 characters that contains the core words of that search in the same order (other words may sit between them), reads as natural English, Title Case, no ampersand, no quotes, no colon. Do not open with filler such as "Understanding", "Exploring", "Unpacking", "Beyond", "Inside", "Decoding" — start with the subject or the question word.\n\nAnswer in exactly two lines:\nSEARCH: <the search, copied exactly, or NONE>\nHEADLINE: <the headline, or NONE>\n\nSummary: ${summary}\nText: ${body}\n\nSearches:\n${r.candidates.map((q) => '- ' + q).join('\n')}`);
      const q = svar.match(/SEARCH:\s*(.*)/i)?.[1]?.trim().toLowerCase() || 'none';
      let h = svar.match(/HEADLINE:\s*(.*)/i)?.[1]?.trim() || 'NONE';
      if (q === 'none' || !r.candidates.includes(q)) { r.status = 'intet-match'; console.log(`— ${f}: intet spørgsmål passer`); fortsaet(plan); continue; }
      r.question = q; brugt.add(q);
      h = pubCase(h.replace(/\s*&\s*/g, ' and ').replace(/"/g, "'"));
      // Værnet: samme regel som robotten. Falder tilbage til spørgsmålet selv.
      if (h === 'NONE' || h.length < 25 || h.length > 80 || FYLD.test(h) || manglendeKerneord(h, q).length) h = overskriftAfSpoergsmaal(q);
      r.newTitle = h;
      // Har den gamle titel allerede søgeordet? Så er der intet at rette.
      r.status = manglendeKerneord(title, q).length ? 'foreslået' : 'uændret';
      console.log(`${r.status === 'foreslået' ? '✎' : '='} ${f}\n    ${title}\n    -> ${h}   [${q}]`);
    } catch (e) { r.status = 'fejl: ' + (e.message || e).toString().slice(0, 80); console.log(`! ${f}: ${r.status}`); }
    fortsaet(plan);
  }
  skrivGennemsyn(plan);
  const s = Object.values(plan).reduce((a, r) => { a[r.status.split(':')[0]] = (a[r.status.split(':')[0]] || 0) + 1; return a; }, {});
  console.log('\nPlan:', JSON.stringify(s), '\nSkrevet: _retitle-plan.json og _retitle-gennemsyn.html — INTET er ændret i artiklerne.');
}

function fortsaet(plan) { fs.writeFileSync('_retitle-plan.json', JSON.stringify(plan, null, 1)); }

function skrivGennemsyn(plan) {
  const rows = Object.entries(plan).filter(([, r]) => r.status === 'foreslået');
  const html = `<!doctype html><meta charset="utf-8"><title>Overskrifter mod søgninger: ${rows.length} forslag</title>
<style>body{font:15px/1.4 system-ui;margin:2rem;max-width:1100px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;vertical-align:top}th{background:#f3f3f3;text-align:left}.q{color:#0e7490;font-size:13px}.g{color:#777}tr.x td{background:#fde8e8}</style>
<h1>Overskrifter mod rigtige søgninger — ${rows.length} forslag</h1>
<p>Klik på en række for at afvise den (rød = beholder gammel overskrift). Tryk "Kopiér afviste" og gem teksten som <code>_retitle-afvist.txt</code> i techfeedwatch-mappen. Derefter: <code>node retitle-to-demand.mjs --apply</code>.</p>
<button onclick="navigator.clipboard.writeText([...document.querySelectorAll('tr.x')].map(t=>t.dataset.f).join('\\n'));this.textContent='Kopieret ('+document.querySelectorAll('tr.x').length+')'">Kopiér afviste</button>
<table><tr><th>#</th><th>Gammel</th><th>Ny</th></tr>
${rows.map(([f, r], i) => `<tr data-f="${esc(f)}" onclick="this.classList.toggle('x')"><td>${i + 1}</td><td class="g">${esc(r.title)}</td><td>${esc(r.newTitle)}<br><span class="q">søgning: ${esc(r.question)}</span></td></tr>`).join('\n')}
</table>`;
  fs.writeFileSync('_retitle-gennemsyn.html', html);
}

function anvend() {
  const plan = JSON.parse(fs.readFileSync('_retitle-plan.json', 'utf-8'));
  const afvist = new Set(fs.existsSync('_retitle-afvist.txt') ? fs.readFileSync('_retitle-afvist.txt', 'utf-8').split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : []);
  let n = 0, skip = 0;
  for (const [f, r] of Object.entries(plan)) {
    if (r.status !== 'foreslået') continue;
    if (afvist.has(f)) { skip++; continue; }
    const p = `${DIR}/${f}`;
    let raw = fs.readFileSync(p, 'utf-8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const tm = raw.match(/^title:\s*".*"\s*$/m);
    if (!tm) { console.log('! ingen title-linje: ' + f); continue; }
    const ny = `title: "${r.newTitle.replace(/"/g, "'")}"` + eol + `targetQuestion: "${r.question}"`;
    raw = raw.replace(tm[0], ny);
    fs.writeFileSync(p, raw);
    n++;
  }
  console.log(`Skrev ny title + targetQuestion i ${n} artikler; ${skip} afvist. Husk: npm run build, audit-content, commit.`);
}
