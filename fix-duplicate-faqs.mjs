import fs from 'fs';

const VIDEOS_DIR = './src/content/videos';

// Matcher en komplet faqs-blok: "faqs:" efterfulgt af én eller flere
// "  - question: ..." / "    answer: ..." linjepar (begge altid enkeltlinje-strenge).
const FAQ_BLOCK_REGEX = /^faqs:\n(?:  - question:.*\n    answer:.*\n)+/gm;

// Fjerner alle faqs-blokke undtagen den sidste (den nygenererede). Returnerer null hvis der
// er 0 eller 1 blok (intet at rette).
function removeDuplicateFaqBlocks(frontmatter) {
  const matches = [...frontmatter.matchAll(FAQ_BLOCK_REGEX)];
  if (matches.length <= 1) return null;

  const lastIndex = matches.length - 1;
  let result = '';
  let cursor = 0;

  matches.forEach((m, i) => {
    const start = m.index;
    const end = start + m[0].length;
    result += frontmatter.slice(cursor, start);
    if (i === lastIndex) {
      result += m[0]; // Behold kun den sidste faqs-blok
    }
    cursor = end;
  });
  result += frontmatter.slice(cursor);
  return result;
}

function fix() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Fejl: ${VIDEOS_DIR} findes ikke.`);
    process.exit(1);
  }

  const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  let fixed = 0, skipped = 0;

  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');

    if (!content.startsWith('---\n')) { skipped++; continue; }
    const fmEnd = content.indexOf('\n---', 4);
    if (fmEnd === -1) { skipped++; continue; }

    // Frontmatter er alt mellem første "---\n" og næste "\n---" (brødteksten rører vi ikke).
    const frontmatter = content.slice(4, fmEnd);
    const rest = content.slice(fmEnd); // fra og med "\n---" og resten af filen

    const fixedFrontmatter = removeDuplicateFaqBlocks(frontmatter);
    if (fixedFrontmatter === null) continue; // 0 eller 1 faqs-blok, intet at rette

    const newContent = `---\n${fixedFrontmatter}${rest}`;
    fs.writeFileSync(path, newContent);
    console.log(`Rettet dubleret faqs: ${file}`);
    fixed++;
  }

  console.log(`\nFaerdig. ${fixed} filer rettet, ${skipped} sprunget over (uventet format).`);
}

fix();
