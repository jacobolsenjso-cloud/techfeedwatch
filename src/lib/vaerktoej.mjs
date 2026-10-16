// Værktøj til artiklen (trin 4 del 2, 16/10-2026, Jacob: "du bygger 1").
// Før: værktøjsboksen blev valgt efter emnemærke, så 149 af 436 artikler viste
// "Password Generator" - også artikler om aktier og Nike - og 82 viste intet.
// Nu: et værktøj vises KUN, når artiklens eget spørgsmål eller titel handler om det,
// læseren kan regne ud eller tjekke med værktøjet. Ellers ingen boks.
// Deterministisk (ingen modelkald), så siden og robotten vælger ens.
// Rækkefølgen tæller: første regel, der passer, vinder (mest specifikke først).

export const VAERKTOEJ = {
  'ai-token-calculator': { titel: 'AI Token & Cost Calculator', beskrivelse: 'Estimate tokens and API cost across the major AI models.', brug: ['Price your own monthly usage with our [AI Token & Cost Calculator](/tools/ai-token-calculator).', 'To see what this costs for your own prompts, try our [AI Token & Cost Calculator](/tools/ai-token-calculator).'] },
  'crypto-profit-calculator': { titel: 'Crypto Profit & ROI Calculator', beskrivelse: 'Work out profit, loss and ROI on a crypto trade, including fees.', brug: ['Run your own numbers in our [Crypto Profit & ROI Calculator](/tools/crypto-profit-calculator) before you buy or sell.', 'To check a trade of your own, use our [Crypto Profit & ROI Calculator](/tools/crypto-profit-calculator).'] },
  'compound-calculator': { titel: 'Compound Growth & Crypto Staking Calculator', beskrivelse: 'Project compound interest, savings growth and staking returns over time.', brug: ['See how your own savings would grow with our [Compound Growth & Crypto Staking Calculator](/tools/compound-calculator).', 'To project your own returns over time, try our [Compound Growth & Crypto Staking Calculator](/tools/compound-calculator).'] },
  'password-generator': { titel: 'Password Generator & Strength Checker', beskrivelse: 'Generate strong passwords and check how strong an existing one is.', brug: ['Check how strong your own password is with our [Password Generator & Strength Checker](/tools/password-generator).', 'To make a password that holds up, use our [Password Generator & Strength Checker](/tools/password-generator).'] },
  'serp-preview': { titel: 'Meta Tag & SERP Snippet Preview', beskrivelse: 'Preview how a page appears in Google and tune its title and description.', brug: ['Preview how your own page looks in Google with our [Meta Tag & SERP Snippet Preview](/tools/serp-preview).'] },
  'schema-generator': { titel: 'Schema Markup Generator (JSON-LD)', beskrivelse: 'Generate valid JSON-LD structured data for your pages.', brug: ['Generate the markup for your own pages with our [Schema Markup Generator (JSON-LD)](/tools/schema-generator).'] },
  'keyword-idea-generator': { titel: 'Keyword Idea Generator', beskrivelse: 'Find related searches and long-tail keyword ideas.', brug: ['Find the searches behind your own topic with our [Keyword Idea Generator](/tools/keyword-idea-generator).'] },
  'robots-txt-generator': { titel: 'robots.txt Generator', beskrivelse: 'Build a robots.txt file, including rules for AI crawlers.', brug: ['Write the rules for your own site with our [robots.txt Generator](/tools/robots-txt-generator).'] },
  'hreflang-generator': { titel: 'Hreflang Tags Generator', beskrivelse: 'Generate hreflang tags for multilingual and multi-regional sites.', brug: ['Generate the tags for your own language versions with our [Hreflang Tags Generator](/tools/hreflang-generator).'] },
  'utm-builder': { titel: 'UTM Campaign URL Builder', beskrivelse: 'Build tagged campaign links you can track in analytics.', brug: ['Tag your own campaign links with our [UTM Campaign URL Builder](/tools/utm-builder).'] },
  'open-graph-generator': { titel: 'Open Graph & Twitter Card Generator', beskrivelse: 'Control how your links look when shared on social media.', brug: ['Set how your own links look when shared with our [Open Graph & Twitter Card Generator](/tools/open-graph-generator).'] },
  'readability-checker': { titel: 'Readability Checker (Flesch Reading Ease)', beskrivelse: 'Score how easy a text is to read.', brug: ['Score your own text with our [Readability Checker (Flesch Reading Ease)](/tools/readability-checker).'] },
  'subtitle-converter': { titel: 'SRT to VTT Subtitle Converter', beskrivelse: 'Convert subtitle files between SRT and VTT.', brug: ['Convert your own subtitle files with our [SRT to VTT Subtitle Converter](/tools/subtitle-converter).'] },
  'thumbnail-downloader': { titel: 'YouTube Thumbnail Downloader', beskrivelse: 'Preview and download YouTube thumbnails in every resolution.', brug: ['Grab any video thumbnail with our [YouTube Thumbnail Downloader](/tools/thumbnail-downloader).'] },
  'json-formatter': { titel: 'JSON Formatter & Validator', beskrivelse: 'Format, minify and validate JSON with clear error messages.', brug: ['Check your own JSON with our [JSON Formatter & Validator](/tools/json-formatter).'] },
  'text-diff': { titel: 'Text Diff Checker', beskrivelse: 'Compare two texts and see exactly what changed.', brug: ['Compare two versions yourself with our [Text Diff Checker](/tools/text-diff).'] },
  'image-compressor': { titel: 'Image Compressor, Resizer & Converter', beskrivelse: 'Shrink and convert images in the browser.', brug: ['Shrink your own images with our [Image Compressor, Resizer & Converter](/tools/image-compressor).'] },
  // Nye 16/10-2026 (trin 4 del 2)
  'crypto-dca-calculator': { titel: 'Crypto DCA Calculator', beskrivelse: 'See what buying the same amount every month would be worth today, from real monthly prices.', brug: ['See what a monthly habit would be worth today with our [Crypto DCA Calculator](/tools/crypto-dca-calculator).', 'To test monthly buying on real prices, try our [Crypto DCA Calculator](/tools/crypto-dca-calculator).'] },
  'crypto-tax-calculator': { titel: 'Crypto Gains & Tax Estimator (FIFO)', beskrivelse: 'Realized gain or loss with the FIFO method, fees included, and tax at your own rate.', brug: ['Work out the gain on your own trades with our [Crypto Gains & Tax Estimator (FIFO)](/tools/crypto-tax-calculator).'] },
  'trading-fee-calculator': { titel: 'Trading Fee & Spread Calculator', beskrivelse: 'Compare what fees and spreads really cost per trade and per year.', brug: ['Compare what your own platform really charges with our [Trading Fee & Spread Calculator](/tools/trading-fee-calculator).'] },
  'ai-subscription-vs-api': { titel: 'AI Subscription vs API Cost Calculator', beskrivelse: 'Is a flat AI subscription or pay-per-use API cheaper for the way you use it?', brug: ['Check which is cheaper for your own use with our [AI Subscription vs API Cost Calculator](/tools/ai-subscription-vs-api).'] },
  'local-ai-calculator': { titel: 'Can My Computer Run This AI Model?', beskrivelse: 'Check whether a local AI model fits in your graphics card or system memory.', brug: ['Check whether your own computer is up to it with our [local AI model checker](/tools/local-ai-calculator).'] },
  'gpu-hotspot-checker': { titel: 'GPU Temperature & Hotspot Checker', beskrivelse: 'Is the gap between your GPU temperature and hotspot normal?', brug: ['Check your own readings with our [GPU Temperature & Hotspot Checker](/tools/gpu-hotspot-checker).'] },
  'loan-calculator': { titel: 'Loan Payment Calculator', beskrivelse: 'Monthly payment, total interest and total cost of a fixed-rate loan.', brug: ['Work out the payment on a loan of your own with our [Loan Payment Calculator](/tools/loan-calculator).'] },
  'inflation-calculator': { titel: 'Inflation & Purchasing Power Calculator', beskrivelse: 'What things will cost in the future, and what your money will really be worth.', brug: ['See what inflation does to your own money with our [Inflation & Purchasing Power Calculator](/tools/inflation-calculator).'] },
  // Hold 2 og 3 (16/10 aften)
  'merge-pdf': { titel: 'Merge PDF Files', beskrivelse: 'Combine several PDFs into one, right in your browser.', brug: ['Combine your own documents with our [Merge PDF Files](/tools/merge-pdf) tool; nothing is uploaded.'] },
  'split-pdf': { titel: 'Split PDF', beskrivelse: 'Take pages out of a PDF without uploading it.', brug: ['Take pages out of your own PDF with our [Split PDF](/tools/split-pdf) tool; nothing is uploaded.'] },
  'video-file-size-calculator': { titel: 'Video File Size Calculator', beskrivelse: 'How big a video file will be from its length and bitrate.', brug: ['Work out the size of your own video with our [Video File Size Calculator](/tools/video-file-size-calculator).'] },
  'upload-time-calculator': { titel: 'Upload & Download Time Calculator', beskrivelse: 'How long a file takes to upload or download at your speed.', brug: ['See how long your own upload will take with our [Upload & Download Time Calculator](/tools/upload-time-calculator).'] },
  'pc-power-cost-calculator': { titel: 'PC Power Cost Calculator', beskrivelse: 'What your computer costs to run per month and year.', brug: ['Work out what your own machine costs to run with our [PC Power Cost Calculator](/tools/pc-power-cost-calculator).'] },
  'storage-calculator': { titel: 'Storage Space Calculator', beskrivelse: 'How many photos, videos or songs fit on a drive.', brug: ['See what fits on your own drive with our [Storage Space Calculator](/tools/storage-calculator).'] },
  'quantum-speedup-calculator': { titel: 'Quantum Speed-up Calculator', beskrivelse: 'How qubits and Grover’s search compare with an ordinary computer.', brug: ['Try the numbers yourself in our [Quantum Speed-up Calculator](/tools/quantum-speedup-calculator).'] },
};

