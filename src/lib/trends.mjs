// Eneste sandhed om hvad trend-siden tæller. Både siden (/trends) og
// audit-trends.mjs importerer herfra, så tallene ikke kan komme ud af sync.
//
// Reglen, som også står åbent på siden:
//  - Enheden er ARTIKLEN, ikke omtalen. Nævnes et navn ti gange i én artikel
//    tæller det som én. Ellers belønner tallet ordrighed.
//  - Med tæller: titel, resumé, brødtekst, FAQ.
//  - Uden tæller: linktekst til andre artikler (det er andre artiklers titler
//    og forurener tællingen), kodeblokke, tags og kanalnavn.
//  - Navnene står i en fast liste herunder. Ikke automatisk navnegenkendelse —
//    den kan ikke forklares i en boks på siden.

export const GROUPS = [
  { id: 'companies', label: 'Companies & platforms' },
  { id: 'models', label: 'AI models & tools' },
  { id: 'crypto', label: 'Crypto & Web3' },
];

// name = sådan vises det. match = de skrivemåder der tæller med.
// Kun navne der faktisk optræder i artiklerne — listen er bygget efter en
// scanning af alle 367, ikke efter hvad vi gik og troede stod der.
export const TERMS = [
  { name: 'Google', group: 'companies', match: ['Google'] },
  { name: 'OpenAI', group: 'companies', match: ['OpenAI'] },
  { name: 'Anthropic', group: 'companies', match: ['Anthropic'] },
  { name: 'Meta', group: 'companies', match: ['Meta'] },
  { name: 'Microsoft', group: 'companies', match: ['Microsoft'] },
  { name: 'Apple', group: 'companies', match: ['Apple'] },
  { name: 'Amazon', group: 'companies', match: ['Amazon'] },
  { name: 'Nvidia', group: 'companies', match: ['Nvidia', 'NVIDIA'] },
  { name: 'IBM', group: 'companies', match: ['IBM'] },
  { name: 'AWS', group: 'companies', match: ['AWS', 'Amazon Web Services'] },
  { name: 'GitHub', group: 'companies', match: ['GitHub'] },
  { name: 'YouTube', group: 'companies', match: ['YouTube'] },
  { name: 'DeepMind', group: 'companies', match: ['DeepMind'] },
  { name: 'Tesla', group: 'companies', match: ['Tesla'] },
  { name: 'Stripe', group: 'companies', match: ['Stripe'] },
  { name: 'Coinbase', group: 'companies', match: ['Coinbase'] },
  { name: 'Shopify', group: 'companies', match: ['Shopify'] },
  { name: 'WordPress', group: 'companies', match: ['WordPress'] },
  { name: 'Notion', group: 'companies', match: ['Notion'] },
  { name: 'Robinhood', group: 'companies', match: ['Robinhood'] },
  { name: 'Perplexity', group: 'companies', match: ['Perplexity'] },
  { name: 'Alibaba', group: 'companies', match: ['Alibaba'] },

  { name: 'Gemini', group: 'models', match: ['Gemini'] },
  { name: 'ChatGPT', group: 'models', match: ['ChatGPT'] },
  { name: 'GPT', group: 'models', match: ['GPT-3', 'GPT-4', 'GPT-5', 'GPT-6', 'GPT'] },
  { name: 'Claude', group: 'models', match: ['Claude'] },
  { name: 'Claude Code', group: 'models', match: ['Claude Code'] },
  { name: 'Llama', group: 'models', match: ['Llama'] },
  { name: 'GitHub Copilot', group: 'models', match: ['GitHub Copilot', 'Copilot'] },
  { name: 'NotebookLM', group: 'models', match: ['NotebookLM', 'Notebook LM'] },
  { name: 'DeepSeek', group: 'models', match: ['DeepSeek'] },
  { name: 'Grok', group: 'models', match: ['Grok'] },
  { name: 'Midjourney', group: 'models', match: ['Midjourney'] },
  { name: 'Sora', group: 'models', match: ['Sora'] },
  { name: 'Veo', group: 'models', match: ['Veo'] },
  { name: 'Runway', group: 'models', match: ['Runway'] },
  { name: 'Cursor', group: 'models', match: ['Cursor'] },
  { name: 'n8n', group: 'models', match: ['n8n'] },
  { name: 'Obsidian', group: 'models', match: ['Obsidian'] },

  { name: 'Bitcoin', group: 'crypto', match: ['Bitcoin', 'BTC'] },
  { name: 'Ethereum', group: 'crypto', match: ['Ethereum', 'ETH'] },
  { name: 'Solana', group: 'crypto', match: ['Solana'] },
  { name: 'Cardano', group: 'crypto', match: ['Cardano'] },
  { name: 'Algorand', group: 'crypto', match: ['Algorand'] },
  { name: 'Kaspa', group: 'crypto', match: ['Kaspa'] },
  { name: 'DeFi', group: 'crypto', match: ['DeFi'] },
  { name: 'Web3', group: 'crypto', match: ['Web3', 'Web 3.0'] },
  { name: 'NFT', group: 'crypto', match: ['NFT', 'NFTs'] },
  { name: 'Stablecoins', group: 'crypto', match: ['Stablecoin', 'Stablecoins'] },
  { name: 'Smart contracts', group: 'crypto', match: ['Smart contract', 'Smart contracts'] },
  { name: 'Solidity', group: 'crypto', match: ['Solidity'] },
];

// Regex pr. navn, bygget én gang. \b sikrer at "GPT" ikke rammer inde i
// "ChatGPT", og at "Meta" ikke rammer "metadata" eller "metaverse".
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = TERMS.map((t) => ({
  ...t,
  re: new RegExp(`(?:${t.match.map(escape).join('|')})`.replace(/^/, '\\b') + '\\b', 'i'),
}));

// Renser én artikels tekst efter reglen ovenfor.
// links: [tekst](url) fjernes HELT — linkteksten er andre artiklers titler.
export function cleanText({ title = '', summary = '', faqs = [], body = '' }) {
  // faqs kan være enten den strukturerede liste (fra Astro) eller den rå
  // YAML-blok (fra audit-scriptet). Begge veje skal give samme tekst med.
  const faqText = typeof faqs === 'string'
    ? faqs
    : (faqs || []).map((f) => `${f?.question || ''} ${f?.answer || ''}`).join(' ');
  const cleanedBody = String(body)
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')   // interne og eksterne links ud
    .replace(/```[\s\S]*?```/g, ' ')        // kodeblokke ud
    .replace(/`[^`]*`/g, ' ');              // kode inline ud
  return [title, summary, faqText, cleanedBody].join('\n');
}

/**
 * Tæller hvor mange ARTIKLER der nævner hvert navn.
 * @param {Array<{title?:string, summary?:string, faqs?:Array, body?:string}>} articles
 * @returns {{total:number, results:Array<{name:string, group:string, count:number, share:number}>}}
 */
export function tally(articles) {
  const counts = new Map(PATTERNS.map((p) => [p.name, 0]));
  for (const a of articles) {
    const text = cleanText(a);
    for (const p of PATTERNS) {
      if (p.re.test(text)) counts.set(p.name, counts.get(p.name) + 1);
    }
  }
  const total = articles.length;
  const results = PATTERNS
    .map((p) => ({
      name: p.name,
      group: p.group,
      count: counts.get(p.name),
      share: total ? Math.round((counts.get(p.name) / total) * 1000) / 10 : 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { total, results };
}
