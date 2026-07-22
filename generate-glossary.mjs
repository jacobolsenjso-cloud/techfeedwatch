import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TERMS = [
  // AI
  { term: 'Large Language Model', category: 'AI' },
  { term: 'Machine Learning', category: 'AI' },
  { term: 'Neural Network', category: 'AI' },
  { term: 'Prompt Engineering', category: 'AI' },
  { term: 'Generative AI', category: 'AI' },
  { term: 'Fine-tuning', category: 'AI' },
  { term: 'Token', category: 'AI' },
  { term: 'Hallucination', category: 'AI' },
  { term: 'Retrieval-Augmented Generation', category: 'AI' },
  { term: 'Inference', category: 'AI' },
  // Tech
  { term: 'API', category: 'Tech' },
  { term: 'Cloud Computing', category: 'Tech' },
  { term: 'Open Source', category: 'Tech' },
  { term: 'Quantum Computing', category: 'Tech' },
  { term: 'Edge Computing', category: 'Tech' },
  // SEO
  { term: 'SEO', category: 'SEO' },
  { term: 'Core Web Vitals', category: 'SEO' },
  { term: 'Backlink', category: 'SEO' },
  { term: 'Schema Markup', category: 'SEO' },
  // Fintech
  { term: 'Neobank', category: 'Fintech' },
  { term: 'Open Banking', category: 'Fintech' },
  { term: 'Algorithmic Trading', category: 'Fintech' },
  // Crypto
  { term: 'Blockchain', category: 'Crypto' },
  { term: 'DeFi', category: 'Crypto' },
  { term: 'Smart Contract', category: 'Crypto' },
  { term: 'Staking', category: 'Crypto' },
  { term: 'Stablecoin', category: 'Crypto' },
  { term: 'NFT', category: 'Crypto' },
];

// Laver en URL-venlig slug ud fra et begreb: lowercase, uden accenter/specialtegn, bindestreg-separeret. Samme stil som add-video.mjs.
function slugify(term) {
  return term
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildPrompt(term, category) {
  return `You are writing a glossary entry for "Tech Feed Watch", a tech media outlet covering AI, Tech, SEO, Fintech, and Crypto.

Term: "${term}" (category: ${category})

Return EXACTLY in this format:
DEFINITION: A single, clear sentence defining the term.
EXPLANATION:
A 150-250 word explanation covering: what it is, why it matters, and one concrete real-world example.

STRICT RULES:
1. Objective, educational tone. No hype, no fluff, no marketing language.
2. Do not use banned words: delve, tapestry, realm, navigate, landscape, testament, crucial, robust, demystify, unlock, unleash, elevate, seamless, paradigm shift, "in today's digital age", firstly, moreover, furthermore, "in conclusion".
3. No headings, no bullet points, no markdown formatting in the explanation - plain prose paragraphs only.
4. Do not repeat the term as a title or heading.
5. Write in active voice, clear and direct.`;
}

// YAML-escape til dobbelt-anførte strenge (håndterer backslash og resterende anførselstegn). Samme stil som add-video.mjs.
function toYamlDoubleQuoted(str) {
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateTerm(term, category) {
  const slug = slugify(term);
  console.log(`\n→ Genererer: ${term} (${category}) [${slug}]`);

  const prompt = buildPrompt(term, category);
  const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
  const rawText = result.response.text();

  const definitionMatch = rawText.match(/DEFINITION:\s*(.*)/i);
  const explanationMatch = rawText.match(/EXPLANATION:\s*([\s\S]*)/i);

  const definition = (definitionMatch ? definitionMatch[1] : '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
  let explanation = explanationMatch ? explanationMatch[1].trim() : '';
  explanation = explanation.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();

  if (!definition || !explanation) {
    throw new Error(`Kunne ikke parse Gemini-svar for "${term}". Rå output: ${rawText.slice(0, 300)}`);
  }

  const markdown = `---\nterm: ${toYamlDoubleQuoted(term)}\nslug: ${toYamlDoubleQuoted(slug)}\ncategory: ${toYamlDoubleQuoted(category)}\ndefinition: ${toYamlDoubleQuoted(definition)}\n---\n\n${explanation}\n`;

  if (!fs.existsSync('./src/content/glossary')) { fs.mkdirSync('./src/content/glossary', { recursive: true }); }
  fs.writeFileSync(`./src/content/glossary/${slug}.md`, markdown);
  console.log(`✅ Skrevet: ${slug}.md`);
}

async function run() {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlySlug = onlyArg ? onlyArg.split('=')[1] : null;

  const termsToRun = onlySlug
    ? TERMS.filter((t) => slugify(t.term) === onlySlug)
    : TERMS;

  if (onlySlug && termsToRun.length === 0) {
    console.log(`❌ Intet begreb matcher slug "${onlySlug}".`);
    return;
  }

  console.log(`Genererer ${termsToRun.length} ordbogs-opslag...`);

  for (let i = 0; i < termsToRun.length; i++) {
    const { term, category } = termsToRun[i];
    try {
      await generateTerm(term, category);
    } catch (error) {
      console.log(`❌ Fejl ved "${term}":`, error.message);
    }

    if (i < termsToRun.length - 1) {
      await sleep(2000);
    }
  }

  console.log('\nFærdig.');
}

run();
