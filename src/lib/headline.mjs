// Fælles regler for overskrifter — bruges af robotten (add-video.mjs) og af
// retitle-to-demand.mjs, så de to aldrig kan komme ud af trit.

// Publikations-casing: småord i småt medmindre de indleder titlen eller står
// lige efter kolon. Gemini skriver "And"/"For" med stort trods Title Case-krav.
const SMAAORD = new Set(['a','an','and','as','at','but','by','for','in','nor','of','on','or','per','the','to','vs','via','with']);
export function pubCase(t) {
  return t.split(' ').map((ord, i, alle) => {
    const kerne = ord.toLowerCase();
    if (i === 0 || (i > 0 && alle[i - 1].endsWith(':')) || !SMAAORD.has(kerne)) return ord;
    return kerne;
  }).join(' ');
}

// ---- Søgeords-værn på overskriften ----
// Målt 8/9-2026 med audit-demand.mjs: robotten fandt et rigtigt søgespørgsmål
// ("what are augmented reality games"), men titelform-rotationen ovenfor fik
// Gemini til at skrive overskriften om til "Augmented Reality Games Blend
// Digital Fun Into the Real World". 26 af 49 artikler mistede søgeordet i
// overskriften — og Google matcher først og fremmest på overskrift og titel.
// Reglen: variationen må blive, men overskriften SKAL indeholde spørgsmålets
// kerneord. Deterministisk tjek (som alfabet-værnet), ikke et løfte i prompten.
const SPOERGEORD = new Set(['what','how','why','when','where','which','who','is','are','does','do','can','should','will','did','to','use','get','a','an','the','of','in','on','for','and','or','with','your','you','it','its','this','that','from','by','as','at','into','vs','mean','means','meaning','work','works','explained','definition']);
const AKRONYMER = { ai: 'AI', seo: 'SEO', ar: 'AR', vr: 'VR', xr: 'XR', llm: 'LLM', llms: 'LLMs', gpu: 'GPU', gpus: 'GPUs', cpu: 'CPU', npu: 'NPU', api: 'API', apis: 'APIs', nft: 'NFT', nfts: 'NFTs', defi: 'DeFi', etf: 'ETF', crm: 'CRM', saas: 'SaaS', ui: 'UI', ux: 'UX', iot: 'IoT', grc: 'GRC', mcp: 'MCP', rag: 'RAG', agi: 'AGI' };

// Stamme: "chips"/"chip", "computing"/"computers" skal tælle som samme ord.
export function stamme(w) {
  w = w.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (w.length > 5) w = w.replace(/(ing|ies|es|ed)$/, '').replace(/([^s])s$/, '$1'); // "access" beholder sit s
  return w.slice(0, 6);
}
export function kerneord(spoergsmaal) {
  return spoergsmaal.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !SPOERGEORD.has(w));
}
// Hvilke af spørgsmålets kerneord mangler i overskriften? To krav:
//  1) hvert kerneord findes (stamme-match), og
//  2) de står i samme rækkefølge som i spørgsmålet — der må gerne være ord
//     imellem. "What a Cybersecurity Analyst Does" dækker "cybersecurity
//     analyst"; "Analyst: What a Cybersecurity Professional Does" gør ikke.
// Første udgave krævede at naboord stod klos op ad hinanden; det gav
// "Precision Manufacturing Dictates How AI Chips Used" (testet 8/9) — et
// krav om ordstilling, ikke om grammatik. Rækkefølge med huller er nok.
// Returnerer de ord der mangler eller står forkert, til reparations-prompten.
export function manglendeKerneord(titel, spoergsmaal) {
  const titelOrd = titel.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stamme);
  const kerne = kerneord(spoergsmaal);
  const mangler = kerne.filter((w) => !titelOrd.includes(stamme(w)));
  if (mangler.length) return mangler;
  // Alle ord findes — står de i rækkefølge? Gå gennem titlen og afkryds.
  let k = 0;
  for (const w of titelOrd) if (k < kerne.length && w === stamme(kerne[k])) k++;
  return k === kerne.length ? [] : kerne.slice(k);
}
// Sidste udvej: selve spørgsmålet som overskrift. Det matcher altid søgningen,
// og "What Are AI Chips in Laptops?" er en fuldt brugbar overskrift.
export function overskriftAfSpoergsmaal(spoergsmaal) {
  const ord = spoergsmaal.trim().replace(/[?.!]+$/, '').split(/\s+/)
    .map((w) => AKRONYMER[w.toLowerCase()] || w);
  const t = pubCase(ord.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  return /^(what|how|why|when|where|which|who|is|are|does|do|can|should|will)\b/i.test(t) ? t + '?' : t;
}

