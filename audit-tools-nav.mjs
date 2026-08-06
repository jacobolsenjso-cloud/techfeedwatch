// Verificerer værktøjs-omlægningen mod det byggede site i dist/.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const read = (p) => fs.readFileSync(path.join(DIST, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(DIST, p));

const problems = [];
const ok = (msg) => console.log('  OK  ' + msg);
const bad = (msg) => { problems.push(msg); console.log(' FEJL ' + msg); };

const CATS = ['seo', 'content', 'developer', 'media', 'finance'];

// Antallet læses ud af tools.ts i stedet for at stå som et tal her. Scriptet
// meldte "forventede 27, fandt 34" længe efter at 34 var det rigtige — det var
// scriptet der var forældet, ikke sitet. Et hardkodet tal i et målescript
// bliver til en falsk fejl i samme øjeblik nogen tilføjer et værktøj.
const toolsSrc = fs.readFileSync('src/lib/tools.ts', 'utf8');
// Kun fra 'export const TOOLS' og frem: kategorilisten ovenfor har også slug-felter,
// og talte man hele filen, blev svaret 39 i stedet for 34.
const toolsBody = toolsSrc.slice(toolsSrc.indexOf('export const TOOLS'));
const EXPECTED_TOOLS = (toolsBody.match(/^\s*slug:\s*'/gm) || []).length;
const EXPECTED_FEATURED = (toolsBody.match(/^\s*featured:\s*true/gm) || []).length;

console.log('\n== 1. Kategorisider er bygget ==');
for (const c of CATS) {
  exists(`tools/${c}/index.html`) ? ok(`/tools/${c}/`) : bad(`/tools/${c}/ mangler`);
}

console.log(`\n== 2. Alle ${EXPECTED_TOOLS} værktøjssider findes stadig ==`);
const toolsTs = fs.readFileSync('src/lib/tools.ts', 'utf8');
const body = toolsTs.slice(toolsTs.indexOf('export const TOOLS'));
const slugs = [...body.matchAll(/^\s+slug: '([a-z0-9-]+)',/gm)].map((m) => m[1]);
console.log(`  ${slugs.length} værktøjer i listen`);
for (const s of slugs) {
  if (!exists(`tools/${s}/index.html`)) bad(`/tools/${s}/ mangler i dist`);
}
if (slugs.length === EXPECTED_TOOLS) ok(`${EXPECTED_TOOLS} værktøjer`); else bad(`forventede ${EXPECTED_TOOLS}, fandt ${slugs.length}`);

console.log('\n== 3. Hvert værktøj er linket fra sin kategoriside ==');
for (const c of CATS) {
  const html = read(`tools/${c}/index.html`);
  const linked = [...html.matchAll(/href="\/tools\/([a-z0-9-]+)"/g)].map((m) => m[1]);
  const own = linked.filter((s) => slugs.includes(s));
  console.log(`  /tools/${c}: ${own.length} værktøjslinks`);
  if (own.length === 0) bad(`/tools/${c} linker ikke til nogen værktøjer`);
}

console.log('\n== 4. Alle 27 nås fra /tools ==');
const idx = read('tools/index.html');
const idxLinks = new Set([...idx.matchAll(/href="\/tools\/([a-z0-9-]+)"/g)].map((m) => m[1]));
const missing = slugs.filter((s) => !idxLinks.has(s));
missing.length ? bad(`ikke linket fra /tools: ${missing.join(', ')}`) : ok('alle 27 linket fra /tools');
const catLinks = CATS.filter((c) => idxLinks.has(c));
catLinks.length === 5 ? ok('alle 5 kategorier linket fra /tools') : bad(`kun ${catLinks.length}/5 kategorilinks på /tools`);

console.log('\n== 5. Forsidens værktøjssektion ==');
const home = read('index.html');
const homeToolLinks = [...home.matchAll(/class="home-tool"[^>]*|href="\/tools\/([a-z0-9-]+)" class="home-tool"/g)];
const featured = [...home.matchAll(/href="\/tools\/([a-z0-9-]+)"\s+class="home-tool"/g)].map((m) => m[1]);
console.log(`  ${featured.length} værktøjer i sektionen: ${featured.join(', ')}`);
featured.length === EXPECTED_FEATURED ? ok(`${EXPECTED_FEATURED} udvalgte værktøjer`) : bad(`forventede ${EXPECTED_FEATURED}, fandt ${featured.length}`);
const badFeatured = featured.filter((s) => !slugs.includes(s));
if (badFeatured.length) bad(`ukendt slug på forsiden: ${badFeatured.join(', ')}`);
home.includes(`All ${EXPECTED_TOOLS} tools`) ? ok(`link til alle ${EXPECTED_TOOLS} værktøjer`) : bad(`mangler "All ${EXPECTED_TOOLS} tools"-link`);

console.log('\n== 6. Kategorisider i sitemap ==');
const smFiles = fs.readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
const sm = smFiles.map((f) => read(f)).join('');
for (const c of CATS) {
  sm.includes(`/tools/${c}/`) ? ok(`sitemap: /tools/${c}/`) : bad(`sitemap mangler /tools/${c}/`);
}

console.log('\n== 7. Interne links på kategorisider peger på noget der findes ==');
const localPath = (href) => {
  const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '');
  // '/' er forsiden: dist/index.html, ikke en undermappe.
  if (!clean) return exists('index.html') ? null : '/';
  return exists(clean + '/index.html') || exists(clean + '.html') || exists(clean) ? null : clean;
};
let broken = 0;
for (const c of [...CATS, '']) {
  const file = c ? `tools/${c}/index.html` : 'tools/index.html';
  // Uden at fjerne script-blokke først opfanges href-strenge inde i JS
  // (fx '/video/' + v.slug) som var de rigtige links. Det er ikke fejl på siden.
  const html = read(file).replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const miss = localPath(m[1]);
    if (miss) { bad(`${file}: dødt link -> ${m[1]}`); broken++; }
  }
}
if (!broken) ok('ingen døde interne links på /tools eller kategorisiderne');

