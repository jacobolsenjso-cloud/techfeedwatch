// Ét sted med sandheden om værktøjerne.
//
// Forsiden, /tools-oversigten, kategorisiderne og sitemap'et læser alle herfra.
// Tilføjer du et nyt værktøj, skal det kun skrives ind i TOOLS herunder — så
// dukker det op alle de rigtige steder af sig selv.

export type ToolCategoryId = 'seo' | 'content' | 'developer' | 'media' | 'finance';

export interface ToolCategory {
  id: ToolCategoryId;
  /** URL bliver /tools/<slug> */
  slug: string;
  icon: string;
  /** Kort navn — bruges i kort, brødkrummer og lister */
  name: string;
  /** <title> og <h1> på kategorisiden */
  heading: string;
  /** Meta description på kategorisiden */
  description: string;
  /** Indledning øverst på kategorisiden */
  intro: string;
  /** Tags på sitet som hører emnemæssigt sammen med kategorien */
  relatedTags: string[];
  /** Guide-afsnit nederst på kategorisiden — hvert element bliver et <p> */
  guide: string[];
}

export interface Tool {
  slug: string;
  icon: string;
  /** Fuldt navn — bruges på /tools og kategorisiderne */
  title: string;
  /** Kort navn — bruges hvor pladsen er trang, fx forsiden */
  short: string;
  description: string;
  category: ToolCategoryId;
  /** Vises i værktøjssektionen på forsiden */
  featured?: boolean;
  /**
   * Sidst værktøjet eller dets tal reelt blev ændret (ÅÅÅÅ-MM-DD). Vises som
   * "Last updated" på siden (ToolUpdated) og som dateModified i schemaet.
   * Sæt det kun, når noget faktisk er ændret — en tom dato er ærligere end en
   * falsk. Indført 24/9-2026 med link-planen.
   */
  updated?: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'seo',
    slug: 'seo',
    icon: '🔎',
    name: 'SEO & Metadata',
    heading: 'Free SEO & Metadata Tools',
    description:
      'Free browser-based SEO tools: SERP preview, meta tags, schema, robots.txt and AI crawler checks, sitemaps and Search Console analysis. No sign-up, nothing uploaded.',
    intro:
      'Everything here writes or checks the markup search engines actually read — the title Google shows, the card that appears when someone shares your link, the structured data that earns rich results. Each tool runs entirely in your browser, so nothing you paste is sent anywhere.',
    relatedTags: ['SEO', 'Business & Money'],
    guide: [
      "The tools here share one idea: write the markup by hand, understand it, then paste it. Generators are quicker than remembering syntax, but the fields you fill in still decide everything - a generated title tag with a weak title is weak markup, delivered efficiently. Use the SERP preview to judge the words, then the tag generators to package them.",
      "A workflow that covers a page in ten minutes: draft title and description in the SERP preview, generate the head tags, add Open Graph for sharing, and - if the page carries an article, FAQ, or video - the matching JSON-LD from the schema generators. Finish in Google's Rich Results Test, which has the final say this site's tools cannot have.",
      "One exception to the everything-runs-locally rule in this category: the video schema generator sends the YouTube URL you paste to a lookup function, because the video's metadata lives on YouTube's servers. Its page says the same thing. Every other tool here works with the network cable pulled out.",
    ],
  },
  {
    id: 'content',
    slug: 'content',
    icon: '📝',
    name: 'Content & Writing',
    heading: 'Free Content & Writing Tools',
    description:
      'Free tools for content work: keyword idea generator, keyword density analyzer, readability scoring, and a live word counter. Runs in your browser, no sign-up.',
    intro:
      'Tools for the part of SEO that happens before the markup: finding what to write about, and checking that what you wrote is readable. No account, no upload — paste your text and get an answer.',
    relatedTags: ['SEO', 'Productivity'],
    guide: [
      "These four cover the loop of content work: the idea generator gives you angles before writing, the word counter and readability checker measure while you write, and the density analyzer catches accidental repetition after. None of them judges quality - they count and combine, which is exactly why they are fast and private.",
      "The honest framing for all four: they are instruments, not editors. A readability score of 65 with nonsense content is still nonsense, and a perfect keyword spread in a text nobody wants to read ranks like the text it is. The measurement that cannot be automated - reading your draft aloud, slowly - is still the one that catches what these miss.",
      "Everything runs in your browser. Unpublished drafts, client work, and embargoed copy are safe to paste, because there is no server on the other end to see them.",
    ],
  },
  {
    id: 'developer',
    slug: 'developer',
    icon: '⚙️',
    name: 'Developer Tools',
    heading: 'Free Developer Tools',
    description:
      'Free developer tools: JSON formatter and validator, Base64 and URL encoder, text diff, case converter, colour contrast checker and password generator.',
    intro:
      'The small utilities you reach for a dozen times a week. All of them run locally in the browser — your JSON, your tokens, and your passwords never leave the machine you are sitting at.',
    relatedTags: ['Coding', 'Automation'],
    guide: [
      "These are deliberately small: each does one thing you would otherwise script, search for, or do badly by hand. The JSON formatter validates with the browser's own parser, the password generator uses the cryptographic randomness your password manager uses, and the diff runs the same algorithm family as Git. Nothing here is a toy version of the real thing - for these narrow jobs, this is the real thing.",
      "Local execution matters most in this category, because the things developers paste are the things that must not leak: API responses full of customer data, tokens, connection strings, passwords. Every tool on this page works offline once loaded. If you are ever unsure, open the network tab and watch - nothing leaves.",
      "The limits are the flip side of the smallness: no JSON repair, no diff for binary files, no password vault. When a job outgrows the tool, the tool's own page says so and points at what to use instead.",
    ],
  },
  {
    id: 'media',
    slug: 'media',
    icon: '🎬',
    name: 'Video & Image',
    heading: 'Free Video & Image Tools',
    description:
      'Free video and image tools: compress and convert images, Base64 data URIs, responsive YouTube embeds, SRT to VTT subtitle conversion, and thumbnail downloads.',
    intro:
      'Handling the media side of a page: getting images down to a sensible size, embedding video without slowing everything down, and converting captions between the formats players expect. Image processing happens on your own device — nothing is uploaded to a server.',
    relatedTags: ['AI Video', 'Coding'],
    guide: [
      "The media tools handle the heaviest bytes on any page. The image compressor is the one with the biggest payoff: resizing a phone photo to the width a page actually displays routinely cuts the file by ninety percent before compression even starts. The embed generator solves the other common weight problem - video - by writing the responsive, privacy-mode iframe by hand instead of pasting YouTube's default.",
      "Two honesty notes that these tools' own pages also carry. The thumbnail downloader fetches its previews straight from YouTube's servers, so it is the one image tool here that talks to the network. And the image compressor's canvas processing strips metadata - which removes GPS location (good, before publishing) and copyright fields (know it, if that matters to you).",
      "What none of these do: edit. No cropping beyond resize, no color work, no subtitle timing changes. They convert, compress, and package media that is already right - the judgment about the media itself stays with you.",
    ],
  },
  {
    id: 'finance',
    slug: 'finance',
    icon: '💰',
    name: 'Finance & Crypto',
    heading: 'Free Finance & Crypto Calculators',
    description:
      'Free calculators for compound growth and staking returns, crypto profit and ROI including fees, and AI token cost across GPT-6, Claude, and Gemini.',
    intro:
      'Three calculators for the numbers that are easy to get wrong in your head: what compounding actually does over ten years, what a trade returned once fees are counted, and what a given prompt costs across the major AI models. Estimates for planning — not financial advice.',
    relatedTags: ['Fintech', 'Crypto', 'Business & Money'],
    guide: [
      "Three calculators, one shared principle: show the arithmetic people skip. Compounding is unintuitive over long spans, fees on both sides of a trade eat more than the headline suggests, and AI token costs only feel small until multiplied by a batch job. Each calculator makes the skipped step visible as a number.",
      "Read all three the same way: the math is exact, the assumptions are not. The compound calculator holds a rate steady for years, which no market does; the crypto calculator models one clean trade without slippage or tax; the token calculator estimates tokens without the model's real tokenizer. The pages state their own gaps - use the results as planning sketches with known edges.",
      "None of this is financial advice, and everything runs in your browser - amounts, trades, and prompts stay on your machine.",
    ],
  },
];

