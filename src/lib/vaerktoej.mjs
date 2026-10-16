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
};

// Ordet skal stå i artiklens spørgsmål eller titel (ikke bare i brødteksten), så værktøjet
// svarer på det, artiklen handler om.
const REGLER = [
  // "tokens" alene rammer også krypto ("SEC ... Wall Street Tokens", målt 16/10) - kræv AI-ord nær ved.
  ['ai-token-calculator', /\b(ai|llms?|chatgpt|gpt|claude|gemini|openai|model)\b.{0,40}\btokens?\b|\btokens?\b.{0,40}\b(ai|llms?|chatgpt|gpt|claude|gemini|openai|model)\b|\b(api (cost|price|pricing)|cost of (running|using) (an? )?(ai|llm|chatgpt|claude|gemini)|(chatgpt|claude|gemini|llm|openai) (api )?(cost|price|pricing)|context window)\b/i],
  ['password-generator', /\b(passwords?|passkeys?|brute.?force|credential stuffing)\b/i],
  ['crypto-profit-calculator', /\b(bitcoin|btc|ethereum|eth|crypto(currency)?|solana|altcoins?)\b.{0,40}\b(profit|roi|returns?|worth (it|buying)|price prediction|buy|sell)\b|\b(profit|roi|returns?)\b.{0,40}\b(bitcoin|crypto|ethereum)\b/i],
  ['compound-calculator', /\b(compound(ing)? (interest|growth)|savings? (account|rate)|staking (rewards?|yield|returns?)|yield farming|retirement|index funds?|dividends?|s&p 500)\b/i],
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
