// Giver gamle artikler de 5 nye emner (17/10-2026, Jacob: "kod det sådan"). Ingen AI - kun regler.
//
// Samme princip som retag-articles.mjs (kvante/hardware/AR): mønstrene læser KUN titel og
// resumé. Brødteksten nævner alt i forbifarten; et ord midt i teksten er ikke artiklens emne.
//
// Det nye mærke sættes FORREST. "AI & Tech" (paraplyen, 273 artikler) fjernes, når et mere
// præcist emne findes. Øvrige mærker beholdes. Højst 3 mærker.
//
// Brug: node retag-nye-emner.mjs --dry-run   (viser HELE sættet, skriver intet)
//       node retag-nye-emner.mjs             (gør det)
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/videos';
const dryRun = process.argv.includes('--dry-run');

export const RULES = [
  { tag: 'AI Agents', re: /\b(AI agents?|agentic|autonomous agents?|multi-agent|agent frameworks?|coding agents?|computer[- ]use agents?|AI assistants? that (act|take))\b/i },
  { tag: 'Investing & Trading', re: /\b(stock market|stocks|investing|investors? (should|can)|day trad\w*|trading (bots?|strateg\w*|platforms?|apps?|signals?)|traders?|ETFs?|index funds?|dividends?|brokerages?|portfolios?|how to invest)\b/i },
  { tag: 'Smartphones & Gadgets', re: /\b(smartphones?|iPhones?|Pixel \d+|Galaxy S\d+|Android phones?|smartwatch\w*|Apple Watch|wearables?|earbuds|AirPods|iPads?|tablets?|gadgets?)\b/i },
  { tag: 'Robotics', re: /\b(robots?|robotics|humanoids?|Optimus|Boston Dynamics|physical AI)\b/i },
  { tag: 'PC Building & Gaming', re: /\b(gaming PCs?|PC build\w*|build(ing)? a PC|gaming laptops?|graphics cards?|RTX \d{4}|Radeon|PC gaming|gaming performance)\b/i },
];

// Titler der rammer et mønster uden at handle om emnet - gennemset ét for ét 17/10 (tørt løb: 89 fund).
// Pr. emne: en artikel kan godt passe til ét nyt emne, men ikke et andet.
export const EXCLUDE = {
  'Investing & Trading': [/Azure Certification/i, /AI Website Builders/i, /DCG Gemini Debt/i, /Why Is SEO Important/i],
  'AI Agents': [/TDD AI/i, /Fed Policy/i, /AI Pentesting Tools/i, /NotebookLM Automates/i, /Open-Source AI Tools Empower/i,
    /Hugging Face Pipeline Hack/i, /Hybrid Quantum Systems/i, /Architectural Thinking/i, /Android XR AI Enter the iPhone/i],
  'Smartphones & Gadgets': [/What Is AR, How It Works/i, /Examples of AR in Daily Life/i, /Does Augmented Reality Exist/i,
    /Text to Video in iMovie/i, /AI Chips Different From Just GPUs/i, /VR Headsets: Difference/i, /Virtual Reality Goggles Replace/i],
  'Robotics': [/Hard Tech Companies/i, /Physical AI Infrastructure/i, /Shut Down Its App/i, /Virtual Reality Headsets Mechanics/i],
};

export function nyeMaerker(tags, head, title = '') {
  const fund = RULES.filter((r) => r.re.test(head) && !(EXCLUDE[r.tag] || []).some((re) => re.test(title))).map((r) => r.tag).filter((t) => !tags.includes(t));
  if (!fund.length) return null;
  const rest = tags.filter((t) => t !== 'AI & Tech' && !fund.includes(t));
  return [...fund, ...rest].slice(0, 3);
}

if (process.argv[1] && process.argv[1].endsWith('retag-nye-emner.mjs')) {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
  const pr = {}; let changed = 0;
  for (const file of files) {
    const p = path.join(DIR, file);
    const raw = fs.readFileSync(p, 'utf8');
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    const title = raw.match(/^title:\s*"([^"]+)"/m)?.[1] || '';
    const summary = raw.match(/^summary:\s*"([^"]+)"/m)?.[1] || '';
    const block = raw.match(/^tags:\r?\n((?:[ \t]*-[ \t]*.*\r?\n)*)/m);
    if (!block) continue;
    const tags = block[1].split(/\r?\n/).map((l) => l.replace(/^\s*-\s*/, '').replace(/^"|"$/g, '').trim()).filter(Boolean);
    const next = nyeMaerker(tags, `${title} ${summary}`, title);
    if (!next) continue;
    for (const t of next.filter((x) => !tags.includes(x))) (pr[t] ||= []).push(`[${tags.join(', ')}] -> [${next.join(', ')}]  ${title}`);
    const yaml = 'tags:' + nl + next.map((t) => `  - "${t}"`).join(nl) + nl;
    if (!dryRun) fs.writeFileSync(p, raw.replace(block[0], () => yaml), 'utf8');
    changed++;
  }
  const ud = [];
  for (const [t, linjer] of Object.entries(pr)) { ud.push(`\n=== ${t}: ${linjer.length} ===`); linjer.forEach((l) => ud.push('  ' + l)); }
  ud.push(`\n${dryRun ? 'TØRT LØB — ' : ''}ommærket: ${changed} artikler`);
  fs.writeFileSync('_retag-saet.txt', ud.join('\n') + '\n', 'utf8');
  console.log(ud.join('\n'));
}
