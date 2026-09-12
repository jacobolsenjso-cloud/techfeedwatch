// Skridt 2 af 2: skriv arkivets artikler om gennem den nye kæde (faktaark →
// artikel → kontrol), én ad gangen, med `node add-video.mjs --erstat <slug>`.
//
// Hvem: kun artikler, som audit-relevans.mjs har dømt "ja" (kilden dækker
// spørgsmålet). "Nej"-artiklerne kan ikke omskrives med samme kilde og
// behandles separat. Artikler der allerede er omskrevet med kæden (rewrittenAt
// på/efter 12/9-2026) springes over, så kørslen kan genoptages.
//
// Hvorfor i bidder: 181 artikler à ~2 minutter er 6 timer. Hver BATCH
// committes og pushes, så arbejdet ikke går tabt, hvis pc'en lukkes, og så
// sitet opdateres løbende. Cloudflare bygger ved push; fejler et build, bliver
// den forrige udgave stående.
//
// Kør: node rewrite-arkiv.mjs            (genoptager fra src/data/rewrite-arkiv-log.json)
//      node rewrite-arkiv.mjs --kun 3    (prøve)
//      node rewrite-arkiv.mjs --ingen-git (skriv kun filer, commit selv)
// I skyen: GitHub → Actions → "Archive rewrite" → Run workflow (antal pr. kørsel).
import fs from 'fs';
import { execSync } from 'child_process';

// Kører i GitHub Actions (rewrite-archive.yml), fordi YouTube drosler
// transskript-hentning fra Jacobs pc efter ~280 hentninger (målt 12/9). Derfor
// ligger dommen og loggen under src/data/ og committes med hver batch — så kan
// næste kørsel (ny maskine, ingen lokal disk) genoptage, hvor den forrige slap.
const KAEDE_FRA = '2026-09-12';   // kæden med faktaark blev taget i brug denne dag
const BATCH = 15;
const DOM = 'src/data/relevans.json';        // fra audit-relevans.mjs (kopi af _relevans.json)
const LOG = 'src/data/rewrite-arkiv-log.json';
const kun = process.argv.includes('--kun') ? +(process.argv[process.argv.indexOf('--kun') + 1] || 0) : 0;
const ingenGit = process.argv.includes('--ingen-git');

const rel = JSON.parse(fs.readFileSync(DOM, 'utf8'));
let log = {};
if (fs.existsSync(LOG)) { try { log = JSON.parse(fs.readFileSync(LOG, 'utf8')); } catch { log = {}; } }

const todo = Object.values(rel)
  .filter((a) => a.dom === 'ja')
  .filter((a) => {
    const raw = fs.existsSync(`src/content/videos/${a.slug}.md`) ? fs.readFileSync(`src/content/videos/${a.slug}.md`, 'utf8') : '';
    const rw = raw.match(/^rewrittenAt:\s*"(.*?)"/m)?.[1] || '';
    return raw && rw < KAEDE_FRA && !(log[a.slug] && log[a.slug].status === 'ok');
  })
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .slice(0, kun || undefined);

console.log(`Skal omskrives: ${todo.length} (allerede færdige: ${Object.values(log).filter((x) => x.status === 'ok').length})`);

const sov = (ms) => new Promise((r) => setTimeout(r, ms));
const gem = () => fs.writeFileSync(LOG, JSON.stringify(log, null, 1), 'utf8');

function commitBatch(slugs) {
  if (ingenGit || !slugs.length) return;
  try {
    const filer = [LOG, ...slugs.flatMap((s) => [`src/content/videos/${s}.md`, `public/og/${s}.jpg`])].filter((f) => fs.existsSync(f));
    execSync(`git add ${filer.map((f) => `"${f}"`).join(' ')}`, { stdio: 'inherit' });
    fs.writeFileSync('_commitmsg.txt', `Archive rewrite: ${slugs.length} articles through the fact-sheet chain\n\nRewritten with node add-video.mjs --erstat (same URL, date and search question;\nrewrittenAt set). Source verified to cover the question by audit-relevans.mjs.\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>\n`, 'utf8');
    execSync('git commit -F _commitmsg.txt', { stdio: 'inherit' });
    execSync('git pull --rebase', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log(`📦 Batch committet og pushet: ${slugs.length} artikler`);
  } catch (e) {
    console.log(`⚠️ git fejlede (${e.message.split('\n')[0]}) — filerne ligger stadig lokalt, commit i hånden`);
  }
}

let batch = [];
let n = 0;
for (const a of todo) {
  n++;
  const foer = fs.readFileSync(`src/content/videos/${a.slug}.md`, 'utf8');
  let ud = '';
  let status = 'fejl';
  // YouTube drosler transskript-hentning: "Transcript is disabled" efter mange
  // hentninger i træk. Så venter vi og prøver igen, op til 3 gange.
  for (let forsoeg = 0; forsoeg < 3; forsoeg++) {
    try {
      ud = execSync(`node add-video.mjs --erstat "${a.slug}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10 * 60 * 1000 });
    } catch (e) {
      ud = (e.stdout || '') + (e.stderr || '') + e.message;
    }
    const efter = fs.readFileSync(`src/content/videos/${a.slug}.md`, 'utf8');
    if (efter !== foer && /^rewrittenAt:\s*"2026-/m.test(efter)) { status = 'ok'; break; }
    if (/Transcript is disabled|Undertekster mangler|ingen transskript/i.test(ud)) {
      console.log(`   YouTube drosler — venter ${2 * (forsoeg + 1)} min`);
      await sov(2 * 60 * 1000 * (forsoeg + 1));
      continue;
    }
    status = /Sprunget over/.test(ud) ? 'afvist' : 'fejl';
    break;
  }
  const linje = (ud.match(/(Kontrol ok|Stadig|Sprunget over|Fejl|tal uden dækning)[^\n]*/) || [''])[0].trim();
  log[a.slug] = { status, q: a.q, linje, dato: new Date().toISOString() };
  gem();
  console.log(`${n}/${todo.length} ${status === 'ok' ? '✅' : status === 'afvist' ? '⏭️' : '❌'} ${a.slug} — ${linje}`);
  if (status === 'ok') batch.push(a.slug);
  if (batch.length >= BATCH) { commitBatch(batch); batch = []; }
  await sov(3000);
}
commitBatch(batch);

const t = Object.values(log);
console.log(`\nFærdig: ok ${t.filter((x) => x.status === 'ok').length} · afvist ${t.filter((x) => x.status === 'afvist').length} · fejl ${t.filter((x) => x.status === 'fejl').length}`);
