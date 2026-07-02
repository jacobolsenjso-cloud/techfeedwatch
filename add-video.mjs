import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';

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
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = transcript.map(t => t.text).join(' ');
    
    // BEREGNER LÆNGDE UD FRA SIDSTE UNDERTEKST
    const lastT = transcript[transcript.length - 1];
    const totalSeconds = Math.floor(lastT.offset / 1000 + lastT.duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const duration = isShort ? "Short" : `${minutes}:${seconds}`;

    // --- NY GEO OPTIMERET MASTER PROMPT ---
    const prompt = `Act as an expert tech journalist and GEO (Generative Engine Optimization) specialist for "Tech Feed Watch". 
    Analyze this video transcript and provide a highly valuable, value-first article.
    
    Return EXACTLY in this format:
    TITLE: A highly engaging, click-worthy headline
    TAG: AI & Tech
    SUMMARY: A sharp, analytical 3-4 sentence introduction or TL;DR.
    CONTENT:
    Write a comprehensive, value-first article based on the video.
    
    CRITICAL STRUCTURE RULES FOR CONTENT:
    1. Break the text into clear, logical sections using strict Markdown headings '##' (H2) and '###' (H3). This is MANDATORY for our automated Table of Contents. Do not use HTML tags.
    2. Use Markdown bullet points (-) and **bold text** for key terms to ensure "Agentic Accessibility".
    3. Keep paragraphs short and punchy.
    4. Ensure internal links are written strictly like this: [Link text](/video/slug) with no invisible slashes or spaces.
    5. DU MÅ IKKE inkludere teksten 'Search Description' eller lignende metadata i toppen af artiklen. Start direkte med artiklens indhold.
    ${internalLinksContext}
    
    Transcript: ${text.substring(0, 20000)}`;

    const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
    const rawText = result.response.text();

    const titleMatch = rawText.match(/TITLE:\s*(.*)/i);
    const tagMatch = rawText.match(/TAG:\s*(.*)/i);
    // RETTELSE 1: Fanger nu hele summary-blokken, selvom Gemini laver linjeskift
    const summaryMatch = rawText.match(/SUMMARY:\s*([\s\S]*?)(?=CONTENT:)/i);
    const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*)/i);

    // RETTELSE 2: Fjerner linebreaks (\n) fra metadata for at forhindre YAML frontmatter crashes
    const safeTitle = (titleMatch ? titleMatch[1] : "New Video").replace(/"/g, "'").replace(/\n/g, " ").trim();
    const safeTag = (tagMatch ? tagMatch[1] : "AI").replace(/"/g, "'").replace(/\n/g, "").trim();
    const safeSummary = (summaryMatch ? summaryMatch[1] : "").replace(/"/g, "'").replace(/\n/g, " ").trim();
    
    // RETTELSE 3: Stripper skjulte kodeblok-tegn væk
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