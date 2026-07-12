import fs from 'fs';

const VIDEOS_DIR = './src/content/videos';

// Kør på én fil: node backfill-strip-shorts.mjs VIDEOID
const onlyId = process.argv[2] || null;

function backfill() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Fejl: ${VIDEOS_DIR} findes ikke.`);
    process.exit(1);
  }

  let files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  if (onlyId) files = files.filter(f => f === `${onlyId}.md`);

  let stripped = 0, skipped = 0, alreadyEmpty = 0;

  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');

    const isShort = /isShort:\s*true/.test(content);
    if (!isShort) { skipped++; continue; } // Rør kun Shorts

    // Frontmatter er alt mellem den første "---" og den næste "---".
    // Vi beholder frontmatteren og fjerner brødteksten (artikel + evt. FAQ-rester i body).
    const fmEndIndex = content.indexOf('\n---', 4);
    if (fmEndIndex === -1) {
      console.log(`Sprang over ${file}: kunne ikke finde frontmatter-slut.`);
      skipped++;
      continue;
    }

    // Behold frontmatter (til og med den afsluttende ---), fjern alt brødtekst efter.
    const frontmatter = content.slice(0, fmEndIndex + 4); // inkluderer "\n---"
    const newContent = frontmatter + "\n";

    if (content.trim() === newContent.trim()) {
      alreadyEmpty++;
      continue; // Allerede tom body, intet at gøre
    }

    fs.writeFileSync(path, newContent);
    console.log(`Ryddet artikel fra Short: ${file}`);
    stripped++;
  }

  console.log(`\nFaerdig. ${stripped} Shorts ryddet, ${alreadyEmpty} allerede tomme, ${skipped} sprunget over (normale videoer).`);
}

backfill();
