// Henter visningstal for kildevideoerne og skriver dem ind i artiklernes frontmatter.
//
// Kører både første gang (fylder alle 367 op) og som opfriskning senere — den
// skriver kun filer hvor tallet faktisk har ændret sig.
//
// Hvorfor tallet gemmes i filen frem for at blive hentet ved build: et build må
// ikke afhænge af at YouTubes API svarer. Fejler API'et, bygger sitet stadig med
// de tal vi havde sidst — og datoen på siden viser ærligt hvor gamle de er.
//
// Brug: node update-view-counts.mjs
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const DIR = 'src/content/videos';
// Nøglen hedder Youtube_API_KEY i .env lokalt. Windows er ligeglad med store og
// små bogstaver i miljøvariabler, Linux er ikke — derfor begge stavemåder.
const KEY = process.env.YOUTUBE_API_KEY || process.env.Youtube_API_KEY;
if (!KEY) { console.error('Mangler YOUTUBE_API_KEY'); process.exit(1); }

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const entries = [];
for (const f of files) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  const id = raw.match(/^youtubeId:\s*"([^"]+)"/m)?.[1];
  const channelId = raw.match(/^channelId:\s*"([^"]+)"/m)?.[1] || null;
  if (id) entries.push({ file: f, id, channelId, raw });
}
console.log(`${entries.length} artikler med video-id af ${files.length} filer`);

// YouTube tager op til 50 id'er pr. kald. 367 artikler bliver altså 8 kald i alt
// og koster 8 kvote-enheder — ikke 367.
//
// Vi beder også om snippet: det koster ingen ekstra kvote, og svaret indeholder
// thumbnails.maxres KUN når det store miniaturebillede findes. Det er den
// eneste pålidelige måde at vide det på, og uden det lover artiklernes schema
// et billede der giver 404 for 18 af videoerne.
const views = new Map();
const hasMaxres = new Map();
for (let i = 0; i < entries.length; i += 50) {
  const batch = entries.slice(i, i + 50);
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${batch.map((e) => e.id).join(',')}&key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`Kald ${i / 50 + 1} fejlede: ${res.status}`); continue; }
  const data = await res.json();
  for (const item of data.items || []) {
    const v = Number(item.statistics?.viewCount);
    if (Number.isFinite(v)) views.set(item.id, v);
    hasMaxres.set(item.id, Boolean(item.snippet?.thumbnails?.maxres));
  }
  console.log(`kald ${i / 50 + 1}: ${data.items?.length || 0} svar`);
}

const today = new Date().toISOString().slice(0, 10);
let written = 0, unchanged = 0, missing = 0;

