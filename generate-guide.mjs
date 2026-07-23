import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hver guide er en hub-side om ét emne. "tag" styrer hvilke videoer der auto-hentes ind på siden.
// category bruges til farve-accent (samme palette som resten af sitet).
const GUIDES = [
  { title: 'The Ultimate Guide to AI Tools', slug: 'ultimate-guide-to-ai-tools', tag: 'AI & Tech', category: 'AI & Tech' },
  { title: 'The Ultimate Guide to SEO in the AI Era', slug: 'ultimate-guide-to-seo', tag: 'SEO', category: 'SEO' },
  { title: 'The Ultimate Guide to Workflow Automation', slug: 'ultimate-guide-to-automation', tag: 'Automation', category: 'Automation' },
  { title: 'The Ultimate Guide to AI Coding Assistants', slug: 'ultimate-guide-to-ai-coding', tag: 'Coding', category: 'Coding' },
  { title: 'The Ultimate Guide to Making Money with AI', slug: 'ultimate-guide-to-making-money-with-ai', tag: 'Business & Money', category: 'Business & Money' },
  { title: 'The Ultimate Guide to AI Video Tools', slug: 'ultimate-guide-to-ai-video', tag: 'AI Video', category: 'AI Video' },
  { title: 'The Ultimate Guide to AI Productivity', slug: 'ultimate-guide-to-ai-productivity', tag: 'Productivity', category: 'Productivity' },
  { title: 'The Ultimate Guide to Fintech', slug: 'ultimate-guide-to-fintech', tag: 'Fintech', category: 'Fintech' },
  { title: 'The Ultimate Guide to Crypto', slug: 'ultimate-guide-to-crypto', tag: 'Crypto', category: 'Crypto' },
];

// YAML-escape til dobbelt-anførte strenge (samme stil som add-video.mjs / generate-glossary.mjs).
function toYamlDoubleQuoted(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(guide) {
  return `You are the Lead Tech Analyst and Senior Journalist for Tech Feed Watch, a premium tech media outlet covering AI, Tech, FinTech, and Crypto with unbiased, high-quality journalism.

Write an original, evergreen "Ultimate Guide" hub article about the topic: "${guide.title}" (category: ${guide.category}). This page sits above a list of related videos, so write a standalone editorial guide about the TOPIC itself - never a summary of any single video.

Return EXACTLY in this format:
DESCRIPTION: One meta-description sentence, max 30 words, summarising the guide.
FAQ:
Generate exactly 4 frequently asked questions with concise answers. Format each strictly as:
Q: [question]
A: [answer, max 2 sentences]
CONTENT:
Write the guide body in markdown following these STRICT RULES:
1. 700-900 words.
2. Start directly with a 2-3 sentence intro paragraph - no title, no H1, no heading.
3. Use "## " for 4-6 H2 section headings.
4. Objective and practical. No hype, no marketing language, no product endorsements.
5. BANNED WORDS - never use: delve, tapestry, realm, navigate, landscape, testament, crucial, robust, demystify, unlock, unleash, elevate, seamless, paradigm shift, "in today's digital age", firstly, moreover, furthermore, "in conclusion".
6. Active voice. Mix short punchy sentences with longer analytical ones.
7. Add genuine value: context, comparisons, and practical judgement - do not just list things.
8. End with a short paragraph inviting the reader to use the videos below as a working reference.`;
}

function parseFaqs(faqBlock) {
  const faqs = [];
  const regex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=\n\s*Q:|$)/g;
  let m;
  while ((m = regex.exec(faqBlock)) !== null) {
    const question = m[1].replace(/\s+/g, ' ').trim();
    const answer = m[2].replace(/\s+/g, ' ').trim();
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

async function generateGuide(guide) {
  console.log(`\n→ Genererer: ${guide.title} [${guide.slug}]`);

  const prompt = buildPrompt(guide);
  const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
  const rawText = result.response.text();

  const descriptionMatch = rawText.match(/DESCRIPTION:\s*(.*)/i);
  const faqMatch = rawText.match(/FAQ:\s*([\s\S]*?)\s*CONTENT:/i);
  const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*)/i);

  const description = (descriptionMatch ? descriptionMatch[1] : '').replace(/\n/g, ' ').trim();
  const faqs = faqMatch ? parseFaqs(faqMatch[1]) : [];
  let content = contentMatch ? contentMatch[1].trim() : '';
  content = content.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();

  if (!description || !content || faqs.length === 0) {
    throw new Error(`Kunne ikke parse Gemini-svar for "${guide.title}". Rå output: ${rawText.slice(0, 300)}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  let frontmatter = '---\n';
  frontmatter += `title: ${toYamlDoubleQuoted(guide.title)}\n`;
  frontmatter += `slug: ${toYamlDoubleQuoted(guide.slug)}\n`;
  frontmatter += `description: ${toYamlDoubleQuoted(description)}\n`;
  frontmatter += `tags: [${toYamlDoubleQuoted(guide.tag)}]\n`;
  frontmatter += `category: ${toYamlDoubleQuoted(guide.category)}\n`;
  frontmatter += `date: ${toYamlDoubleQuoted(today)}\n`;
  frontmatter += 'faqs:\n';
  for (const f of faqs) {
    frontmatter += `  - question: ${toYamlDoubleQuoted(f.question)}\n`;
    frontmatter += `    answer: ${toYamlDoubleQuoted(f.answer)}\n`;
  }
  frontmatter += '---\n\n';

  const markdown = frontmatter + content + '\n';

  if (!fs.existsSync('./src/content/guides')) { fs.mkdirSync('./src/content/guides', { recursive: true }); }
  fs.writeFileSync(`./src/content/guides/${guide.slug}.md`, markdown);
  console.log(`✅ Skrevet: ${guide.slug}.md (${faqs.length} FAQs)`);
}

async function run() {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlySlug = onlyArg ? onlyArg.split('=')[1] : null;

  const guidesToRun = onlySlug ? GUIDES.filter((g) => g.slug === onlySlug) : GUIDES;

  if (onlySlug && guidesToRun.length === 0) {
    console.log(`❌ Ingen guide matcher slug "${onlySlug}". Tilgængelige: ${GUIDES.map((g) => g.slug).join(', ')}`);
    return;
  }

  console.log(`Genererer ${guidesToRun.length} guide(s)...`);
  console.log('ADVARSEL: dette overskriver eksisterende guide-filer med samme slug.');

  for (let i = 0; i < guidesToRun.length; i++) {
    try {
      await generateGuide(guidesToRun[i]);
    } catch (error) {
      console.log(`❌ Fejl ved "${guidesToRun[i].title}":`, error.message);
    }
    if (i < guidesToRun.length - 1) await sleep(2000);
  }

  console.log('\nFærdig.');
}

run();
