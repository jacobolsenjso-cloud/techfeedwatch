// Sætter `updated:` på artikler hvis INDHOLD faktisk er ændret siden sidste commit.
//
// Hvorfor et script og ikke bare en dato ved hvert gem: update-view-counts.mjs
// rører alle 367 filer hver tredje dag. Hvis det bumpede opdateringsdatoen,
// ville hele arkivet påstå at være opdateret uden at et ord var ændret — samme
// slags falske signal som de opdigtede like-tal, bare sværere at få øje på.
//
// Derfor sammenligner scriptet med den seneste commit og ser BORT fra de felter
// der ændrer sig af sig selv (viewCount, viewsUpdated og updated selv). Er der
// intet tilbage at se forskel på, er artiklen ikke opdateret.
//
// Brug: node stamp-updated.mjs            (sætter datoen)
//       node stamp-updated.mjs --dry-run  (viser hvad der ville ske)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DIR = 'src/content/videos';
const dryRun = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);

// Felter der ændrer sig uden at indholdet gør. Fjernes før sammenligningen.
const VOLATILE = /^(viewCount|viewsUpdated|updated):.*$/gm;
const normalise = (text) => text.replace(VOLATILE, '').replace(/\r\n/g, '\n').trim();

// Filer der er ændret siden sidste commit — både med og uden git add.
let changed = [];
try {
  changed = execSync('git diff HEAD --name-only -- src/content/videos', { encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter((l) => l.endsWith('.md'));
} catch (e) {
  console.error('Kunne ikke læse git-status:', e.message);
  process.exit(1);
}

if (changed.length === 0) {
  console.log('Ingen ændrede artikler. Intet at gøre.');
  process.exit(0);
}

let stamped = 0, skipped = 0, isNew = 0;

for (const rel of changed) {
  const file = path.basename(rel);
  const full = path.join(DIR, file);
  if (!fs.existsSync(full)) continue; // slettet — prune tager sig af den

  let previous;
  try {
    previous = execSync(`git show HEAD:${rel}`, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  } catch {
    isNew++;   // ny artikel: `date` dækker allerede, ingen opdateringsdato
    continue;
  }

  const current = fs.readFileSync(full, 'utf8');
  if (normalise(previous) === normalise(current)) { skipped++; continue; }

  if (dryRun) {
    console.log(`  ville sætte updated: ${file}`);
    stamped++;
    continue;
  }

  // Opdatér linjen hvis den er der, ellers indsæt lige efter date:
  let out;
  if (/^updated:\s*"[^"]*"\s*$/m.test(current)) {
    out = current.replace(/^updated:\s*"[^"]*"\s*$/m, `updated: "${today}"`);
  } else {
    out = current.replace(/^(date:\s*"[^"]*"\s*)$/m, `$1\nupdated: "${today}"`);
    if (out === current) { console.error(`  fandt ingen date-linje i ${file} — sprunget over`); continue; }
  }
  fs.writeFileSync(full, out, 'utf8');
  console.log(`  updated: ${file}`);
  stamped++;
}

console.log(
  `\n${dryRun ? 'TØRT LØB — ' : ''}` +
  `stemplet: ${stamped}  ·  uændret indhold: ${skipped}  ·  nye artikler (ikke stemplet): ${isNew}`
);
