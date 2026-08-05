// Gennemgår ALLE byggede sider og validerer deres JSON-LD mod de felter Google
// faktisk kræver. Kræver et build først — den læser dist/.
//
// Baggrund: Googles test af udvidede resultater kan kun køres én side ad gangen.
// Den fandt en fejl på en artikel; dette script svarer på hvor mange af de andre
// 500+ sider der har den samme.
//
// Brug: node audit-schema.mjs
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

// Felter Google kræver pr. type. Mangler ét, er elementet ikke kvalificeret til
// et udvidet resultat — det er dét testen kalder "ugyldigt".
const REQUIRED = {
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  Article: ['headline', 'image', 'datePublished', 'author', 'publisher'],
  NewsArticle: ['headline', 'image', 'datePublished', 'author', 'publisher'],
  SoftwareApplication: ['name', 'offers', 'applicationCategory'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  ItemList: ['itemListElement'],
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  Person: ['name'],
  ImageObject: [],
  Offer: [],
  WebPage: [],
  ListItem: [],
  Question: [],
  Answer: [],
  // Typer sitet bruger, som Google ikke stiller krav til her. De skal stå på
  // listen, ellers melder scriptet dem som "ukendt" og drukner de rigtige fejl.
  DefinedTerm: ['name'],
  SearchAction: [],
  EntryPoint: [],
  PostalAddress: [],
  ImageGallery: [],
  CollectionPage: [],
};

// Går rekursivt gennem et JSON-LD-træ og finder ALLE typede knuder — også dem
// der ligger inde i andre, som isBasedOn. Det er netop dem Google tæller med
// som selvstændige elementer, og dermed dem der kan være ugyldige uden at man
// opdager det ved at kigge på den yderste blok.
function collectNodes(value, nodes = [], depth = 0, parentPath = '') {
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectNodes(v, nodes, depth, `${parentPath}[${i}]`));
    return nodes;
  }
  if (!value || typeof value !== 'object') return nodes;

  if (typeof value['@type'] === 'string') {
    nodes.push({ type: value['@type'], node: value, depth, path: parentPath || 'root' });
  }
  for (const [key, v] of Object.entries(value)) {
    if (key.startsWith('@')) continue;
    collectNodes(v, nodes, depth + 1, parentPath ? `${parentPath}.${key}` : key);
  }
  return nodes;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const pages = walk(DIST);
const problems = [];
let jsonBlocks = 0, badJson = 0, nodesChecked = 0;

for (const file of pages) {
  const url = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '');
  const html = fs.readFileSync(file, 'utf8');

  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const raw = m[1].trim();
    // Værktøjer som schema-generator har strengen '<script type="application/ld+json">'
    // liggende inde i deres egen JavaScript, som tekst der skal vises til brugeren.
    // Browseren ser den aldrig som en blok — kun mit regex gør. Springer over alt
    // der ikke starter som JSON, ellers melder scriptet fejl på fungerende sider.
    if (!raw.startsWith('{') && !raw.startsWith('[')) continue;
    jsonBlocks++;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      badJson++;
      problems.push({ url, type: '-', issue: `JSON kan ikke parses: ${e.message.slice(0, 60)}` });
      continue;
    }

    for (const { type, node, depth, path: nodePath } of collectNodes(parsed)) {
      nodesChecked++;
      const required = REQUIRED[type];
      if (required === undefined) {
        problems.push({ url, type, issue: `ukendt type (ikke tjekket) på ${nodePath}` });
        continue;
      }
      // En knude der kun er en henvisning (@id) er ikke en mangelfuld knude
      const keys = Object.keys(node).filter((k) => !k.startsWith('@'));
      if (keys.length === 0 && node['@id']) continue;

      const missing = required.filter((f) => node[f] === undefined || node[f] === null || node[f] === '');
      if (missing.length) {
        problems.push({
          url, type,
          issue: `mangler ${missing.join(', ')}${depth > 0 ? ` (indlejret i ${nodePath})` : ''}`,
        });
      }
    }
  }
}

console.log(`Sider: ${pages.length}  ·  JSON-LD blokke: ${jsonBlocks}  ·  knuder tjekket: ${nodesChecked}  ·  ugyldig JSON: ${badJson}`);

if (!problems.length) {
  console.log('\nIngen manglende påkrævede felter fundet.');
  process.exit(0);
}

// Grupperet efter selve problemet, ikke efter side. Ellers drukner 400 ens
// fejl hinanden, og man kan ikke se om det er én fejl eller fire hundrede.
const groups = new Map();
for (const p of problems) {
  const key = `${p.type} — ${p.issue}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p.url);
}

console.log(`\n${problems.length} problemer i ${new Set(problems.map((p) => p.url)).size} sider, fordelt på ${groups.size} slags:\n`);
for (const [key, urls] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${String(urls.length).padStart(5)} x  ${key}`);
  console.log(`         fx ${urls.slice(0, 2).join(' , ')}`);
}