console.log('\n== 8. Meta og h1 ==');
for (const c of CATS) {
  const html = read(`tools/${c}/index.html`);
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1];
  const desc = (html.match(/<meta name="description" content="(.*?)"/s) || [])[1];
  const h1n = (html.match(/<h1[\s>]/g) || []).length;
  if (h1n !== 1) bad(`/tools/${c}: ${h1n} h1-tags`);
  if (!desc) bad(`/tools/${c}: ingen meta description`);
  else if (desc.length > 165) bad(`/tools/${c}: description ${desc.length} tegn (for lang)`);
  else console.log(`  /tools/${c}: h1 ok, description ${desc.length} tegn`);
}

console.log('\n== 9. ItemList-schema ==');
for (const c of [...CATS, '']) {
  const file = c ? `tools/${c}/index.html` : 'tools/index.html';
  const html = read(file);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => m[1]);
  let found = false;
  for (const b of blocks) {
    try {
      const j = JSON.parse(b);
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) {
        if (o['@type'] === 'ItemList') {
          found = true;
          if (o.itemListElement.length !== o.numberOfItems) bad(`${file}: numberOfItems passer ikke`);
          console.log(`  ${file}: ItemList med ${o.itemListElement.length} punkter`);
        }
      }
    } catch { bad(`${file}: ugyldig JSON-LD`); }
  }
  if (!found) bad(`${file}: intet ItemList-schema`);
}

console.log('\n== 10. Brødkrumme-schema ==');
const tool = read('tools/json-formatter/index.html');
const bc = [...tool.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
  .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
  .flatMap((j) => (Array.isArray(j) ? j : [j]))
  .find((o) => o && o['@type'] === 'BreadcrumbList');
if (!bc) bad('/tools/json-formatter: ingen BreadcrumbList');
else {
  const names = bc.itemListElement.map((i) => i.name);
  console.log('  ' + names.join(' > '));
  if (names.some((n) => /\//.test(n))) bad('brødkrumme indeholder stadig en skråstreg');
  else ok('brødkrumme ser rigtig ud');
}

console.log('\n' + '='.repeat(50));
console.log(problems.length ? `${problems.length} PROBLEM(ER)` : 'ALT OK');
for (const p of problems) console.log(' - ' + p);
