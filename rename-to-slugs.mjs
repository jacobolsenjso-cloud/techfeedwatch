import fs from 'fs';

const VIDEOS_DIR = './src/content/videos';

// --dry: viser kun hvad der VILLE ske, uden at røre filsystemet.
// Kør på én video (matcher youtubeId, ikke det gamle filnavn): node rename-to-slugs.mjs VIDEOID [--dry]
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const onlyId = args.find(a => a !== '--dry') || null;

// --- slugify() er identisk med add-video.mjs, kopieret 1:1 så resultatet er garanteret det samme
// --- som for nye videoer. Opdatér begge steder samtidig hvis logikken ændres.

// Laver en URL-venlig slug ud fra en titel: lowercase, uden accenter/specialtegn, bindestreg-separeret.
const SLUG_MAX_LENGTH = 70;

function slugify(title) {
  const raw = title
    // æ/ø/œ/ß har ingen NFKD-dekomposition (i modsætning til fx é/å), så de translittereres eksplicit her
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .replace(/ø/gi, 'o')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // fjerner resterende accenter (é -> e, å -> a, osv.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (raw.length <= SLUG_MAX_LENGTH) return raw;

  // Klip ved sidste hele bindestreg-adskilte del inden for grænsen, så vi aldrig skærer midt i et ord.
  // Findes ingen bindestreg inden for grænsen (ét langt ord), falder vi tilbage til det hårde snit.
  const hardCut = raw.slice(0, SLUG_MAX_LENGTH);
  const lastHyphen = hardCut.lastIndexOf('-');
  const wholeWordCut = lastHyphen > 0 ? hardCut.slice(0, lastHyphen) : '';

  return (wholeWordCut || hardCut).replace(/-+$/g, '');
}

// Gør en slug unik hvis den allerede er reserveret af en ANDEN video. I modsætning til add-video.mjs's
// fs-baserede resolveUniqueSlug() (som kun nogensinde håndterer én ny fil ad gangen) bruger denne
// version et in-memory kort over slugs der allerede er "brugt" i DENNE kørsel, så resultatet bliver
// identisk uanset om vi rent faktisk omdøber (normal kørsel) eller kun simulerer det (--dry).
// reservedSlugs: Map<slug, youtubeId> - opdateres som et sideeffekt her, når en slug endeligt vælges.
function resolveUniqueSlug(baseSlug, videoId, reservedSlugs) {
  let candidate = baseSlug;
  if (!reservedSlugs.has(candidate) || reservedSlugs.get(candidate) === videoId) {
    reservedSlugs.set(candidate, videoId);
    return candidate;
  }

  // Kollision med en anden video: tilføj et kort, deterministisk suffiks fra videoId'et
  const suffix = videoId.slice(0, 6).toLowerCase();
  candidate = `${baseSlug}-${suffix}`;

  let attempt = 1;
  while (reservedSlugs.has(candidate) && reservedSlugs.get(candidate) !== videoId) {
    attempt++;
    candidate = `${baseSlug}-${suffix}-${attempt}`;
  }

  reservedSlugs.set(candidate, videoId);
  return candidate;
}

function rename() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Fejl: ${VIDEOS_DIR} findes ikke.`);
    process.exit(1);
  }

  const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  const reservedSlugs = new Map();

  let renamed = 0, skippedAlreadyCorrect = 0, skippedMissingData = 0;

  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');

    const titleMatch = content.match(/title:\s*"(.*?)"/);
    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);

    if (!titleMatch || !idMatch) {
      console.log(`Sprang over ${file}: mangler title eller youtubeId i frontmatter.`);
      skippedMissingData++;
      continue;
    }

    const title = titleMatch[1];
    const youtubeId = idMatch[1];

    const baseSlug = slugify(title) || youtubeId.toLowerCase();

    // Reserveres for ALLE filer, uanset --onlyId - ellers ville en video der filtreres fra ikke
    // tælle med i kollisions-tjekket for den video vi rent faktisk behandler.
    const slug = resolveUniqueSlug(baseSlug, youtubeId, reservedSlugs);

    if (onlyId && youtubeId !== onlyId) continue;

    const newFile = `${slug}.md`;

    if (newFile === file) {
      skippedAlreadyCorrect++;
      continue;
    }

    const newPath = `${VIDEOS_DIR}/${newFile}`;
    if (isDryRun) {
      console.log(`[DRY RUN] ${file} -> ${newFile}`);
    } else {
      fs.renameSync(path, newPath);
      console.log(`${file} -> ${newFile}`);
    }
    renamed++;
  }

  const renamedLabel = isDryRun ? 'ville blive omdøbt' : 'omdøbt';
  if (isDryRun) console.log('\n[DRY RUN] Intet er rørt på disk.');
  console.log(`Faerdig. ${renamed} filer ${renamedLabel}, ${skippedAlreadyCorrect} allerede korrekte, ${skippedMissingData} sprunget over (manglende data).`);
}

rename();
