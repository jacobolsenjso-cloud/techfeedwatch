// AI-billeder til de gamle artikler i portioner (13/10-2026, Jacob valgte C: alle artikler).
// Tager de NYESTE artikler uden AI-billede først (dem læserne oftest ser) og laver højst
// --antal=N billeder pr. kørsel, så Gemini-loftet (30 USD/md., delt med robotten) holder.
// Målt 13/10: ca. 0,06 USD pr. artikel i snit (4 af 5 første forsøg afvist for tekst).
// Kør: node lav-ai-billeder.mjs --antal=10      (uden --antal: 10)
import 'dotenv/config';
import fs from 'node:fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { lavAiBillede, sitetsStier, harAiBillede } from './src/lib/aibillede.mjs';

const antal = Number((process.argv.find((a) => a.startsWith('--antal=')) || '--antal=10').split('=')[1]) || 10;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const artikler = fs.readdirSync('./src/content/videos').filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(`./src/content/videos/${f}`, 'utf8').replace(/\r/g, '');
  const felt = (k) => (raw.match(new RegExp(`^${k}:\\s*"(.*)"\\s*$`, 'm'))?.[1] || '').replace(/\\"/g, '"');
  return { slug: f.replace(/\.md$/, ''), titel: felt('title'), resume: felt('summary'), dato: felt('date'), emne: raw.match(/^tags:\n\s*-\s*"(.*?)"/m)?.[1] || '' };
}).filter((a) => !harAiBillede(a.slug)).sort((a, b) => b.dato.localeCompare(a.dato));

console.log(`${artikler.length} artikler mangler AI-billede — laver højst ${antal} nu`);
let lavet = 0, reserve = 0, forsoeg = 0, cache = 0, iTraek = 0;
for (const a of artikler.slice(0, antal)) {
  const r = await lavAiBillede(genAI, a, sitetsStier(a.slug), { log: (m) => console.log(`  ${a.slug}: ${m}`) });
  if (r) { lavet++; forsoeg += r.forsoeg; if (r.fraCache) cache++; iTraek = 0; } else { reserve++; iTraek++; }
  // 3 fejl i træk = noget er galt (typisk tom Gemini-kredit, set 9.-10/10): stop i stedet
  // for at hamre løs. De manglende artikler tages i næste kørsel.
  if (iTraek >= 3) { console.log('Stopper: 3 billeder i træk fejlede — tjek Gemini-kreditten (AI Studio -> Billing).'); break; }
}
// Linjen læses af statusarbejdet (pris = forsøg x ca. 0,034 USD). Ændr ikke formatet.
console.log(`AI-BILLEDER: ${JSON.stringify({ lavet, reserve, forsoeg, fraCache: cache, tilbage: artikler.length - lavet })}`);
