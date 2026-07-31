import fs from 'fs';

// Reparerer interne /video/-links i artikelteksten. To slags problemer:
//
// 1) SLÅFEJL. Gemini skriver "AVAILABLE INTERNAL LINKS" af i hånden og laver
//    af og til fejl: dubletord ("unpacks-the-the-future"), tabte ord, rå
//    video-ID'er, HTML-entiteter. Disse matches mod det rigtige slug.
//
// 2) LINKS TIL SLETTEDE SHORTS. Da Shorts-sektionen blev nedlagt, blev 205
//    sider fjernet — men 589 links i andre artikler pegede stadig på dem.
//    De 301'er til en tag-side, hvilket virker, men "som beskrevet i [titel]"
//    der lander på en emneoversigt er forvirrende. De retargetes i stedet til
//    en levende artikel med emne-overlap, og ankerteksten skrives om til den
//    nye artikels titel, så sætningen stadig passer.
//
// Kør: node fix-internal-links.mjs [--dry]

const VIDEOS_DIR = './src/content/videos';
const DRY = process.argv.includes('--dry');
const MIN_SIMILARITY = 0.82;

const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));

// --- Indlæs alle levende artikler med titel og tags ---
const articles = new Map(); // slug -> { title, tags, date }
const byVideoId = new Map();

for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const c = fs.readFileSync(`${VIDEOS_DIR}/${f}`, 'utf-8');

  const title = (c.match(/^title:\s*"(.*?)"/m) || [])[1] || slug;
  const date = (c.match(/^date:\s*"(.*?)"/m) || [])[1] || '';
  const vid = (c.match(/youtubeId:\s*"(.*?)"/) || [])[1];

  const tagBlock = c.match(/^tags:\s*\r?\n((?:\s+-\s+".*?"\r?\n)+)/m);
  const tags = tagBlock ? [...tagBlock[1].matchAll(/-\s+"(.*?)"/g)].map((m) => m[1]) : [];

  articles.set(slug, { title, tags, date });
  if (vid) byVideoId.set(vid, slug);
}

const realSlugs = new Set(articles.keys());

