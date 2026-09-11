// Søgespørgsmål vist som tekst: "what is zero trust security model" ->
// "What is zero trust security model?". Akronymer og firmanavne får deres
// rigtige skrivemåde. Bruges af forsiden ("Questions people are asking") og af
// artikelsidens "People also ask", så de to aldrig skriver samme spørgsmål forskelligt.
import { kerneord, stamme } from './headline.mjs';

const AKRO = { ai: 'AI', seo: 'SEO', ar: 'AR', vr: 'VR', xr: 'XR', llm: 'LLM', llms: 'LLMs', gpu: 'GPU', gpus: 'GPUs', cpu: 'CPU', npu: 'NPU', api: 'API', apis: 'APIs', nft: 'NFT', nfts: 'NFTs', defi: 'DeFi', etf: 'ETF', etfs: 'ETFs', saas: 'SaaS', ui: 'UI', ux: 'UX', mcp: 'MCP', agi: 'AGI', tdd: 'TDD', geo: 'GEO', aeo: 'AEO', xrp: 'XRP', us: 'US', uk: 'UK', eu: 'EU', vpn: 'VPN', mfa: 'MFA', iot: 'IoT', rag: 'RAG', cuda: 'CUDA', ram: 'RAM', ssd: 'SSD', html: 'HTML', css: 'CSS', sql: 'SQL', pdf: 'PDF', url: 'URL',
  meta: 'Meta', quest: 'Quest', google: 'Google', youtube: 'YouTube', chatgpt: 'ChatGPT', openai: 'OpenAI', nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana', apple: 'Apple', microsoft: 'Microsoft', amazon: 'Amazon', claude: 'Claude', gemini: 'Gemini', iphone: 'iPhone', ipad: 'iPad', android: 'Android', windows: 'Windows', linux: 'Linux', python: 'Python', javascript: 'JavaScript', wordpress: 'WordPress', tiktok: 'TikTok', linkedin: 'LinkedIn', etherscan: 'Etherscan', notebooklm: 'NotebookLM', copilot: 'Copilot', tesla: 'Tesla', spacex: 'SpaceX', deepseek: 'DeepSeek', anthropic: 'Anthropic', midjourney: 'Midjourney', sora: 'Sora', grok: 'Grok', robinhood: 'Robinhood', coinbase: 'Coinbase', stripe: 'Stripe', paypal: 'PayPal', pinterest: 'Pinterest', facebook: 'Facebook', instagram: 'Instagram', reddit: 'Reddit', github: 'GitHub', cloudflare: 'Cloudflare', aws: 'AWS', azure: 'Azure' };

export function asQuestion(q) {
  const s = String(q || '').trim().replace(/[?.!]+$/, '').split(/\s+/).map((w) => AKRO[w.toLowerCase()] || w).join(' ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) + '?' : '';
}

// Hvor mange kerneord (stammer) deler to spørgsmål? Bruges til "People also ask":
// samme emne + flest fælles ord med artiklens eget spørgsmål vinder.
export function faellesOrd(a, b) {
  const A = new Set(kerneord(a).map(stamme));
  return kerneord(b).map(stamme).filter((w) => A.has(w)).length;
}
