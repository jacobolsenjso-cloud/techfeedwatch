import fs from 'fs';

// public/og rummer ét delekort pr. artikel. Da de 205 tomme Shorts blev
// slettet, blev deres kort liggende. De bliver aldrig vist og fylder blot i
// hver eneste deploy.
//
// Kør: node clean-og-cards.mjs [--dry]

const DRY = process.argv.includes('--dry');
const slugs = new Set(
  fs.readdirSync('src/content/videos').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
);

const cards = fs.readdirSync('public/og').filter((f) => f.endsWith('.jpg'));
const orphans = cards.filter((f) => !slugs.has(f.replace(/\.jpg$/, '')));

let bytes = 0;
for (const f of orphans) {
  bytes += fs.statSync(`public/og/${f}`).size;
  if (!DRY) fs.unlinkSync(`public/og/${f}`);
}

console.log(`Artikler          : ${slugs.size}`);
console.log(`Delekort før      : ${cards.length}`);
console.log(`Forældreløse      : ${orphans.length}  (${Math.round(bytes / 1024 / 1024 * 10) / 10} MB)`);
console.log(`${DRY ? '(tørkørsel) ' : ''}Tilbage           : ${cards.length - orphans.length}`);

const missing = [...slugs].filter((s) => !cards.includes(`${s}.jpg`));
if (missing.length) {
  console.log(`\n⚠️  ${missing.length} artikler mangler et delekort:`);
  missing.slice(0, 10).forEach((s) => console.log('   ' + s));
}