export const TOOLS: Tool[] = [
  // ---------- SEO & Metadata ----------
  {
    slug: 'serp-preview',
    icon: '🔎',
    title: 'Meta Tag & SERP Snippet Preview',
    short: 'SERP Preview',
    description:
      'Preview how your page appears in Google search and generate optimized meta tags.',
    category: 'seo',
  },
  {
    slug: 'meta-tag-generator',
    icon: '🏷️',
    title: 'HTML Meta Tags Generator',
    short: 'Meta Tags',
    description:
      'Build a complete set of head meta tags — title, description, canonical, robots, and more.',
    category: 'seo',
  },
  {
    slug: 'open-graph-generator',
    icon: '🔗',
    title: 'Open Graph & Twitter Card Generator',
    short: 'Open Graph Tags',
    description:
      'Generate og: and Twitter Card meta tags with a live social preview for perfect link sharing.',
    category: 'seo',
  },
  {
    slug: 'schema-generator',
    icon: '🧩',
    title: 'Schema Markup Generator (JSON-LD)',
    short: 'Schema Generator',
    description:
      'Generate valid Article, FAQ, and Breadcrumb JSON-LD structured data to earn rich results in Google.',
    category: 'seo',
    featured: true,
  },
  {
    slug: 'video-schema',
    icon: '🎬',
    title: 'Video Schema Generator',
    short: 'Video Schema',
    description:
      'Generate valid VideoObject JSON-LD schema markup for any YouTube video to improve SEO.',
    category: 'seo',
    updated: '2026-09-24',
  },
  {
    slug: 'hreflang-generator',
    icon: '🌍',
    title: 'Hreflang Tags Generator',
    short: 'Hreflang Tags',
    description:
      'Generate hreflang link tags with x-default for multilingual sites, and catch invalid language and region codes.',
    category: 'seo',
    updated: '2026-09-24',
  },
  {
    slug: 'robots-txt-generator',
    icon: '🤖',
    title: 'robots.txt Generator',
    short: 'robots.txt',
    description:
      'Build a valid robots.txt with presets or custom Allow/Disallow rules and sitemaps, then copy it.',
    category: 'seo',
  },
  {
    slug: 'slug-generator',
    icon: '🔗',
    title: 'URL Slug Generator',
    short: 'Slug Generator',
    description:
      'Turn any title into a clean, SEO-friendly URL slug — lowercase, hyphenated, accent-free.',
    category: 'seo',
  },
  {
    slug: 'utm-builder',
    icon: '🎯',
    title: 'UTM Campaign URL Builder',
    short: 'UTM Builder',
    description:
      'Build trackable campaign links with UTM parameters for Google Analytics.',
    category: 'seo',
  },
  {
    slug: 'robots-txt-tester',
    icon: '🚦',
    title: 'robots.txt Tester',
    short: 'robots.txt Tester',
    description:
      'See if a crawler may fetch a URL under your robots.txt - and the exact rule that decides, using Google\'s matching.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'ai-crawler-checker',
    icon: '🕷️',
    title: 'AI Crawler Access Checker',
    short: 'AI Crawlers',
    description:
      'Check which AI crawlers - GPTBot, ClaudeBot, PerplexityBot, Google-Extended and more - your robots.txt allows.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'schema-validator',
    icon: '🧩',
    title: 'Schema Markup Validator (JSON-LD)',
    short: 'Schema Validator',
    description:
      'Check JSON-LD against Google\'s rich result requirements: missing properties, bad dates, wrong types.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'xml-sitemap-generator',
    icon: '🗺️',
    title: 'XML Sitemap Generator',
    short: 'Sitemap Generator',
    description:
      'Turn a list of URLs into a clean sitemap.xml - de-duplicated, escaped and split at 50,000 URLs.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'search-console-quick-wins',
    icon: '⚡',
    title: 'Search Console Quick Wins Finder',
    short: 'GSC Quick Wins',
    description:
      'Find searches ranking 4-20 in your Search Console export and the extra clicks each could bring.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'seo-traffic-forecast',
    icon: '📈',
    title: 'SEO Traffic Forecast',
    short: 'Traffic Forecast',
    description:
      'Forecast your clicks from Google for the next 3, 6 or 12 months from a Search Console export.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'topic-cluster-map',
    icon: '🧭',
    title: 'Topic Cluster Map',
    short: 'Topic Map',
    description:
      'Group the searches you appear for into topics and see which need a new article or an update.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'organic-traffic-value',
    icon: '💰',
    title: 'Organic Traffic Value Calculator',
    short: 'Traffic Value',
    description:
      'Put a price on your Google traffic: what the same clicks would cost as ads over 1, 3 and 5 years.',
    category: 'seo',
    updated: '2026-10-24',
  },
  {
    slug: 'pagespeed-checker',
    icon: '🏎️',
    title: 'PageSpeed & Core Web Vitals Checker',
    short: 'PageSpeed',
    description:
      'Run Google PageSpeed Insights on any page: scores, real-user Core Web Vitals and the biggest time savers.',
    category: 'seo',
    updated: '2026-10-24',
  },

  // ---------- Content & Writing ----------
  {
    slug: 'keyword-idea-generator',
    icon: '🌱',
    title: 'Keyword Idea Generator',
    short: 'Keyword Ideas',
    description:
      'Turn one seed keyword into hundreds of long-tail ideas using questions, prepositions, and intent modifiers.',
    category: 'content',
    featured: true,
  },
  {
    slug: 'remove-duplicate-lines',
    icon: '🧹',
    title: 'Remove Duplicate Lines',
    short: 'Remove Duplicates',
    description:
      'Strip repeated lines from a list, with control over whether capitalisation and stray spaces count as a difference.',
    category: 'content',
    featured: true,
  },
  {
    slug: 'sort-list',
    icon: '🔤',
    title: 'Sort a List',
    short: 'Sort List',
    description:
      'Sort lines A-Z, Z-A, by number, by length, reversed, or shuffled with a genuinely even random order.',
    category: 'content',
  },
  {
    slug: 'remove-empty-lines',
    icon: '📄',
    title: 'Remove Empty Lines',
    short: 'Remove Empty Lines',
    description:
      'Delete blank lines — including the ones holding only a space or tab — or collapse runs of them down to one.',
    category: 'content',
  },
  {
    slug: 'find-and-replace',
    icon: '🔁',
    title: 'Find and Replace',
    short: 'Find & Replace',
    description:
      'Replace text across a whole block at once, with whole-word matching, case matching and regular expressions.',
    category: 'content',
  },
  {
    slug: 'split-file',
    icon: '✂️',
    title: 'Split a File',
    short: 'Split File',
    description:
      'Break a large file into numbered pieces small enough to email or upload — and joinable again without any tool.',
    category: 'developer',
    featured: true,
  },
  {
    slug: 'join-files',
    icon: '🧩',
    title: 'Join Split Files',
    short: 'Join Files',
    description:
      'Reassemble .001 and .part pieces into the original file, with the order detected and missing pieces flagged.',
    category: 'developer',
  },
  {
    slug: 'random-file-generator',
    icon: '🎲',
    title: 'Random File Generator',
    short: 'Dummy File',
    description:
      'Generate a dummy file of an exact size, random bytes or zeros, for testing upload limits and storage.',
    category: 'developer',
  },
  {
    slug: 'keyword-density',
    icon: '📊',
    title: 'Keyword Density Analyzer',
    short: 'Keyword Density',
    description:
      'See the most-used words and phrases in your text with their density percentage — a classic on-page SEO check.',
    category: 'content',
  },
  {
    slug: 'readability-checker',
    icon: '📖',
    title: 'Readability Checker',
    short: 'Readability',
    description:
      'Score your text with Flesch Reading Ease and grade level to keep your writing clear and accessible.',
    category: 'content',
  },
  {
    slug: 'ai-slop-checker',
    icon: '🧽',
    title: 'AI Slop Checker',
    short: 'AI Slop Checker',
    description:
      'Highlight filler words, empty phrases and missing specifics that make writing sound generic.',
    category: 'content',
    updated: '2026-10-24',
  },
  {
    slug: 'word-counter',
    icon: '📝',
    title: 'Word & Character Counter',
    short: 'Word Counter',
    description:
      'Count words, characters, sentences, and paragraphs with live reading-time estimates.',
    category: 'content',
  },

  // ---------- Developer ----------
  {
    slug: 'json-formatter',
    icon: '🧾',
    title: 'JSON Formatter & Validator',
    short: 'JSON Formatter',
    description:
      'Format, minify, and validate JSON online with instant error messages and quick stats.',
    category: 'developer',
    featured: true,
  },
  {
    slug: 'rss-feed-parser',
    icon: '📰',
    title: 'RSS & Atom Feed Parser',
    short: 'RSS Parser',
    description:
      'See every item in an RSS or Atom feed and catch missing images, bad dates and relative links.',
    category: 'developer',
    updated: '2026-10-24',
  },
  {
    slug: 'encoder-decoder',
    icon: '🔐',
    title: 'Base64 & URL Encoder/Decoder',
    short: 'Base64 & URL Encoder',
    description:
      'Encode and decode text as Base64 or URL-safe strings, with full UTF-8 support.',
    category: 'developer',
  },
  {
    slug: 'text-diff',
    icon: '🔀',
    title: 'Text Diff Checker',
    short: 'Text Diff',
    description:
      'Compare two texts and see exactly what was added, removed, or changed, line by line.',
    category: 'developer',
  },
  {
    slug: 'case-converter',
    icon: '🔤',
    title: 'Case Converter',
    short: 'Case Converter',
    description:
      'Convert text between UPPERCASE, Title Case, camelCase, snake_case, kebab-case and more.',
    category: 'developer',
  },
  {
    slug: 'contrast-checker',
    icon: '🎨',
    title: 'Color Contrast Checker',
    short: 'Contrast Checker',
    description:
      'Check text and background colors against WCAG AA/AAA accessibility standards.',
    category: 'developer',
  },
  {
    slug: 'password-generator',
    icon: '🔑',
    title: 'Password Generator & Strength Checker',
    short: 'Password Generator',
    description:
      'Generate cryptographically secure passwords and check the strength of an existing one.',
    category: 'developer',
    featured: true,
  },

  // ---------- Video & Image ----------
  {
    slug: 'image-compressor',
    icon: '🗜️',
    title: 'Image Compressor & Converter',
    short: 'Image Compressor',
    description:
      'Resize, compress, and convert images to JPG, PNG, or WebP — all in your browser, no upload.',
    category: 'media',
    featured: true,
  },
  {
    slug: 'image-to-base64',
    icon: '🧬',
    title: 'Image to Base64 Converter',
    short: 'Image to Base64',
    description:
      'Turn an image into a Base64 data URI for inline HTML or CSS, with ready-to-copy snippets.',
    category: 'media',
  },
  {
    slug: 'youtube-embed-generator',
    icon: '▶️',
    title: 'YouTube Embed Code Generator',
    short: 'YouTube Embed',
    description:
      'Create responsive YouTube embed code with autoplay, start time, and privacy-mode options.',
    category: 'media',
  },
  {
    slug: 'subtitle-converter',
    icon: '💬',
    title: 'Subtitle Converter (SRT ↔ VTT)',
    short: 'Subtitle Converter',
    description:
      'Convert captions between SRT and WebVTT for HTML5 video, both ways, right in your browser.',
    category: 'media',
  },
  {
    slug: 'thumbnail-downloader',
    icon: '🖼️',
    title: 'YouTube Thumbnail Downloader',
    short: 'Thumbnail Downloader',
    description:
      'Preview and download YouTube video thumbnails in every available resolution.',
    category: 'media',
  },

  // ---------- Finance & Crypto ----------
  {
    slug: 'percentage-calculator',
    icon: '%',
    title: 'Percentage Calculator',
    short: 'Percentages',
    description:
      'Percentage change, discounts, VAT, working backwards from a total, and what a headline return actually means per year.',
    category: 'finance',
  },
  {
    slug: 'compound-calculator',
    icon: '📈',
    title: 'Compound Growth & Crypto Staking Calculator',
    short: 'Compound Calculator',
    description:
      'Project compound interest, savings growth, and crypto staking returns over time.',
    category: 'finance',
    featured: true,
  },
  {
    slug: 'crypto-profit-calculator',
    icon: '💰',
    title: 'Crypto Profit & ROI Calculator',
    short: 'Crypto Profit',
    description:
      'Calculate your crypto profit, loss, and ROI from buy and sell price, including trading fees.',
    category: 'finance',
  },
  {
    slug: 'ai-token-calculator',
    icon: '🧮',
    title: 'AI Token & Cost Calculator',
    short: 'AI Token Cost',
    description:
      'Estimate tokens and API cost, input and output, across GPT-6, Claude, and Gemini, with dated official prices.',
    category: 'finance',
    updated: '2026-09-24',
  },

  // ---------- Nye 16/10-2026 (trin 4 del 2: egne værktøjer til sitets emner) ----------
  {
    slug: 'crypto-dca-calculator',
    icon: '📆',
    title: 'Crypto DCA Calculator',
    short: 'Crypto DCA',
    description:
      'See what buying the same amount of Bitcoin, Ethereum or Solana every month would be worth today, from real monthly closing prices.',
    category: 'finance',
    updated: '2026-10-16',
  },
  {
    slug: 'crypto-tax-calculator',
    icon: '🧾',
    title: 'Crypto Gains & Tax Estimator (FIFO)',
    short: 'Crypto Gains (FIFO)',
    description:
      'Realized gain or loss on crypto sales with the FIFO method, fees included, and an estimated tax at your own rate.',
    category: 'finance',
    updated: '2026-10-16',
  },
  {
    slug: 'trading-fee-calculator',
    icon: '⚖️',
    title: 'Trading Fee & Spread Calculator',
    short: 'Fees & Spread',
    description:
      'Compare what fees and spreads really cost per trade and per year on up to three platforms.',
    category: 'finance',
    updated: '2026-10-16',
  },
  {
    slug: 'ai-subscription-vs-api',
    icon: '💳',
    title: 'AI Subscription vs API Cost Calculator',
    short: 'Subscription vs API',
    description:
      'Is a flat AI subscription or pay-per-use API cheaper for the way you use it? With dated official prices.',
    category: 'finance',
    updated: '2026-10-16',
  },
  {
    slug: 'loan-calculator',
    icon: '🏦',
    title: 'Loan Payment Calculator',
    short: 'Loan Payment',
    description:
      'Monthly payment, total interest and total cost of a fixed-rate loan.',
    category: 'finance',
    updated: '2026-10-16',
  },
  {
    slug: 'inflation-calculator',
    icon: '📉',
    title: 'Inflation & Purchasing Power Calculator',
    short: 'Inflation',
    description:
      'What things will cost in the future, and what your money will really be worth, at a given inflation rate.',
    category: 'finance',
    updated: '2026-10-16',
  },
  {
    slug: 'local-ai-calculator',
    icon: '🖥️',
    title: 'Can My Computer Run This AI Model?',
    short: 'Local AI Check',
    description:
      'Check whether a local AI model fits in your graphics card or system memory, from its size and quantization.',
    category: 'developer',
    updated: '2026-10-16',
  },
  {
    slug: 'gpu-hotspot-checker',
    icon: '🌡️',
    title: 'GPU Temperature & Hotspot Checker',
    short: 'GPU Hotspot',
    description:
      'Is the gap between your GPU temperature and hotspot normal? A verdict based on published Nvidia and AMD limits.',
    category: 'developer',
    updated: '2026-10-16',
  },

  // ---------- Nye 16/10-2026 aften (hold 2 og 3) ----------
  {
    slug: 'merge-pdf',
    icon: '📑',
    title: 'Merge PDF Files',
    short: 'Merge PDF',
    description:
      'Combine several PDF files into one, in the order you choose. Runs in your browser; nothing is uploaded.',
    category: 'developer',
    updated: '2026-10-16',
  },
  {
    slug: 'split-pdf',
    icon: '✂️',
    title: 'Split PDF',
    short: 'Split PDF',
    description:
      'Save a range of pages as a new PDF, or split every page into its own file. Nothing is uploaded.',
    category: 'developer',
    updated: '2026-10-16',
  },
  {
    slug: 'video-file-size-calculator',
    icon: '🎞️',
    title: 'Video File Size Calculator',
    short: 'Video File Size',
    description:
      'How big a video file will be from its length and bitrate, with YouTube’s recommended upload bitrates as presets.',
    category: 'media',
    updated: '2026-10-16',
  },
  {
    slug: 'upload-time-calculator',
    icon: '⏱️',
    title: 'Upload & Download Time Calculator',
    short: 'Upload Time',
    description:
      'How long a file takes to upload or download at your connection speed, with a realistic efficiency setting.',
    category: 'developer',
    updated: '2026-10-16',
  },
  {
    slug: 'pc-power-cost-calculator',
    icon: '🔌',
    title: 'PC Power Cost Calculator',
    short: 'PC Power Cost',
    description:
      'Energy use and running cost of a computer per month and year, from its wattage and your electricity price.',
    category: 'developer',
    updated: '2026-10-16',
  },
  {
    slug: 'storage-calculator',
    icon: '💾',
    title: 'Storage Space Calculator',
    short: 'Storage Space',
    description:
      'How many photos, videos or songs fit on a drive or card, and why 1 TB shows as 931 GB in Windows.',
    category: 'developer',
    updated: '2026-10-16',
  },
  {
    slug: 'quantum-speedup-calculator',
    icon: '⚛️',
    title: 'Quantum Speed-up Calculator',
    short: 'Quantum Speed-up',
    description:
      'How the state space grows with each qubit, and how many steps Grover’s search needs versus an ordinary computer.',
    category: 'developer',
    updated: '2026-10-16',
  },
];

// ---------- Opslag ----------

export const getCategory = (id: ToolCategoryId): ToolCategory =>
  TOOL_CATEGORIES.find((c) => c.id === id)!;

export const toolsInCategory = (id: ToolCategoryId): Tool[] =>
  TOOLS.filter((t) => t.category === id);

export const featuredTools = (): Tool[] => TOOLS.filter((t) => t.featured);

export const findTool = (slug: string): Tool | undefined =>
  TOOLS.find((t) => t.slug === slug);

// Sikkerhedsnet: hvis et værktøj får en kategori der ikke findes, opdager vi det
// under build i stedet for at siden bare taber værktøjet i stilhed.
const KNOWN = new Set(TOOL_CATEGORIES.map((c) => c.id));
for (const tool of TOOLS) {
  if (!KNOWN.has(tool.category)) {
    throw new Error(`Ukendt værktøjskategori "${tool.category}" på /tools/${tool.slug}`);
  }
}
