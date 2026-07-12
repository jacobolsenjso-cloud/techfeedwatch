import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';

const VIDEOS_DIR = './src/content/videos';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Kør på én fil: node backfill-deep-articles.mjs VIDEOID
const onlyId = process.argv[2] || null;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function sanitizeFaqText(str) {
  return str.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/"/g, "'").replace(/\n/g, ' ').trim();
}
function toYamlDoubleQuoted(str) {
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getText(videoId, existingTitle) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(t => t.text).join(' ');
  } catch {
    if (YOUTUBE_API_KEY) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items?.length) {
          const s = data.items[0].snippet;
          return `Title: ${s.title}\n\nDescription:\n${s.description}`;
        }
      } catch {}
    }
    return `Title: ${existingTitle}`;
  }
}

async function generateArticleAndFaqs(text, title) {
  const prompt = `You are a senior tech editor for a publication covering AI, tech, fintech, and crypto.
Write an original, analytical article of at least 600-800 words based on the following source material about "${title}".

Rules:
1. Do not transcribe or recap chronologically. Write as an editor who ANALYZES the topic, adding your own angle and interpretation.
2. Provide context: why this matters in the broader tech/AI/fintech/crypto landscape.
3. Structure with several "## " H2 headings.
4. Include a "## Key Takeaways" section with 3-5 concise bullet points.
5. End with a short editorial perspective/assessment.
6. Never use filler like "in this video" or "the video discusses" - write as an independent editorial piece in natural language.

After the article, on a new line write "FAQ:" and then generate exactly 3-4 frequently asked questions with concise answers. Format each strictly as:
Q: [question]
A: [answer]
Each answer max 2 sentences. No markdown links in answers.

Output format:
CONTENT:
[the full article in markdown]
FAQ:
Q: ...
A: ...

Source material: ${text.substring(0, 20000)}`;

  const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
  const rawText = result.response.text();

  const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*?)(?=FAQ:|$)/i);
  const faqSection = rawText.match(/FAQ:\s*([\s\S]*)/i);

  const article = contentMatch ? contentMatch[1].trim() : rawText.trim();

  const faqs = [];
  if (faqSection) {
    const faqPairRegex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
    let m;
    while ((m = faqPairRegex.exec(faqSection[1])) !== null) {
      const q = sanitizeFaqText(m[1]);
      const a = sanitizeFaqText(m[2]);
      if (q && a) faqs.push({ question: q, answer: a });
    }
  }
  return { article, faqs };
}

function buildFaqsYaml(faqs) {
  if (faqs.length === 0) return "";
  return "faqs:\n" + faqs.map(f =>
    `  - question: ${toYamlDoubleQuoted(f.question)}\n    answer: ${toYamlDoubleQuoted(f.answer)}`
  ).join('\n') + "\n";
}

// Finder start/slut (linje-index, slut eksklusiv) for hver "faqs:"-blok i frontmatterens linjer.
// En blok er linjen "faqs:" plus alle efterfølgende linjer der starter med to mellemrum.
function findFaqBlocks(lines) {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^faqs:$/.test(lines[i])) {
      let end = i + 1;
      while (end < lines.length && lines[end].startsWith('  ')) {
        end++;
      }
      blocks.push({ start: i, end });
    }
  }
  return blocks;
}

// Fjerner ALLE faqs-blokke fra frontmatterens linjer (bruges før en ny faqs-blok tilføjes,
// så der aldrig opstår to "faqs:"-nøgler og brækker YAML-parsingen).
function removeAllFaqBlocks(lines) {
  const blocks = findFaqBlocks(lines);
  if (blocks.length === 0) return lines;

  const newLines = [];
  let i = 0;
  while (i < lines.length) {
    const block = blocks.find(b => b.start === i);
    if (block) {
      i = block.end; // spring hele blokken over
      continue;
    }
    newLines.push(lines[i]);
    i++;
  }
  return newLines;
}

async function backfill() {
  if (!GEMINI_API_KEY) { console.error("Fejl: GEMINI_API_KEY er ikke sat!"); process.exit(1); }

  let files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  if (onlyId) files = files.filter(f => f === `${onlyId}.md`);

  const toProcess = [];
  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');
    if (/isShort:\s*true/.test(content)) continue; // Kun normale videoer
    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);
    const titleMatch = content.match(/title:\s*"(.*?)"/);
    if (!idMatch) continue;
    toProcess.push({ file, path, content, youtubeId: idMatch[1], title: titleMatch ? titleMatch[1] : "" });
  }

  console.log(`Info: ${files.length} filer. ${toProcess.length} normale videoer regenereres.`);
  if (toProcess.length === 0) { console.log("Intet at gøre."); return; }

  let done = 0, failed = 0;
  for (const v of toProcess) {
    try {
      const text = await getText(v.youtubeId, v.title);
      const { article, faqs } = await generateArticleAndFaqs(text, v.title);
      if (!article || article.length < 200) {
        console.log(`Sprang over ${v.file}: for kort artikel genereret.`);
        failed++;
        await sleep(2000);
        continue;
      }

      // Filer kan ligge som CRLF på disk (Windows-checkout); normaliser til LF for parsingen
      // og konverter tilbage ved skrivning hvis filen brugte det.
      const usesCRLF = v.content.includes('\r\n');
      const normalized = usesCRLF ? v.content.replace(/\r\n/g, '\n') : v.content;

      // Frontmatter er alt mellem første "---" og næste "\n---".
      const fmEnd = normalized.indexOf('\n---', 4);
      if (fmEnd === -1) { console.log(`Sprang over ${v.file}: ingen frontmatter-slut.`); failed++; continue; }

      // Fjern ALLE eksisterende faqs-blokke linje-for-linje, FØR den nye tilføjes -
      // forhindrer at der nogensinde opstår to "faqs:"-nøgler.
      let frontmatterLines = normalized.slice(4, fmEnd).split('\n');
      frontmatterLines = removeAllFaqBlocks(frontmatterLines);
      while (frontmatterLines.length && frontmatterLines[frontmatterLines.length - 1] === '') {
        frontmatterLines.pop();
      }
      const frontmatter = frontmatterLines.join('\n');
      const newFaqsYaml = buildFaqsYaml(faqs);

      let newFile = `---\n${frontmatter}\n${newFaqsYaml}---\n\n${article}\n`;
      if (usesCRLF) newFile = newFile.replace(/\n/g, '\r\n');
      fs.writeFileSync(v.path, newFile);
      console.log(`OK ${v.file} -> ${article.length} tegn, ${faqs.length} FAQ`);
      done++;
      await sleep(2500);
    } catch (err) {
      console.error(`Fejl ved ${v.file}: ${err.message}`);
      failed++;
      await sleep(3000);
    }
  }

  console.log(`\nFaerdig. ${done} regenereret, ${failed} fejlede.`);
}

backfill();
