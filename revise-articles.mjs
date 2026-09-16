// revise-articles.mjs
// Genskriver BRØDTEKSTEN på gamle normale artikler med det nye 6-profil-system,
// så de matcher variationen i de nye artikler. Bevarer titel, slug/filnavn, dato,
// tags, youtubeId og duration - kun summary, faqs og content erstattes.
// Markerer hver færdig artikel med "revised: true", så genkørsler springer dem over.
//
// Brug:
//   node revise-articles.mjs --dry        (vis hvad der ville blive revideret, ingen skrivning)
//   node revise-articles.mjs              (revider de næste 50 ældste ikke-reviderede)
//   node revise-articles.mjs 25           (revider de næste 25)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';
import { GEMINI_MODEL } from './src/lib/model.mjs';

const ALLOWED_TAGS = ["AI & Tech", "SEO", "Automation", "Coding", "Business & Money", "AI Video", "Productivity", "Fintech", "Crypto"];
const DIR = './src/content/videos';

// --- Samme artikel-profiler som add-video.mjs (holdt i sync bevidst) ---
const ARTICLE_PROFILES = [
  { name: "Deep Analysis", min: 850, max: 1100, structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: 2-3 sentence executive summary (no heading, no label).
    - A short intro paragraph with a data-driven hook or a bold contrarian statement.
    - "## Key Takeaways" - 3-4 bullets with the most critical, non-obvious insights.
    - "## Technical Breakdown" - explain the core concepts objectively and clearly.
    - "## Why This Matters" - the concrete real-world impact on workflows, security, or industry.
    - "## What Others Missed" - unbiased breakdown of risks, limitations, costs, or unexpected angles.
    - "## The Verdict" - final objective assessment: passing trend or permanent shift?` },
  { name: "News Brief", min: 350, max: 550, structure: `STRUCTURE (keep it tight and punchy - this is a short news brief):
    - Opening: 1-2 sentence summary of what happened (no heading, no label).
    - Two or three short paragraphs covering the essentials and why they matter. Use at most one "## " subheading, or none.
    - "## The Bottom Line" - one tight closing paragraph with your read on it.` },
  { name: "Explainer", min: 550, max: 750, structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence plain-language summary (no heading, no label).
    - "## What It Is" - define the subject clearly for a smart non-expert.
    - "## How It Works" - the mechanics, explained simply and accurately.
    - "## Who It's For" - who benefits, and who does not.
    - "## The Bottom Line" - a short, practical takeaway.` },
  { name: "Editorial", min: 500, max: 750, structure: `STRUCTURE (an opinionated editorial - take a clear, reasoned stance while staying factually honest):
    - Opening: state your thesis or argument in 2-3 sentences (no heading, no label).
    - Two or three "## " sections that build the argument, with your own topic-specific headings.
    - "## Where This Lands" - a decisive editorial conclusion that commits to a view.` },
  { name: "Practical Q&A", min: 550, max: 750, structure: `STRUCTURE (a practical, reader-first piece):
    - Opening: a 2 sentence summary of the practical question at stake (no heading, no label).
    - Two or three "## " headings phrased as the real questions readers are asking.
    - "## What To Actually Do" - concrete, honest guidance.` },
  { name: "Context & Implications", min: 650, max: 900, structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence summary (no heading, no label).
    - "## The Background" - the context and history the source skipped over.
    - "## What Changed" - what is actually new or different here.
    - "## The Ripple Effects" - the second-order consequences across the industry.
    - "## What To Watch Next" - where this is heading and the signals to track.` },
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function toYamlDoubleQuoted(str) {
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sanitizeFaqText(str) {
  return str.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

// Minimal frontmatter-parser til de felter vi skal bevare
function parseFile(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const body = m[2];
  const get = (k) => {
    const mm = fm.match(new RegExp('^' + k + ':\\s*"?(.*?)"?\\s*$', 'm'));
    return mm ? mm[1].trim() : '';
  };
  // Tags
  const tags = [];
  let inTags = false;
  for (const ln of fm.split('\n')) {
    if (/^tags:/.test(ln)) { inTags = true; continue; }
    if (inTags) {
      const tm = ln.match(/^\s*-\s*"?(.*?)"?\s*$/);
      if (tm) tags.push(tm[1]); else inTags = false;
    }
  }
  return {
    fm, body,
    title: get('title'),
    youtubeId: get('youtubeId'),
    date: get('date'),
    duration: get('duration') || '0:00',
    isShort: /isShort:\s*true/.test(fm),
    revised: /revised:\s*true/.test(fm),
    tags: tags.filter(Boolean),
  };
}

// Hent kildetekst: A) undertekster, B) YouTube-beskrivelse, C) fald tilbage til eksisterende brødtekst
async function getSourceText(youtubeId, existingBody) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(youtubeId);
    const t = transcript.map(x => x.text).join(' ');
    if (t && t.length > 200) return { text: t, plan: 'A' };
  } catch (_) {}
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (key) {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${youtubeId}&key=${key}`);
      const d = await r.json();
      if (d.items && d.items.length > 0) {
        const s = d.items[0].snippet;
        return { text: `Video title: ${s.title}\n\nVideo description:\n${s.description}`, plan: 'B' };
      }
    }
  } catch (_) {}
  // Plan C: brug artiklens eksisterende tekst som kilde til omskrivning
  const stripped = existingBody.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  return { text: `Existing article on this topic (rewrite into a fresh, different structure - do not copy phrasing):\n${stripped}`, plan: 'C' };
}

