import fs from 'fs';
import { generateOgCard } from './og-card.mjs';

// Genskaber alle delekort, så de får det fulde logo. De gamle kort blev tegnet
// med kun trekanten — bjælkerne manglede, så mærket var halvt.
//
// Kør: node regenerate-og-cards.mjs

const DIR = './src/content/videos';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));

const items = files.map((f) => {
  const c = fs.readFileSync(`${DIR}/${f}`, 'utf-8');
  return { slug: f.replace(/\.md$/, ''), id: (c.match(/youtubeId:\s*"(.*?)"/) || [])[1] };
}).filter((x) => x.id);

console.log(`Genskaber ${items.length} delekort...\n`);

let ok = 0, fail = 0;
for (const [i, it] of items.entries()) {
  const r = await generateOgCard(it.id, it.slug);
  if (r) ok++; else { fail++; console.log(`⚠️  ${it.slug}`); }
  if ((i + 1) % 25 === 0) console.log(`   ${i + 1}/${items.length}`);
}

console.log(`\n✅ ${ok} genskabt, ${fail} fejlede.`);
