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
  if (id) entries.push({ file: f, id, raw });
}
console.log(`${entries.length} artikler med video-id af ${files.length} filer`);

// YouTube tager op til 50 id'er pr. kald. 367 artikler bliver altså 8 kald i alt
// og koster 8 kvote-enheder — ikke 367.
const views = new Map();
for (let i = 0; i < entries.length; i += 50) {
  const batch = entries.slice(i, i + 50);
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${batch.map((e) => e.id).join(',')}&key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`Kald ${i / 50 + 1} fejlede: ${res.status}`); continue; }
  const data = await res.json();
  for (const item of data.items || []) {
    const v = Number(item.statistics?.viewCount);
    if (Number.isFinite(v)) views.set(item.id, v);
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
  if (already && Number(already) === v) { unchanged++; continue; }

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
  fs.writeFileSync(path.join(DIR, e.file), out, 'utf8');
  written++;
}

console.log(`\nSkrevet: ${written}  ·  uændret: ${unchanged}  ·  uden svar fra YouTube: ${missing}`);
