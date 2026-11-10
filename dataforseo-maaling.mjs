// Første måling af søgetal på hele sitet (Jacob 10/11-2026, "mål før du foreslår").
// Slår alle artiklers spørgsmål (targetQuestion) op i DataForSEO (ét kald, ca. $0,07) og viser:
// dækning (hvor mange har tal), fordeling, de mest søgte, og hvordan omskrivningskøen ser ud med søgetal.
// Svarene gemmes i hukommelsen (src/data/dataforseo.json), så robotten ikke betaler for dem igen i 30 dage.
// Kører på GitHub (workflow "DataForSEO-måling"), hvor nøglerne er. Uden nøgle: siger det og stopper.
// Kun autocomplete-spørgsmål og DataForSEO-tal skrives ud - ingen Search Console-data (repoet er offentligt).
import fs from 'node:fs';
import { hentTal, normaliser, gruppe, vaerdi, talTekst, logLinje, MIN_SOEGNINGER, harNoegle } from './src/lib/dataforseo.mjs';

if (!harNoegle()) { console.log('Stop: DATAFORSEO_LOGIN/PASSWORD mangler - intet kald.'); process.exit(1); }
const DIR = './src/content/videos';
const artikler = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf8').replace(/\r/g, '');
  return {
    slug: f.replace(/\.md$/, ''),
    spm: raw.match(/^targetQuestion:\s*"(.*)"/m)?.[1] || '',
    ny: /^recipe:\s*3\b/m.test(raw),
    short: /^isShort:\s*true/m.test(raw),
    dato: raw.match(/^date:\s*"(.*)"/m)?.[1] || '',
  };
}).filter((a) => a.spm);

const { tal, log } = await hentTal(artikler.map((a) => a.spm));
const talFor = (a) => tal.get(normaliser(a.spm));
const L = [];
const p = (s = '') => { L.push(s); console.log(s); };
p(logLinje(log, artikler, talFor));
if (log.fejl) p(`DataForSEO fejlede: ${log.fejl}`);

const n = artikler.length;
const kendt = artikler.filter((a) => talFor(a));
const pct = (x) => `${Math.round((100 * x) / n)} %`;
const v = kendt.map((a) => talFor(a).v).sort((a, b) => a - b);
const kv = (q) => (v.length ? v[Math.min(v.length - 1, Math.floor(q * v.length))] : 0);
p(`\n## Dækning (${n} artikler med spørgsmål)`);
p(`- Kendt af DataForSEO: ${kendt.length} (${pct(kendt.length)}) · ukendt: ${n - kendt.length - artikler.filter((a) => talFor(a) === undefined).length} · ikke spurgt (for lange/over loftet): ${artikler.filter((a) => talFor(a) === undefined).length}`);
p(`- Mindst ${MIN_SOEGNINGER} søgninger/md: ${artikler.filter((a) => gruppe(talFor(a)) === 0).length} (${pct(artikler.filter((a) => gruppe(talFor(a)) === 0).length)})`);
p(`- 1-${MIN_SOEGNINGER - 1}: ${kendt.filter((a) => talFor(a).v > 0 && talFor(a).v < MIN_SOEGNINGER).length} · 0: ${kendt.filter((a) => !talFor(a).v).length}`);
p(`- Søgninger/md blandt de kendte: median ${kv(0.5)}, 75 % ${kv(0.75)}, 90 % ${kv(0.9)}, største ${v[v.length - 1] || 0}`);
p(`- Nye (opskrift 3) med nok søgninger: ${artikler.filter((a) => a.ny && gruppe(talFor(a)) === 0).length} af ${artikler.filter((a) => a.ny).length}`);

p(`\n## De 15 mest værdifulde spørgsmål (søgninger × lethed)`);
for (const a of [...artikler].sort((a, b) => vaerdi(talFor(b)) - vaerdi(talFor(a))).slice(0, 15)) p(`- ${vaerdi(talFor(a))}  "${a.spm}" - ${talTekst(talFor(a))}${a.ny ? '' : ' · venter på omskrivning'}`);

const koe = artikler.filter((a) => !a.ny && !a.short);
p(`\n## Omskrivningskøen (${koe.length} gamle artikler med spørgsmål, før spærrede fratrukket)`);
p(`- Med nok søgninger: ${koe.filter((a) => gruppe(talFor(a)) === 0).length} · ukendt: ${koe.filter((a) => gruppe(talFor(a)) === 1).length} · for få: ${koe.filter((a) => gruppe(talFor(a)) === 2).length}`);
p(`- Ved 3 om dagen tager de med nok søgninger ca. ${Math.ceil(koe.filter((a) => gruppe(talFor(a)) === 0).length / 3)} dage at nå igennem (før kom de i tilfældig rækkefølge efter dato).`);
p(`\nPris i alt: $${log.pris}`);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `# DataForSEO-måling\n\n${L.join('\n')}\n`);
