import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';

const ALLOWED_TAGS = ["AI & Tech", "SEO", "Automation", "Coding", "Business & Money", "AI Video", "Productivity", "Fintech", "Crypto"];

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const url = process.argv[2];
const videoId = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];

if (!videoId) {
  console.log("❌ Fejl: Indsæt et gyldigt YouTube-link.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let internalLinksContext = "";
if (fs.existsSync('./src/content/videos')) {
  const files = fs.readdirSync('./src/content/videos').filter(file => file.endsWith('.md'));
  if (files.length > 0) {
    const links = files.slice(-10).map(file => {
      const content = fs.readFileSync(`./src/content/videos/${file}`, 'utf-8');
      const titleMatch = content.match(/title:\s*"(.*?)"/);
      const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
      return `[${title}](/video/${file.replace('.md', '')})`;
    }).join('\n');
    internalLinksContext = `\nAVAILABLE INTERNAL LINKS:\n${links}\nCRITICAL INSTRUCTION: Naturally weave 4 to 5 of these internal links into your CONTENT section using standard Markdown format.`;
  }
}

async function run() {
  console.log(`Henter data for video: ${videoId}...`);
  
  try {
    let text = "";
    let duration = "0:00";
    let isShort = false;

    try {
      // PLAN A: Prøv at hente undertekster
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      text = transcript.map(t => t.text).join(' ');

      const lastT = transcript[transcript.length - 1];
      const totalSeconds = Math.floor(lastT.offset / 1000 + lastT.duration);
      isShort = totalSeconds <= 180;
      duration = formatDuration(totalSeconds);
    } catch (transcriptError) {
      console.log(`⚠️ Undertekster mangler for ${videoId}. Starter Plan B (Titel + Beskrivelse)...`);
      
      // PLAN B: Hent titel og beskrivelse via YouTube API
      const ytApiKey = process.env.YOUTUBE_API_KEY;
      if (!ytApiKey) throw new Error("Mangler YOUTUBE_API_KEY til Plan B.");
      
      const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${ytApiKey}`;
      const response = await fetch(ytUrl);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const snippet = data.items[0].snippet;
        const contentDetails = data.items[0].contentDetails;
        text = `Videotitel: ${snippet.title}\n\nVideobeskrivelse:\n${snippet.description}`;
        
        // Udregn varighed og afgør ud fra den om videoen er en Short
        if (contentDetails && contentDetails.duration) {
          const match = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const h = match[1] ? parseInt(match[1]) : 0;
          const m = match[2] ? parseInt(match[2]) : 0;
          const s = match[3] ? parseInt(match[3]) : 0;
          const totalSeconds = h * 3600 + m * 60 + s;
          isShort = totalSeconds <= 180;
          duration = formatDuration(totalSeconds);
        }
      } else {
        throw new Error("Kunne hverken hente undertekster eller videodata fra YouTube.");
      }
    }

    const prompt = `Act as an expert tech journalist and GEO (Generative Engine Optimization) specialist for "Tech Feed Watch". 
    Analyze this video content (either transcript or title/description) and provide a highly valuable, value-first article.
    
    Return EXACTLY in this format:
    TITLE: A highly engaging, click-worthy headline
    TAGS: Choose 1-2 tags that best fit the video, ONLY from this exact list: AI & Tech, SEO, Automation, Coding, Business & Money, AI Video, Productivity, Fintech, Crypto. Return them comma-separated, e.g. 'SEO, AI Video'. Do not invent new tags.
    SUMMARY: A sharp, analytical 3-4 sentence introduction or TL;DR.
    FAQ:
    Generate exactly 3-4 frequently asked questions with concise answers based on the video content. Format each strictly as:
    Q: [question]
    A: [answer]
    Each answer max 2 sentences. Do not use markdown links in the answers.
    CONTENT:
    Write a comprehensive, value-first article based on the video.
    
    CRITICAL STRUCTURE RULES FOR CONTENT:
    1. Break the text into clear, logical sections using strict Markdown headings '##' (H2) and '###' (H3).
    2. Use Markdown bullet points (-) and **bold text** for key terms.
    3. Keep paragraphs short and punchy.
    4. Ensure internal links are written strictly like this: [Link text](/video/slug).
    5. DU MÅ IKKE inkludere teksten 'Search Description' eller lignende metadata i toppen af artiklen. Start direkte med artiklens indhold.
    ${internalLinksContext}
    
    Video Content Data: ${text.substring(0, 20000)}`;

    const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
    const rawText = result.response.text();

    const titleMatch = rawText.match(/TITLE:\s*(.*)/i);
    const tagsMatch = rawText.match(/TAGS:\s*(.*)/i);
    const summaryMatch = rawText.match(/SUMMARY:\s*([\s\S]*?)(?=FAQ:|CONTENT:)/i);
    const faqMatch = rawText.match(/FAQ:\s*([\s\S]*?)(?=CONTENT:|$)/i);
    const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*)/i);

    const safeTitle = (titleMatch ? titleMatch[1] : "New Video").replace(/"/g, "'").replace(/\n/g, " ").trim();
    const rawTagsList = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
    const safeTags = rawTagsList.filter(t => ALLOWED_TAGS.includes(t));
    const finalTags = safeTags.length > 0 ? safeTags : ["AI & Tech"];
    const safeSummary = (summaryMatch ? summaryMatch[1] : "").replace(/"/g, "'").replace(/\n/g, " ").trim();

    // Saniter FAQ-tekst: fjern anførselstegn, klip markdown-links til bare teksten, trim
    function sanitizeFaqText(str) {
      return str
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/"/g, "'")
        .replace(/\n/g, ' ')
        .trim();
    }

    // YAML-escape til dobbelt-anførte strenge (håndterer backslash og resterende anførselstegn)
    function toYamlDoubleQuoted(str) {
      return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    const faqBlock = faqMatch ? faqMatch[1] : "";
    const faqs = [];
    const faqPairRegex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
    let faqPairMatch;
    while ((faqPairMatch = faqPairRegex.exec(faqBlock)) !== null) {
      const question = sanitizeFaqText(faqPairMatch[1]);
      const answer = sanitizeFaqText(faqPairMatch[2]);
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }

    let content = contentMatch ? contentMatch[1].trim() : "";
    content = content.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const date = new Date().toISOString().split('T')[0];

    const faqsYaml = faqs.length > 0
      ? "faqs:\n" + faqs.map(f => `  - question: ${toYamlDoubleQuoted(f.question)}\n    answer: ${toYamlDoubleQuoted(f.answer)}`).join('\n') + "\n"
      : "";

    const tagsYaml = "tags:\n" + finalTags.map(t => `  - ${toYamlDoubleQuoted(t)}`).join('\n') + "\n";

    const markdown = `---\ntitle: "${safeTitle}"\nyoutubeId: "${videoId}"\ndate: "${date}"\n${tagsYaml}summary: "${safeSummary}"\nduration: "${duration}"\nisShort: ${isShort}\n${faqsYaml}---\n\n${content}\n`;

    if (!fs.existsSync('./src/content/videos')) { fs.mkdirSync('./src/content/videos', { recursive: true }); }
    fs.writeFileSync(`./src/content/videos/${videoId}.md`, markdown);
    console.log(`✅ Succes! Fil oprettet med varighed (${duration}).`);
  } catch (error) {
    console.log("❌ Fejl:", error.message);
  }
}

run();