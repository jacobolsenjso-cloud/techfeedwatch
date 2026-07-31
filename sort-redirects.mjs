import fs from 'fs';

// Cloudflare Pages kræver at statiske redirects står FØR dynamiske (dem med *).
// https://developers.cloudflare.com/pages/configuration/redirects/
//
// Vores fil havde tre splat-regler (/tag/.../page/*) midt i filen, og alt efter
// dem blev ignoreret — 205 Shorts-redirects og /shorts fyrede aldrig, mens de
// tidligere regler virkede fint. Det her script sorterer filen korrekt og kan
// køres igen hver gang der er tilføjet regler.
//
// Kør: node sort-redirects.mjs

const FILE = 'public/_redirects';
const lines = fs.readFileSync(FILE, 'utf-8').split(/\r?\n/);

const staticRules = [];
const dynamicRules = [];

for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;          // kommentarer skrives på ny
  const parts = t.split(/\s+/);
  if (parts.length < 2) continue;
  (parts[0].includes('*') || parts[0].includes(':') ? dynamicRules : staticRules).push(t);
}

// Fjern dubletter på kilde — den første vinder, som Cloudflare selv gør
const seen = new Set();
const dedupe = (arr) => arr.filter((r) => {
  const from = r.split(/\s+/)[0];
  if (seen.has(from)) return false;
  seen.add(from);
  return true;
});

const stat = dedupe(staticRules);
const dyn = dedupe(dynamicRules);

const out = [
  '# Cloudflare Pages kræver statiske regler FØR dynamiske (*).',
  '# Filen sorteres af sort-redirects.mjs — tilføj gerne nye regler i bunden',
  '# og kør scriptet igen, så havner de det rigtige sted.',
  '',
  `# --- Statiske (${stat.length}) ---`,
  ...stat,
  '',
  `# --- Dynamiske (${dyn.length}) ---`,
  ...dyn,
  '',
].join('\n');

fs.writeFileSync(FILE, out);
console.log(`✅ Sorteret: ${stat.length} statiske + ${dyn.length} dynamiske = ${stat.length + dyn.length} regler.`);
console.log(`   Grænser: 2.000 statiske / 100 dynamiske — ${stat.length > 2000 || dyn.length > 100 ? '⚠️ OVERSKREDET' : 'OK'}`);