// Ordet skal stå i artiklens spørgsmål eller titel (ikke bare i brødteksten), så værktøjet
// svarer på det, artiklen handler om.
const REGLER = [
  // Hold 2 og 3 (16/10 aften)
  ['merge-pdf', /\b(merge|combine|join)\b.{0,20}\bpdfs?\b|\bpdfs?\b.{0,20}\b(merge|merging|combine)\b/i],
  ['split-pdf', /\b(split|extract)\b.{0,20}\bpdfs?\b|\bpdfs?\b.{0,20}\b(split|splitting)\b/i],
  ['video-file-size-calculator', /\b(video (file )?size|bitrate|how much (storage|space) .{0,20}video)\b/i],
  ['upload-time-calculator', /\b(upload|download) (speed|time)s?\b|\bhow long .{0,20}\b(upload|download)\b/i],
  ['pc-power-cost-calculator', /\b(power|electricity|energy) (consumption|cost|bill|usage|draw)\b.{0,30}\b(pc|computer|gpu|gaming|laptop)\b|\b(pc|computer|gpu|gaming|laptop)s?\b.{0,30}\b(power|electricity|energy) (consumption|cost|bill|usage|draw)\b|\bwatts?\b.{0,20}\b(pc|computer|gpu)\b/i],
  ['storage-calculator', /\b(storage space|hard drives?|ssds?|terabytes?|how much storage)\b/i],
  ['quantum-speedup-calculator', /\b(quantum (computers?|computing|speed.?up|advantage|supremacy)|qubits?|grover)\b/i],
  // Nye 16/10-2026: mest specifikke først
  ['ai-subscription-vs-api', /\b(chatgpt plus|claude pro|gemini (advanced|pro)|ai subscriptions?)\b|\b(chatgpt|claude|gemini)\b.{0,30}\b(worth (it|paying)|subscription)\b/i],
  ['local-ai-calculator', /\b(run(ning)?|host(ing)?|install(ing)?)\b.{0,30}\b(ai|llms?|models?|llama|deepseek|mistral|qwen)\b.{0,30}\b(locally|offline|on (my|your|a) (pc|computer|laptop|mac))\b|\blocal (llms?|ai models?)\b|\b(vram|quantiz)/i],
  ['gpu-hotspot-checker', /\b(gpu|graphics card)s?\b.{0,30}\b(temps?|temperatures?|hot ?spot|overheat(ing)?|thermals?)\b|\bhot ?spot temp/i],
  ['crypto-dca-calculator', /\b(dca|dollar.?cost averag\w*)\b|\b(invest|buy)(ing)?\b.{0,25}\b(every month|monthly|each month|regularly)\b/i],
  ['crypto-tax-calculator', /\b(crypto(currency)?|bitcoin|ethereum)\b.{0,40}\b(tax(es|ed)?|capital gains?)\b|\b(tax(es|ed)?|capital gains?)\b.{0,40}\b(crypto|bitcoin|ethereum)\b/i],
  ['trading-fee-calculator', /\b(trading|exchange|broker(age)?) fees?\b|\bspreads?\b.{0,20}\b(crypto|trading|exchange|broker)\b|\bcommission.?free\b/i],
  // "tokens" alene rammer også krypto ("SEC ... Wall Street Tokens", målt 16/10) - kræv AI-ord nær ved.
  ['ai-token-calculator', /\b(ai|llms?|chatgpt|gpt|claude|gemini|openai|model)\b.{0,40}\btokens?\b|\btokens?\b.{0,40}\b(ai|llms?|chatgpt|gpt|claude|gemini|openai|model)\b|\b(api (cost|price|pricing)|cost of (running|using) (an? )?(ai|llm|chatgpt|claude|gemini)|(chatgpt|claude|gemini|llm|openai) (api )?(cost|price|pricing)|context window)\b/i],
  ['password-generator', /\b(passwords?|passkeys?|brute.?force|credential stuffing)\b/i],
  ['crypto-profit-calculator', /\b(bitcoin|btc|ethereum|eth|crypto(currency)?|solana|altcoins?)\b.{0,40}\b(profit|roi|returns?|worth (it|buying)|price prediction|buy|sell)\b|\b(profit|roi|returns?)\b.{0,40}\b(bitcoin|crypto|ethereum)\b/i],
  ['compound-calculator', /\b(compound(ing)? (interest|growth)|savings? (account|rate)|staking (rewards?|yield|returns?)|yield farming|retirement|index funds?|dividends?|s&p 500)\b/i],
  ['inflation-calculator', /\b(inflation|purchasing power|cost of living)\b/i],
  ['loan-calculator', /\b(loans?|mortgages?|borrow(ing)?|interest rates?|apr)\b/i],
  ['serp-preview', /\b(meta descriptions?|title tags?|serp snippets?|click.?through rate|ctr)\b/i],
  ['schema-generator', /\b(schema markup|structured data|rich (results?|snippets?)|json-ld)\b/i],
  ['keyword-idea-generator', /\b(keyword research|keywords? ideas?|long.?tail keywords?|search volume)\b/i],
  ['robots-txt-generator', /\b(robots\.txt|block (ai )?(crawlers?|bots?)|gptbot|ai crawlers?)\b/i],
  ['hreflang-generator', /\b(hreflang|international seo|multilingual (site|seo))\b/i],
  ['utm-builder', /\b(utm|campaign tracking|attribution)\b/i],
  ['open-graph-generator', /\b(open graph|social (media )?previews?|link previews?)\b/i],
  ['readability-checker', /\b(readability|reading level|plain language)\b/i],
  ['subtitle-converter', /\b(subtitles?|srt|vtt|closed captions?)\b/i],
  ['thumbnail-downloader', /\b(youtube )?thumbnails?\b/i],
  ['json-formatter', /\bjson\b/i],
  ['text-diff', /\b(diff checker|compare (two )?(texts?|documents?))\b/i],
  ['image-compressor', /\b(compress(ing)? images?|image (size|compression)|core web vitals|page speed)\b/i],
];

// tekst = artiklens titel + søgespørgsmål. Returnerer { slug, titel, beskrivelse, brug } eller null.
export function vaerktoejTil(tekst) {
  const t = String(tekst || '');
  const hit = REGLER.find(([, re]) => re.test(t));
  return hit ? { slug: hit[0], href: `/tools/${hit[0]}`, ...VAERKTOEJ[hit[0]] } : null;
}

// Én brugssætning til artiklens tekst (robotten). Variant vælges fast ud fra slug, så samme
// artikel altid får samme sætning. Står allerede et link til værktøjet i teksten: ingen sætning.
export function brugsSaetning(vaerktoej, md, noegle = '') {
  if (!vaerktoej || String(md).includes(`(/tools/${vaerktoej.slug}`)) return '';
  let h = 0; for (const c of String(noegle)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return vaerktoej.brug[h % vaerktoej.brug.length];
}
