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

// Cloudflare matcher kilden PRÆCIST — /video/abc og /video/abc/ er to forskellige
// adresser. Reglerne var kun skrevet uden afsluttende skråstreg, og Google har
// begge varianter i indekset: 1.228 eksponeringer, 47% af alle sitets, ramte et
// 404 på grund af én skråstreg. Hver statisk regel får derfor en tvilling.
//
// Kun kilder UDEN filendelse dubleres. /noget.xml/ er ikke en rigtig adresse,
// og en regel for den ville bare fylde op i de 2.000 vi har.
const withSlashVariants = (rules) => {
  const out = [];
  for (const r of rules) {
    out.push(r);
    const parts = r.split(/\s+/);
    const from = parts[0];
    const sidsteLed = from.split('/').pop();
    if (from.endsWith('/') || sidsteLed.includes('.')) continue;
    out.push([from + '/', ...parts.slice(1)].join(' '));
  }
  return out;
};

const stat = dedupe(withSlashVariants(staticRules));
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
