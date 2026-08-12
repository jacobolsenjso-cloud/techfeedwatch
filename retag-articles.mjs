// Flytter kvante- og hardware-artikler ud af AI & Tech-paraplyen.
//
// Baggrund: 283 af 372 artikler bar "AI & Tech", fordi tagget blev lagt oven på
// alt. Et mærke på 76% af sitet bærer ingen information — klikker man på det,
// får man næsten hele arkivet. Kvantecomputere og chips er egne emner, ikke
// undergrupper af AI, og de lå begravet i bunken.
//
// Mønstrene læser KUN titel og resumé. Brødteksten nævner alt muligt i
// forbifarten, og et ord der optræder én gang midt i teksten er ikke artiklens
// emne. Et løst mønster giver et pænt tal og en forkert mærkning.
//
// Brug: node retag-articles.mjs --dry-run     (viser hvad der ville ske)
//       node retag-articles.mjs               (gør det)
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/videos';
const dryRun = process.argv.includes('--dry-run');

const RULES = [
  { tag: 'Quantum Computing', re: /\b(quantum comput\w*|quantum (leap|ai|hardware|advantage|supremacy|mechanics)|qubit|qpu)\b/i },
  { tag: 'Hardware & Chips', re: /\b(GPU|TPU|semiconductor|AI chip|chip (supply|market|deals?)|data cent(er|re)|Nvidia|foundry|PCB|AI infrastructure|VRAM)\b/i },
  // AR og VR skrives med STORE bogstaver. To små bogstaver rammer for let et
  // almindeligt ord, og "ar" findes i mange sammenhænge. De udskrevne udtryk
  // er entydige og matches uden hensyn til versaler.
  { tag: 'AR & VR', re: /\b(AR|VR|XR)\b|augmented reality|virtual reality|mixed reality|smart glasses|spatial comput|VR headset/i },
];

// Enkelte titler rammer et mønster uden at handle om emnet. Dem holder vi ude
// ved navn frem for at gøre mønsteret så snævert at det også taber de rigtige.
//
// De tre AR-undtagelser er artikler hvor emnet er noget andet: to handler om
// fintech og nævner XR eller metaverset i forbifarten, og én er allerede
// mærket Quantum Computing. Den fjerde er et bærbart kamera uden AR i sig.
const EXCLUDE = [
  /AI Billionaires/i,
  // Handler om markedsdynamik og pengepolitik. Rammer hardware-mønsteret på en
  // omtale af datacentre, men emnet er økonomi.
  /AI Investment Boom/i,
  /Fintech Web3 & XR/i,
  /Open APIs & Metaverse/i,
  /AI, Quantum, AR Convergence/i,
  /Looki L1/i,
];

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
let changed = 0, skipped = 0;

for (const file of files) {
  const p = path.join(DIR, file);
  const raw = fs.readFileSync(p, 'utf8');

  const title = raw.match(/^title:\s*"([^"]+)"/m)?.[1] || '';
  const summary = raw.match(/^summary:\s*"([^"]+)"/m)?.[1] || '';
  const head = `${title} ${summary}`;
  if (EXCLUDE.some((re) => re.test(title))) { skipped++; continue; }

  const block = raw.match(/^tags:\r?\n((?:[ \t]*-[ \t]*.*\r?\n)*)/m);
  if (!block) continue;
  const tags = block[1].split(/\r?\n/)
    .map((l) => l.replace(/^\s*-\s*/, '').replace(/^"|"$/g, '').trim())
    .filter(Boolean);

  const match = RULES.find((r) => r.re.test(head));
  if (!match) continue;
  if (tags.includes(match.tag)) continue;

  // Det nye mærke står FORREST og erstatter paraplyen. Øvrige mærker beholdes:
  // en artikel om kvantetruslen mod bitcoin hører stadig også under Crypto.
  const rest = tags.filter((t) => t !== 'AI & Tech' && t !== match.tag);
  const next = [match.tag, ...rest].slice(0, 2);

  const yaml = 'tags:\n' + next.map((t) => `  - "${t}"`).join('\n') + '\n';
  const out = raw.replace(block[0], yaml);

  console.log(`  [${tags.join(', ')}] -> [${next.join(', ')}]  ${title.slice(0, 50)}`);
  if (!dryRun) fs.writeFileSync(p, out, 'utf8');
  changed++;
}

console.log(`\n${dryRun ? 'TØRT LØB — ' : ''}ommærket: ${changed}  ·  undtaget ved navn: ${skipped}`);
