import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';

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

const isShort = url.includes('/shorts/');
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
    let duration = isShort ? "Short" : "0:00";

    try {
      // PLAN A: Prøv at hente undertekster
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      text = transcript.map(t => t.text).join(' ');
      
      const lastT = transcript[transcript.length - 1];
      const totalSeconds = Math.floor(lastT.offset / 1000 + lastT.duration);
      duration = isShort ? "Short" : formatDuration(totalSeconds);
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
        
        // Udregn varighed, hvis det ikke er en Short
        if (!isShort && contentDetails && contentDetails.duration) {
          const match = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const h = match[1] ? parseInt(match[1]) : 0;
          const m = match[2] ? parseInt(match[2]) : 0;
          const s = match[3] ? parseInt(match[3]) : 0;
          const totalSeconds = h * 3600 + m * 60 + s;
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
    TAG: AI & Tech
    SUMMARY: A sharp, analytical 3-4 sentence introduction or TL;DR.
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
    const tagMatch = rawText.match(/TAG:\s*(.*)/i);
    const summaryMatch = rawText.match(/SUMMARY:\s*([\s\S]*?)(?=CONTENT:)/i);
    const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*)/i);

    const safeTitle = (titleMatch ? titleMatch[1] : "New Video").replace(/"/g, "'").replace(/\n/g, " ").trim();
    const safeTag = (tagMatch ? tagMatch[1] : "AI").replace(/"/g, "'").replace(/\n/g, "").trim();
    const safeSummary = (summaryMatch ? summaryMatch[1] : "").replace(/"/g, "'").replace(/\n/g, " ").trim();
    
    let content = contentMatch ? contentMatch[1].trim() : "";
    content = content.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();
    
    const date = new Date().toISOString().split('T')[0];
    
    const markdown = `---\ntitle: "${safeTitle}"\nyoutubeId: "${videoId}"\ndate: "${date}"\ntag: "${safeTag}"\nsummary: "${safeSummary}"\nduration: "${duration}"\nisShort: ${isShort}\n---\n\n${content}\n`;

    if (!fs.existsSync('./src/content/videos')) { fs.mkdirSync('./src/content/videos', { recursive: true }); }
    fs.writeFileSync(`./src/content/videos/${videoId}.md`, markdown);
    console.log(`✅ Succes! Fil oprettet med varighed (${duration}).`);
  } catch (error) {
    console.log("❌ Fejl:", error.message);
  }
}

run();