for (const e of entries) {
  const v = views.get(e.id);
  // Video ikke i svaret = slettet eller privat. Vi rører ikke filen; det er
  // prune-videos.yml's opgave at fjerne artikler hvis kilden er væk.
  if (v === undefined) { missing++; continue; }

  const already = e.raw.match(/^viewCount:\s*(\d+)/m)?.[1];
  const maxres = hasMaxres.get(e.id) === true;
  const maxresLine = e.raw.match(/^thumbMax:\s*(true|false)\s*$/m)?.[1];
  const maxresSame = maxresLine !== undefined && (maxresLine === 'true') === maxres;
  // Skriv kun hvis noget faktisk har ændret sig — hverken visningstal eller
  // thumbMax. Ellers rører vi 371 filer hver tredje dag for ingenting.
  if (already && Number(already) === v && maxresSame) { unchanged++; continue; }

  let out;
  if (already !== undefined) {
    // Opdatér de to linjer der allerede står der
    out = e.raw
      .replace(/^viewCount:\s*\d+\s*$/m, `viewCount: ${v}`)
      .replace(/^viewsUpdated:\s*"[^"]*"\s*$/m, `viewsUpdated: "${today}"`);
  } else {
    // Indsæt lige efter duration-linjen, så frontmatter beholder sin rækkefølge
    out = e.raw.replace(/^(duration:\s*"[^"]*"\s*)$/m, `$1\nviewCount: ${v}\nviewsUpdated: "${today}"`);
    if (out === e.raw) { console.error(`Kunne ikke finde duration i ${e.file} — sprunget over`); continue; }
  }

  // thumbMax: findes det store miniaturebillede? Skrives efter viewsUpdated.
  if (maxresLine !== undefined) {
    out = out.replace(/^thumbMax:\s*(true|false)\s*$/m, `thumbMax: ${maxres}`);
  } else {
    out = out.replace(/^(viewsUpdated:\s*"[^"]*"\s*)$/m, `$1\nthumbMax: ${maxres}`);
  }

  fs.writeFileSync(path.join(DIR, e.file), out, 'utf8');
  written++;
}

console.log(`\nSkrevet: ${written}  ·  uændret: ${unchanged}  ·  uden svar fra YouTube: ${missing}`);

// --- Historik: gem visningstallet over tid ---------------------------------
// Robotten hentede allerede tallet hver tredje dag og OVERSKREV det gamle. Vi
// smed altså data væk hver eneste gang. Gemmer vi det i stedet, kan vi vise
// noget ingen andre har: hvilke videoer der tager fart efter vi dækkede dem.
// Det kræver kun tid, og tiden går uanset — men kun hvis nogen skriver ned.
//
// Ét punkt om ugen pr. video. Jobbet kører hver tredje dag, så uden en
// mindsteafstand ville filen vokse tre gange hurtigere end den behøver.
// Ingen bagudrettede punkter: vi ved ikke hvad tallet var i går.
const HIST = 'src/data/view-history.json';
const MIN_DAYS = 6;
const MAX_POINTS = 60;   // ca. et års ugentlige punkter pr. video

let hist = { method: 'Visninger på kildevideoen, ét punkt pr. uge. Ikke bagudrettet.', videos: {} };
if (fs.existsSync(HIST)) {
  try { hist = JSON.parse(fs.readFileSync(HIST, 'utf8')); }
  catch (e) { console.error(`Kunne ikke læse ${HIST}: ${e.message} — starter forfra`); }
}

const daysBetween = (a, b) => Math.abs(new Date(a) - new Date(b)) / 86400000;
let added = 0, tooSoon = 0;

for (const e of entries) {
  const v = views.get(e.id);
  if (v === undefined) continue;
  const rec = hist.videos[e.id] || (hist.videos[e.id] = { points: [] });
  const last = rec.points[rec.points.length - 1];
  if (last && daysBetween(last[0], today) < MIN_DAYS) { tooSoon++; continue; }
  rec.points.push([today, v]);
  if (rec.points.length > MAX_POINTS) rec.points = rec.points.slice(-MAX_POINTS);
  added++;
}

// Videoer der ikke længere er på sitet fylder bare. prune-videos.yml har
// allerede fjernet artiklen; historikken skal følge med.
const alive = new Set(entries.map((e) => e.id));
let dropped = 0;
for (const id of Object.keys(hist.videos)) {
  if (!alive.has(id)) { delete hist.videos[id]; dropped++; }
}

fs.mkdirSync(path.dirname(HIST), { recursive: true });
fs.writeFileSync(HIST, JSON.stringify(hist) + '\n', 'utf8');
const withTwo = Object.values(hist.videos).filter((r) => r.points.length >= 2).length;
console.log(`Historik: ${added} nye punkter · ${tooSoon} for tidligt · ${dropped} fjernet · ${withTwo} videoer har nok til at vise en udvikling`);


// --- Kanalgennemsnit til /popular ---
// /popular rangerer efter hvor mange gange flere visninger en video fik end
// kanalens egen gennemsnitsvideo. Uden det måler listen bare kanalstørrelse.
// Gennemsnittet er kanalens samlede visninger delt med antal videoer. Det er en
// grov baseline: en kanal der lægger mange korte klip op får et lavt gennemsnit,
// så deres lange videoer ser bedre ud end de er. Skal det være skarpere, skal man
// sammenligne med kanalens seneste videoer — det koster ét kald pr. kanal i
// stedet for ét pr. 50, og vi starter billigt.
const channelIds = [...new Set(entries.map((e) => e.channelId).filter(Boolean))];
const channels = {};
for (let i = 0; i < channelIds.length; i += 50) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.slice(i, i + 50).join(',')}&key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`Kanalkald ${i / 50 + 1} fejlede: ${res.status}`); continue; }
  const data = await res.json();
  for (const it of data.items || []) {
    const total = Number(it.statistics?.viewCount);
    const count = Number(it.statistics?.videoCount);
    if (total > 0 && count > 0) channels[it.id] = Math.round(total / count);
  }
}

const OUT = 'src/data/channel-averages.json';
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ updated: today, averageViewsPerVideo: channels }, null, 2) + '\n', 'utf8');
console.log(`Kanalgennemsnit: ${Object.keys(channels).length} af ${channelIds.length} kanaler → ${OUT}`);
