import fs from 'fs';

// Fjerner Shorts-artikler. De havde ingen brødtekst — kun en indlejret video fra
// en tredjepart — og udgjorde 38% af sitets sider. Tomme sider er en belastning
// ved AdSense-gennemgang, og noindex skjuler dem ikke for en menneskelig anmelder.
//
// Hver slettet side får en 301 til sit primære tag, så eventuelle delte links
// lander et relevant sted i stedet for på en 404.
//
// Kør: node remove-shorts.mjs

const VIDEOS_DIR = './src/content/videos';
const REDIRECTS = './public/_redirects';

const tagSlug = (tag) =>
  String(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.md'));
const removed = [];

for (const file of files) {
  const path = `${VIDEOS_DIR}/${file}`;
  const content = fs.readFileSync(path, 'utf-8');

  if (!/isShort:\s*true/.test(content)) continue;

  // Sikkerhedstjek: rør kun filer der reelt er tomme, så en Short med rigtig
  // brødtekst ikke ryger med ved en fejl.
  const parts = content.split(/^---\s*$/m);
  const body = (parts[2] || '').trim();
  if (body.length > 0) {
    console.log(`⏭️  Beholder ${file}: har ${body.split(/\s+/).length} ord brødtekst.`);
    continue;
  }

  // Primært tag bruges som redirect-mål
  const tagBlock = content.match(/tags:\s*\r?\n((?:\s+-\s+".*?"\r?\n)+)/);
  let target = '/library';
  if (tagBlock) {
    const first = tagBlock[1].match(/-\s+"(.*?)"/);
    if (first) target = `/tag/${tagSlug(first[1])}`;
  }

  const slug = file.replace(/\.md$/, '');
  removed.push({ slug, target });
  fs.unlinkSync(path);
}

if (removed.length === 0) {
  console.log('Ingen tomme Shorts fundet.');
  process.exit(0);
}

const lines =
  `\n# Shorts fjernet (tomme sider) -> primært emne, ${new Date().toISOString().split('T')[0]}\n` +
  removed.map((r) => `/video/${r.slug} ${r.target} 301`).join('\n') +
  '\n';

fs.appendFileSync(REDIRECTS, lines);

console.log(`✅ Slettede ${removed.length} tomme Shorts og skrev ${removed.length} redirects til ${REDIRECTS}.`);
