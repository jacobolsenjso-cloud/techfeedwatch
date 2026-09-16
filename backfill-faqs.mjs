import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';
import { GEMINI_MODEL } from './src/lib/model.mjs';

const VIDEOS_DIR = './src/content/videos';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Kun rette én bestemt fil? Kør: node backfill-faqs.mjs VIDEOID
const onlyId = process.argv[2] || null;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ---- Samme sanitering/escaping som add-video.mjs (skal matche 1:1) ----
function sanitizeFaqText(str) {
  return str
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/"/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}
function toYamlDoubleQuoted(str) {
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getText(videoId) {
  // PLAN A: undertekster
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(t => t.text).join(' ');
  } catch {
    // PLAN B: titel + beskrivelse via YouTube API
    if (!YOUTUBE_API_KEY) throw new Error("Mangler YOUTUBE_API_KEY til Plan B.");
    const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(ytUrl);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const s = data.items[0].snippet;
      return `Videotitel: ${s.title}\n\nVideobeskrivelse:\n${s.description}`;
    }
    throw new Error("Kunne hverken hente undertekster eller videodata.");
  }
}

async function generateFaqs(text) {
  const prompt = `Based on the following video content, generate exactly 3-4 frequently asked questions with concise answers.
Format each strictly as:
Q: [question]
A: [answer]
Each answer max 2 sentences. Do not use markdown links in the answers. Return only the Q/A pairs, nothing else.

Video Content Data: ${text.substring(0, 20000)}`;

  const result = await genAI.getGenerativeModel({ model: GEMINI_MODEL }).generateContent(prompt);
  const rawText = result.response.text();

  const faqs = [];
  const faqPairRegex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
  let m;
  while ((m = faqPairRegex.exec(rawText)) !== null) {
    const question = sanitizeFaqText(m[1]);
    const answer = sanitizeFaqText(m[2]);
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

function buildFaqsYaml(faqs) {
  return "faqs:\n" + faqs.map(f =>
    `  - question: ${toYamlDoubleQuoted(f.question)}\n    answer: ${toYamlDoubleQuoted(f.answer)}`
  ).join('\n') + "\n";
}

async function backfill() {
  if (!GEMINI_API_KEY) { console.error("Fejl: GEMINI_API_KEY er ikke sat!"); process.exit(1); }
  if (!fs.existsSync(VIDEOS_DIR)) { console.error(`Fejl: ${VIDEOS_DIR} findes ikke.`); process.exit(1); }

  let files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  if (onlyId) files = files.filter(f => f === `${onlyId}.md`);

  const toProcess = [];
  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');
    const isShort = /isShort:\s*true/.test(content);
    const hasFaqs = /^faqs:/m.test(content);
    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);
    const youtubeId = idMatch ? idMatch[1] : null;

    if (isShort) continue;          // Shorts skal ikke have FAQ
    if (hasFaqs) continue;          // Allerede FAQ -> spring over (idempotent)
    if (!youtubeId) continue;
    toProcess.push({ file, path, content, youtubeId });
  }

  console.log(`Info: ${files.length} filer gennemgået. ${toProcess.length} mangler FAQ og behandles.`);
  if (toProcess.length === 0) { console.log("Intet at gøre."); return; }

  let done = 0, failed = 0;
  for (const video of toProcess) {
    try {
      const text = await getText(video.youtubeId);
      const faqs = await generateFaqs(text);
      if (faqs.length === 0) {
        console.log(`Sprang over ${video.file}: ingen FAQ genereret.`);
        failed++;
        await sleep(2000);
        continue;
      }

      // Indsæt faqs-blok lige før den afsluttende --- i frontmatter.
      // Frontmatter er alt mellem første "---\n" og næste "\n---".
      const fmEnd = video.content.indexOf('\n---', 4);
      if (fmEnd === -1) {
        console.log(`Sprang over ${video.file}: kunne ikke finde frontmatter-slut.`);
        failed++;
        continue;
      }
      const before = video.content.slice(0, fmEnd + 1); // til og med \n før ---
      const after = video.content.slice(fmEnd + 1);     // fra --- og resten
      const updated = before + buildFaqsYaml(faqs) + after;

      fs.writeFileSync(video.path, updated);
      console.log(`OK ${video.file} -> ${faqs.length} FAQ`);
      done++;
      await sleep(2000); // pause mod rate limits
    } catch (err) {
      console.error(`Fejl ved ${video.file}: ${err.message}`);
      failed++;
      await sleep(3000);
    }
  }

  console.log(`\nFaerdig. ${done} filer fik FAQ, ${failed} fejlede/sprunget over.`);
}

backfill();