// Slugs der blev slettet sammen med Shorts-sektionen
const deletedShorts = new Set();
for (const line of fs.readFileSync('./public/_redirects', 'utf-8').split(/\r?\n/)) {
  const m = line.trim().match(/^\/video\/(\S+)\s+\/tag\//);
  if (m) deletedShorts.add(m[1]);
}

// --- Levenshtein til slåfejl ---
function distance(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
const similarity = (a, b) => 1 - distance(a, b) / Math.max(a.length, b.length);

const normalise = (raw) => {
  const stripped = raw.replace(/%25$/, '');
  let decoded;
  try { decoded = decodeURIComponent(stripped); } catch { decoded = stripped; }
  return decoded
    .replace(/&#x27;|&#39;/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
    .replace(/-+$/, '');
};

const bestMatch = (needle, haystack) => {
  let best = null, bestScore = 0;
  for (const s of haystack) {
    const score = similarity(needle, s);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return bestScore >= MIN_SIMILARITY ? best : null;
};

// Afgør hvad et brudt link egentlig pegede på.
// Returnerer { kind: 'live', slug } hvis det bare var en slåfejl i et gyldigt slug,
// eller { kind: 'deleted' } hvis målet var en Short vi har fjernet (og som derfor
// skal retargetes i stedet for at få rettet slug'et).
function classify(broken) {
  if (realSlugs.has(broken)) return { kind: 'live', slug: broken };
  if (deletedShorts.has(broken)) return { kind: 'deleted' };

  // Rå video-ID: kendt = levende artikel, ukendt = tilhørte en slettet Short
  if (byVideoId.has(broken)) return { kind: 'live', slug: byVideoId.get(broken) };
  if (/^[A-Za-z0-9_-]{11}$/.test(broken)) return { kind: 'deleted' };

  const cleaned = normalise(broken);
  if (realSlugs.has(cleaned)) return { kind: 'live', slug: cleaned };
  if (deletedShorts.has(cleaned)) return { kind: 'deleted' };

  // Slåfejl: find nærmeste blandt både levende og slettede, og lad det bedste vinde
  const liveHit = bestMatch(cleaned, realSlugs);
  const deadHit = bestMatch(cleaned, deletedShorts);
  if (liveHit && deadHit) {
    return similarity(cleaned, deadHit) > similarity(cleaned, liveHit)
      ? { kind: 'deleted' }
      : { kind: 'live', slug: liveHit };
  }
  if (deadHit) return { kind: 'deleted' };
  if (liveHit) return { kind: 'live', slug: liveHit };
  return null;
}

// Hvor mange gange hvert slug allerede er brugt som erstatning. Uden det ville
// de nyeste artikler samle alle 589 links — en unaturlig linkprofil der både
// ser manipuleret ud og spilder den interne linkværdi.
const usageCount = new Map();

// --- Vælg erstatning for et link til en slettet Short ---
// Prioritet: emne-overlap med kildeartiklen -> færrest links i forvejen -> nyeste.
// Aldrig kildeartiklen selv, og aldrig noget der allerede er linket i samme tekst.
function pickReplacement(sourceSlug, alreadyLinked) {
  const source = articles.get(sourceSlug);
  if (!source) return null;

  let best = null, bestScore = -Infinity;
  for (const [slug, a] of articles) {
    if (slug === sourceSlug || alreadyLinked.has(slug)) continue;
    const overlap = a.tags.filter((t) => source.tags.includes(t)).length;
    if (overlap === 0) continue;

    const used = usageCount.get(slug) || 0;
    const score = overlap * 1_000_000 - used * 1000 + (Date.parse(a.date) || 0) / 1e10;
    if (score > bestScore) { bestScore = score; best = slug; }
  }

  if (best) usageCount.set(best, (usageCount.get(best) || 0) + 1);
  return best;
}

let fixedTypos = 0, retargeted = 0, unresolved = 0;
const samples = [];

for (const file of files) {
  const path = `${VIDEOS_DIR}/${file}`;
  const sourceSlug = file.replace(/\.md$/, '');
  let content = fs.readFileSync(path, 'utf-8');
  const original = content;

  // Hold styr på hvad denne artikel allerede linker til
  const alreadyLinked = new Set(
    [...content.matchAll(/\]\(\/video\/([^)\s]+)\)/g)]
      .map((m) => m[1])
      .filter((s) => realSlugs.has(s))
  );

  // Match hele markdown-linket, så ankerteksten kan skrives om
  const linkRe = /\[([^\]]+)\]\(\/video\/([^)\s]+)\)/g;
  content = content.replace(linkRe, (whole, text, target) => {
    if (realSlugs.has(target)) return whole;

    const verdict = classify(target);
    if (!verdict) { unresolved++; return whole; }

    if (verdict.kind === 'live') {
      fixedTypos++;
      // Ankerteksten var korrekt her — kun slug'et var forkert
      return `[${text}](/video/${verdict.slug})`;
    }

    // Målet var en slettet Short: peg på en beslægtet levende artikel og
    // skriv ankerteksten om, så sætningen stadig passer til det den linker til.
    const repl = pickReplacement(sourceSlug, alreadyLinked);
    if (!repl) { unresolved++; return whole; }
    alreadyLinked.add(repl);
    retargeted++;
    if (samples.length < 6) {
      samples.push(`  ${file}\n    "${text}"\n    -> "${articles.get(repl).title}"`);
    }
    return `[${articles.get(repl).title}](/video/${repl})`;
  });

  if (content !== original && !DRY) fs.writeFileSync(path, content);
}

console.log(`${DRY ? '(TØRKØRSEL)\n' : ''}`);
console.log(`Slåfejl rettet          : ${fixedTypos}`);
console.log(`Links til slettede Shorts retargetet: ${retargeted}`);
console.log(`Kunne ikke løses        : ${unresolved}`);
console.log(`\nEksempler på retargeting:`);
console.log(samples.join('\n'));

// Fordelingstjek: hvis få artikler samler alle links, er noget galt
const counts = [...usageCount.values()].sort((a, b) => b - a);
console.log(`\nFordeling af de ${retargeted} nye links:`);
console.log(`  artikler brugt som mål : ${usageCount.size}`);
console.log(`  flest links til én side: ${counts[0] || 0}`);
console.log(`  median                 : ${counts[Math.floor(counts.length / 2)] || 0}`);