function buildPrompt(sourceText, profile, targetWords, internalLinksContext) {
  return `You are the Lead Tech Analyst and Senior Journalist for Tech Feed Watch, a premium tech media outlet covering AI, Tech, FinTech, and Crypto with unbiased, high-quality journalism. Use this material only as a starting point and news hook - do NOT summarize it. Before writing, silently identify the core topic and the 3-5 key concepts/keywords it revolves around. Then write an original, independently-reasoned analysis of that TOPIC, adding genuine value the source does not provide, so the reader learns more than the source told them.

    Return EXACTLY in this format:
    SUMMARY: A sharp, analytical 3-4 sentence introduction or TL;DR.
    FAQ:
    Generate exactly 3-4 frequently asked questions with concise answers based on the topic. Format each strictly as:
    Q: [question]
    A: [answer]
    Each answer max 2 sentences. Do not use markdown links in the answers.
    CONTENT:
    Write the article following these STRICT RULES:
    1. Objectivity is mandatory - do not hype any product or technology.
    2. No author bio, greetings, sign-offs, or affiliate disclaimers.
    3. Do NOT start with an H1 or the video title (the page already shows the title). Start directly with a 2-3 sentence executive summary paragraph, no label.
    4. Avoid commodity/listicle filler unless backed by real analysis.
    5. BANNED WORDS - never use: delve, tapestry, realm, navigate, landscape, testament, crucial, robust, demystify, unlock, unleash, elevate, seamless, paradigm shift, "in today's digital age", firstly, moreover, furthermore, "in conclusion".
    6. Write with high burstiness: mix short punchy sentences with longer analytical ones. Active voice only.
    7. Aim for approximately ${targetWords} words.
    8. Never use filler like "in this video" or "the video discusses" - write as an independent editorial piece.
    9. Ensure internal links are written strictly like this: [Link text](/video/slug).
    10. ADD ORIGINAL VALUE beyond the source: include relevant context, history, comparisons to alternatives or competitors, or second-order implications - but only well-established, generally-known facts. Never fabricate statistics, quotes, dates, or events.
    11. Weave the core topic and its key concepts/keywords naturally into the H2 headings and the body so the piece ranks for what readers actually search - but never keyword-stuff or repeat awkwardly.

    This article MUST follow the "${profile.name}" format below - match its structure, length, and voice so it reads differently from a standard template.

    ${profile.structure}
    ${internalLinksContext}

    Source Material: ${sourceText.substring(0, 20000)}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const nArg = args.find(a => /^\d+$/.test(a));
  const LIMIT = nArg ? parseInt(nArg) : 50;

  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
  const candidates = [];
  for (const f of files) {
    const raw = fs.readFileSync(`${DIR}/${f}`, 'utf-8');
    const p = parseFile(raw);
    if (!p) continue;
    if (p.isShort) continue;      // Shorts har ingen brødtekst
    if (p.revised) continue;      // Allerede revideret
    if (!p.youtubeId) continue;
    candidates.push({ file: f, ...p });
  }
  // Ældste først (efter dato), så vi opdaterer det gamle indhold først
  candidates.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalNormal = files.filter(f => !/isShort:\s*true/.test(fs.readFileSync(`${DIR}/${f}`, 'utf-8'))).length;
  console.log(`Normale artikler i alt: ${totalNormal}`);
  console.log(`Endnu ikke revideret: ${candidates.length}`);
  console.log(`Behandler denne kørsel: ${Math.min(LIMIT, candidates.length)}`);

  if (dry) {
    candidates.slice(0, LIMIT).forEach((c, i) => console.log(`  ${i + 1}. [${c.date}] ${c.file}`));
    console.log('\n(--dry: intet skrevet)');
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // Interne links: de 10 nyeste artikler (samme mønster som add-video.mjs)
  const linkFiles = files.slice(-10);
  const links = linkFiles.map(f => {
    const c = fs.readFileSync(`${DIR}/${f}`, 'utf-8');
    const tm = c.match(/title:\s*"(.*?)"/);
    return `[${tm ? tm[1] : f.replace('.md', '')}](/video/${f.replace('.md', '')})`;
  }).join('\n');
  const internalLinksContext = `\nAVAILABLE INTERNAL LINKS:\n${links}\nCRITICAL INSTRUCTION: Naturally weave 4 to 5 of these internal links into your CONTENT section using standard Markdown format.`;

  const batch = candidates.slice(0, LIMIT);
  let ok = 0, fail = 0;
  for (let i = 0; i < batch.length; i++) {
    const c = batch[i];
    const label = `[${i + 1}/${batch.length}] ${c.file}`;
    try {
      const { text, plan } = await getSourceText(c.youtubeId, c.body);
      const ph = hashString(c.youtubeId);
      const profile = ARTICLE_PROFILES[ph % ARTICLE_PROFILES.length];
      const targetWords = profile.min + (Math.floor(ph / ARTICLE_PROFILES.length) % (profile.max - profile.min + 1));

      const prompt = buildPrompt(text, profile, targetWords, internalLinksContext);
      const result = await model.generateContent(prompt);
      const rawOut = result.response.text();

      const summaryMatch = rawOut.match(/SUMMARY:\s*([\s\S]*?)(?=FAQ:|CONTENT:|$)/i);
      const faqMatch = rawOut.match(/FAQ:\s*([\s\S]*?)(?=CONTENT:|$)/i);
      const contentMatch = rawOut.match(/CONTENT:\s*([\s\S]*)/i);

      const newSummary = (summaryMatch ? summaryMatch[1] : c.body).replace(/"/g, "'").replace(/\n/g, ' ').trim();
      let content = contentMatch ? contentMatch[1].trim() : '';
      content = content.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();

      if (!content || content.length < 200) {
        console.log(`  ⚠️ ${label}: tomt/for kort svar - springer over (uændret)`);
        fail++;
        continue;
      }

      const faqs = [];
      const faqBlock = faqMatch ? faqMatch[1] : '';
      const faqPairRegex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
      let fp;
      while ((fp = faqPairRegex.exec(faqBlock)) !== null) {
        const q = sanitizeFaqText(fp[1]); const a = sanitizeFaqText(fp[2]);
        if (q && a) faqs.push({ question: q, answer: a });
      }

      const finalTags = (c.tags.filter(t => ALLOWED_TAGS.includes(t)));
      const tagsYaml = 'tags:\n' + (finalTags.length ? finalTags : ['AI & Tech']).map(t => `  - ${toYamlDoubleQuoted(t)}`).join('\n') + '\n';
      const faqsYaml = faqs.length > 0
        ? 'faqs:\n' + faqs.map(f => `  - question: ${toYamlDoubleQuoted(f.question)}\n    answer: ${toYamlDoubleQuoted(f.answer)}`).join('\n') + '\n'
        : '';

      const md = `---\ntitle: "${c.title.replace(/"/g, "'")}"\nyoutubeId: "${c.youtubeId}"\ndate: "${c.date}"\n${tagsYaml}summary: "${newSummary}"\nduration: "${c.duration}"\nisShort: false\nrevised: true\n${faqsYaml}---\n\n${content}\n`;
      fs.writeFileSync(`${DIR}/${c.file}`, md);
      console.log(`  ✅ ${label}  (${profile.name}, kilde ${plan})`);
      ok++;
    } catch (err) {
      console.log(`  ❌ ${label}: ${err.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 2500)); // skån API-raten
  }

  console.log(`\nFærdig. Revideret: ${ok}  Fejlet/sprunget over: ${fail}  Tilbage bagefter: ${candidates.length - ok}`);
}

main();
