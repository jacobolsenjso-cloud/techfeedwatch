import fs from 'fs';

const VIDEOS_DIR = './src/content/videos';

// Finder start/slut (linje-index, slut eksklusiv) for hver "faqs:"-blok i frontmatterens linjer.
// En blok er linjen "faqs:" plus alle efterfølgende linjer der starter med to mellemrum.
function findFaqBlocks(lines) {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^faqs:$/.test(lines[i])) {
      let end = i + 1;
      while (end < lines.length && lines[end].startsWith('  ')) {
        end++;
      }
      blocks.push({ start: i, end });
    }
  }
  return blocks;
}

// Fjerner alle faqs-blokke undtagen den sidste. Returnerer null hvis der er under 2 blokke
// (intet at rette). Ellers de rensede linjer + hvor mange blokke der blev fjernet.
function removeDuplicateFaqBlocks(lines) {
  const blocks = findFaqBlocks(lines);
  if (blocks.length < 2) return null;

  const blocksToRemove = blocks.slice(0, -1); // alle undtagen den sidste (nygenererede)

  const newLines = [];
  let i = 0;
  while (i < lines.length) {
    const block = blocksToRemove.find(b => b.start === i);
    if (block) {
      i = block.end; // spring hele blokken over
      continue;
    }
    newLines.push(lines[i]);
    i++;
  }

  return { newLines, removedCount: blocksToRemove.length };
}

function fix() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Fejl: ${VIDEOS_DIR} findes ikke.`);
    process.exit(1);
  }

  const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  let fixedFiles = 0, blocksRemovedTotal = 0, skipped = 0;

  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const raw = fs.readFileSync(path, 'utf-8');

    // Filerne kan ligge som CRLF på disk (Windows-checkout). Normaliser til LF for
    // parsingen, og konverter tilbage til CRLF ved skrivning hvis filen brugte det.
    const usesCRLF = raw.includes('\r\n');
    const content = usesCRLF ? raw.replace(/\r\n/g, '\n') : raw;

    if (!content.startsWith('---\n')) { skipped++; continue; }
    const fmEnd = content.indexOf('\n---', 4);
    if (fmEnd === -1) { skipped++; continue; }

    // Frontmatter er alt mellem første "---\n" og næste "\n---". Brødteksten (rest) rører vi ikke.
    const frontmatterText = content.slice(4, fmEnd);
    const rest = content.slice(fmEnd); // fra og med "\n---" og resten af filen

    const lines = frontmatterText.split('\n');
    const result = removeDuplicateFaqBlocks(lines);
    if (result === null) continue; // 0 eller 1 faqs-blok, intet at rette

    const newFrontmatterText = result.newLines.join('\n');
    let newContent = `---\n${newFrontmatterText}${rest}`;
    if (usesCRLF) newContent = newContent.replace(/\n/g, '\r\n');

    fs.writeFileSync(path, newContent);
    console.log(`Rettet ${file}: fjernede ${result.removedCount} dublet(te) faqs-blok(ke).`);
    fixedFiles++;
    blocksRemovedTotal += result.removedCount;
  }

  console.log(`\nFaerdig. ${fixedFiles} filer rettet (${blocksRemovedTotal} dublet-blokke fjernet i alt), ${skipped} sprunget over (uventet format).`);
}

fix();
