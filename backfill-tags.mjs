import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';
import { GEMINI_MODEL } from './src/lib/model.mjs';

const VIDEOS_DIR = './src/content/videos';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const ALLOWED_TAGS = ["AI & Tech", "SEO", "Automation", "Coding", "Business & Money", "AI Video", "Productivity", "Fintech", "Crypto"];

// Kør på én fil: node backfill-tags.mjs VIDEOID
const onlyId = process.argv[2] || null;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function toYamlDoubleQuoted(str) {
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getText(videoId, existingTitle, existingSummary) {
  // Prøv undertekster; ellers fald tilbage til titel+summary vi allerede har i filen
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(t => t.text).join(' ');
  } catch {
    if (YOUTUBE_API_KEY) {
      try {
        const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(ytUrl);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const s = data.items[0].snippet;
          return `Videotitel: ${s.title}\n\nVideobeskrivelse:\n${s.description}`;
        }
      } catch {}
    }
    // Sidste udvej: brug titel + summary fra selve markdown-filen
    return `Title: ${existingTitle}\n\nSummary: ${existingSummary}`;
  }
}

async function chooseTags(text) {
  const prompt = `Based on the following video content, choose 1-2 tags that best fit it.
ONLY choose from this exact list: ${ALLOWED_TAGS.join(', ')}.
Return them comma-separated, e.g. "SEO, AI Video". Do not invent new tags. Return only the tags, nothing else.

Video Content Data: ${text.substring(0, 20000)}`;

  const result = await genAI.getGenerativeModel({ model: GEMINI_MODEL }).generateContent(prompt);
  const raw = result.response.text();
  const chosen = raw.split(',').map(t => t.trim()).filter(t => ALLOWED_TAGS.includes(t));
  return chosen.length > 0 ? chosen : ["AI & Tech"];
}

function buildTagsYaml(tags) {
  return "tags:\n" + tags.map(t => `  - ${toYamlDoubleQuoted(t)}`).join('\n') + "\n";
}

async function backfill() {
  if (!GEMINI_API_KEY) { console.error("Fejl: GEMINI_API_KEY er ikke sat!"); process.exit(1); }

  let files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.md'));
  if (onlyId) files = files.filter(f => f === `${onlyId}.md`);

  const toProcess = [];
  for (const file of files) {
    const path = `${VIDEOS_DIR}/${file}`;
    const content = fs.readFileSync(path, 'utf-8');
    const hasTagsArray = /^tags:/m.test(content);   // allerede nyt array-format
    const idMatch = content.match(/youtubeId:\s*"(.*?)"/);
    const titleMatch = content.match(/title:\s*"(.*?)"/);
    const summaryMatch = content.match(/summary:\s*"([\s\S]*?)"/);
    const youtubeId = idMatch ? idMatch[1] : null;

    if (hasTagsArray) continue;          // Allerede array -> spring over (idempotent)
    if (!youtubeId) continue;

    toProcess.push({
      file, path, content, youtubeId,
      title: titleMatch ? titleMatch[1] : "",
      summary: summaryMatch ? summaryMatch[1] : ""
    });
  }

  console.log(`Info: ${files.length} filer gennemgået. ${toProcess.length} skal re-tagges.`);
  if (toProcess.length === 0) { console.log("Intet at gøre."); return; }

  let done = 0, failed = 0;
  for (const v of toProcess) {
    try {
      const text = await getText(v.youtubeId, v.title, v.summary);
      const tags = await chooseTags(text);

      // Erstat den gamle 'tag: "..."'-linje med et 'tags:'-array
      let updated;
      if (/^tag:\s*".*?"\s*$/m.test(v.content)) {
        updated = v.content.replace(/^tag:\s*".*?"\s*$/m, buildTagsYaml(tags).trimEnd());
      } else {
        // Ingen tag-linje fundet: indsæt tags efter date-linjen
        updated = v.content.replace(/(date:\s*".*?"\s*)/, `$1\n${buildTagsYaml(tags).trimEnd()}\n`);
      }

      fs.writeFileSync(v.path, updated);
      console.log(`OK ${v.file} -> ${tags.join(', ')}`);
      done++;
      await sleep(2000);
    } catch (err) {
      console.error(`Fejl ved ${v.file}: ${err.message}`);
      failed++;
      await sleep(3000);
    }
  }

  console.log(`\nFaerdig. ${done} filer re-tagget, ${failed} fejlede.`);
}

backfill();
