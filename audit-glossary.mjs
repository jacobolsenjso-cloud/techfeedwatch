// Finder huller i glossaret. Skriver ingenting — den fortæller hvad der mangler.
//
// Hvorfor et script: opslaget "Large Language Model" fandtes, mens 33 artikler
// skrev "LLM" og linkede ingen steder. Ingen opdagede det i månedsvis, fordi
// intet ledte efter det. At skrive opslagene er stadig et menneskes arbejde —
// automatiske definitioner er præcis det tynde indhold sitet undgår. Men at
// opdage hullerne skal ikke afhænge af at nogen tilfældigt får øje på dem.
//
// Kør: node audit-glossary.mjs        (kræver IKKE et build)
import fs from 'node:fs';
import path from 'node:path';

const VIDEOS = 'src/content/videos';
const GLOSSARY = 'src/content/glossary';
const MIN_ARTICLES = 5;   // under dette er et opslag ikke besværet værd

// Kandidatordbog. Udvid den når du støder på et begreb der bør forklares —
// listen er med vilje håndholdt, så hvert ord er noget vi kan stå inde for
// som et begreb, ikke bare et hyppigt ord.
const CANDIDATES = [
  'AI agent', 'agentic', 'LLM', 'RAG', 'fine-tuning', 'prompt engineering', 'context window',
  'hallucination', 'inference', 'training data', 'transformer', 'neural network', 'GPU', 'TPU',
  'multimodal', 'benchmark', 'open weights', 'MCP', 'guardrails', 'alignment', 'AGI',
  'quantum computing', 'qubit', 'edge computing', 'serverless', 'Kubernetes', 'CI/CD', 'API',
  'zero trust', 'ransomware', 'phishing', 'penetration testing', 'two-factor authentication',
  'end-to-end encryption', 'VPN', 'firewall', 'data breach', 'supply chain attack', 'malware',
  'smart contract', 'gas fee', 'layer 2', 'staking', 'liquidity pool', 'DAO', 'cold wallet',
  'proof of stake', 'proof of work', 'tokenization', 'stablecoin', 'market cap', 'DeFi',
  'open banking', 'KYC', 'payment rail', 'BNPL', 'embedded finance', 'core banking', 'PSD2',
  'index fund', 'ETF', 'compound interest', 'dollar cost averaging', 'ROI', 'bear market',
  'core web vitals', 'canonical URL', 'schema markup', 'crawl budget', 'anchor text',
  'generative engine optimization', 'search intent', 'long tail keyword', 'meta description',
  'conversion rate', 'churn', 'MRR', 'product market fit', 'A/B testing', 'webhook', 'SaaS',
];

// Alle skrivemåder der allerede peger på et opslag: term + aliases.
const entries = [];
for (const f of fs.readdirSync(GLOSSARY).filter((f) => f.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(GLOSSARY, f), 'utf8');
  const term = (raw.match(/term:\s*"(.*?)"/) || [])[1];
  const slug = (raw.match(/slug:\s*"(.*?)"/) || [])[1];
  if (!term || !slug) { console.error(`⚠️  ${f} mangler term eller slug`); continue; }
  const aliasRaw = (raw.match(/aliases:\s*\[(.*?)\]/) || [])[1] || '';
  const aliases = aliasRaw.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  entries.push({ slug, term, aliases, spellings: [term, ...aliases] });
}

const covered = new Set(entries.flatMap((e) => e.spellings.map((s) => s.toLowerCase())));

// Artikelteksterne. Interne links pilles ud: linkteksten er andre artiklers
// titler og ville tælle med som om ordet stod i brødteksten.
const files = fs.readdirSync(VIDEOS).filter((f) => f.endsWith('.md'));
const texts = files.map((f) =>
  fs.readFileSync(path.join(VIDEOS, f), 'utf8')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const countArticles = (word) => {
  const re = new RegExp(`\\b${escape(word)}\\b`, 'i');
  return texts.filter((t) => re.test(t)).length;
};
// Forkortelser skal matches med STORE bogstaver. Uden det matchede den gættede
// forkortelse "AT" (for Algorithmic Trading) det engelske ord "at" i 233
// artikler og blev foreslået som et manglende alias.
const countExact = (word) => {
  const re = new RegExp(`\\b${escape(word)}\\b`);
  return texts.filter((t) => re.test(t)).length;
};

console.log(`${entries.length} opslag · ${covered.size} skrivemåder · ${files.length} artikler\n`);

// 1. Begreber artiklerne bruger, som intet opslag dækker
const missing = CANDIDATES
  .filter((c) => !covered.has(c.toLowerCase()))
  .map((c) => ({ term: c, count: countArticles(c) }))
  .filter((r) => r.count >= MIN_ARTICLES)
  .sort((a, b) => b.count - a.count);

console.log(`== 1. MANGLER OPSLAG (mindst ${MIN_ARTICLES} artikler) ==`);
if (!missing.length) console.log('   ingen — alle kendte begreber er dækket');
for (const r of missing) console.log(`   ${String(r.count).padStart(4)} artikler   ${r.term}`);

// 2. Opslag hvor en anden skrivemåde bruges mere end selve termen.
//    Det var præcis LLM-fejlen: opslaget fandtes, ordet på siden passede ikke.
console.log('\n== 2. MANGLER MÅSKE ET ALIAS ==');
const aliasGaps = [];
for (const e of entries) {
  const termCount = countArticles(e.term);
  const plural = e.term.endsWith('s') ? null : e.term + 's';
  // Kun forkortelser på 3+ bogstaver: to bogstaver rammer for let et almindeligt ord.
  const initials = e.term.split(' ').map((w) => w[0]).join('').toUpperCase();
  const short = e.term.split(' ').length > 2 && initials.length >= 3 ? initials : null;
  for (const guess of [plural, short].filter(Boolean)) {
    if (covered.has(guess.toLowerCase())) continue;
    // Flertal må matches uden hensyn til store bogstaver; forkortelser må ikke.
    const c = guess === short ? countExact(guess) : countArticles(guess);
    if (c >= MIN_ARTICLES && c > termCount / 2) aliasGaps.push({ slug: e.slug, guess, c, termCount });
  }
}
if (!aliasGaps.length) console.log('   ingen åbenlyse');
for (const g of aliasGaps.sort((a, b) => b.c - a.c)) {
  console.log(`   "${g.guess}" i ${g.c} artikler, men ${g.slug} matcher kun ${g.termCount}`);
}

// 3. Opslag ingen artikel nævner. En side uden indgange er en side Google
//    ikke har grund til at hente — og en læser aldrig falder over.
console.log('\n== 3. OPSLAG UDEN INDGANGE ==');
const orphans = entries
  .map((e) => ({ slug: e.slug, count: Math.max(...e.spellings.map(countArticles)) }))
  .filter((r) => r.count === 0);
if (!orphans.length) console.log('   ingen — hvert opslag nævnes i mindst én artikel');
for (const o of orphans) console.log(`   ${o.slug} — nævnes i 0 artikler`);

console.log(
  `\n=== ${missing.length} opslag at skrive · ${aliasGaps.length} aliaser at tilføje · ${orphans.length} uden indgange`
);
console.log('Aliaser er den billige rettelse: én linje i frontmatter, ingen ny side.');
