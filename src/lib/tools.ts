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
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'seo',
    slug: 'seo',
    icon: '🔎',
    name: 'SEO & Metadata',
    heading: 'Free SEO & Metadata Tools',
    description:
      'Free browser-based SEO tools: SERP preview, meta tags, Open Graph, JSON-LD schema, hreflang, robots.txt, slugs, and UTM links. No sign-up, nothing uploaded.',
    intro:
      'Everything here writes or checks the markup search engines actually read — the title Google shows, the card that appears when someone shares your link, the structured data that earns rich results. Each tool runs entirely in your browser, so nothing you paste is sent anywhere.',
    relatedTags: ['SEO', 'Business & Money'],
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
  },
  {
    id: 'developer',
    slug: 'developer',
    icon: '⚙️',
    name: 'Developer Tools',
    heading: 'Free Developer Tools',
    description:
      'Free developer utilities: JSON formatter and validator, Base64 and URL encoder, text diff, case converter, colour contrast checker, and a secure password generator.',
    intro:
      'The small utilities you reach for a dozen times a week. All of them run locally in the browser — your JSON, your tokens, and your passwords never leave the machine you are sitting at.',
    relatedTags: ['Coding', 'Automation'],
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
  },
  {
    id: 'finance',
    slug: 'finance',
    icon: '💰',
    name: 'Finance & Crypto',
    heading: 'Free Finance & Crypto Calculators',
    description:
      'Free calculators for compound growth and staking returns, crypto profit and ROI including fees, and AI token cost across GPT-4o, Claude, and Gemini.',
    intro:
      'Three calculators for the numbers that are easy to get wrong in your head: what compounding actually does over ten years, what a trade returned once fees are counted, and what a given prompt costs across the major AI models. Estimates for planning — not financial advice.',
    relatedTags: ['Fintech', 'Crypto', 'Business & Money'],
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
  },
  {
    slug: 'hreflang-generator',
    icon: '🌍',
    title: 'Hreflang Tags Generator',
    short: 'Hreflang Tags',
    description:
      'Generate valid hreflang link tags with x-default for multilingual and multi-regional sites.',
    category: 'seo',
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
      'Estimate token count and input cost for your text across GPT-4o, Claude, and Gemini models.',
    category: 'finance',
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
