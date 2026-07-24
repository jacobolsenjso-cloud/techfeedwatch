import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import 'dotenv/config';
import { generateOgCard } from './og-card.mjs';

const ALLOWED_TAGS = ["AI & Tech", "SEO", "Automation", "Coding", "Business & Money", "AI Video", "Productivity", "Fintech", "Crypto"];

// Artikel-profiler: hver normal video roterer gennem én af disse, valgt deterministisk ud fra video-ID.
// Formålet er at bryde ensartetheden (samme struktur/længde = "masseproduceret"-signal hos Google).
// Format-kontrakten (TITLE/TAGS/SUMMARY/FAQ/CONTENT) og banned-words gælder stadig for alle profiler.
const ARTICLE_PROFILES = [
  {
    name: "Deep Analysis",
    min: 850, max: 1100,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: 2-3 sentence executive summary (no heading, no label).
    - A short intro paragraph with a data-driven hook or a bold contrarian statement.
    - "## Key Takeaways" - 3-4 bullets with the most critical, non-obvious insights.
    - "## Technical Breakdown" - explain the core concepts objectively and clearly.
    - "## Why This Matters" - the concrete real-world impact on workflows, security, or industry.
    - "## What Others Missed" - unbiased breakdown of risks, limitations, costs, or unexpected angles.
    - "## The Verdict" - final objective assessment: passing trend or permanent shift?`
  },
  {
    name: "News Brief",
    min: 350, max: 550,
    structure: `STRUCTURE (keep it tight and punchy - this is a short news brief):
    - Opening: 1-2 sentence summary of what happened (no heading, no label).
    - Two or three short paragraphs covering the essentials and why they matter. Use at most one "## " subheading, or none.
    - "## The Bottom Line" - one tight closing paragraph with your read on it.`
  },
  {
    name: "Explainer",
    min: 550, max: 750,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence plain-language summary (no heading, no label).
    - "## What It Is" - define the subject clearly for a smart non-expert.
    - "## How It Works" - the mechanics, explained simply and accurately.
    - "## Who It's For" - who benefits, and who does not.
    - "## The Bottom Line" - a short, practical takeaway.`
  },
  {
    name: "Editorial",
    min: 500, max: 750,
    structure: `STRUCTURE (an opinionated editorial - take a clear, reasoned stance while staying factually honest):
    - Opening: state your thesis or argument in 2-3 sentences (no heading, no label).
    - Two or three "## " sections that build the argument, with your own topic-specific headings.
    - "## Where This Lands" - a decisive editorial conclusion that commits to a view.`
  },
  {
    name: "Practical Q&A",
    min: 550, max: 750,
    structure: `STRUCTURE (a practical, reader-first piece):
    - Opening: a 2 sentence summary of the practical question at stake (no heading, no label).
    - Two or three "## " headings phrased as the real questions readers are asking.
    - "## What To Actually Do" - concrete, honest guidance.`
  },
  {
    name: "Context & Implications",
    min: 650, max: 900,
    structure: `STRUCTURE (use ## for each H2 heading):
    - Opening: a 2 sentence summary (no heading, no label).
    - "## The Background" - the context and history the source skipped over.
    - "## What Changed" - what is actually new or different here.
    - "## The Ripple Effects" - the second-order consequences across the industry.
    - "## What To Watch Next" - where this is heading and the signals to track.`
  },
];

// Stabil hash af en streng, så profil-valg og længde er deterministisk pr. video (samme video = samme profil).
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Laver en URL-venlig slug ud fra en titel: lowercase, uden accenter/specialtegn, bindestreg-separeret.
const SLUG_MAX_LENGTH = 70;

function slugify(title) {
  const raw = title
    // æ/ø/œ/ß har ingen NFKD-dekomposition (i modsætning til fx é/å), så de translittereres eksplicit her
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .replace(/ø/gi, 'o')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // fjerner resterende accenter (é -> e, å -> a, osv.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (raw.length <= SLUG_MAX_LENGTH) return raw;

  // Klip ved sidste hele bindestreg-adskilte del inden for grænsen, så vi aldrig skærer midt i et ord.
  // Findes ingen bindestreg inden for grænsen (ét langt ord), falder vi tilbage til det hårde snit.
  const hardCut = raw.slice(0, SLUG_MAX_LENGTH);
  const lastHyphen = hardCut.lastIndexOf('-');
  const wholeWordCut = lastHyphen > 0 ? hardCut.slice(0, lastHyphen) : '';

  return (wholeWordCut || hardCut).replace(/-+$/g, '');
}

// Gør en slug unik hvis den allerede er brugt af en ANDEN video (samme youtubeId genbruger blot filen).
function resolveUniqueSlug(baseSlug, videoId) {
  const dir = './src/content/videos';
  const readExistingId = (path) => {
    const content = fs.readFileSync(path, 'utf-8');
    const match = content.match(/youtubeId:\s*"(.*?)"/);
    return match ? match[1] : null;
  };

  let candidate = baseSlug;
  let candidatePath = `${dir}/${candidate}.md`;
  if (!fs.existsSync(candidatePath) || readExistingId(candidatePath) === videoId) {
    return candidate;
  }

  // Kollision med en anden video: tilføj et kort, deterministisk suffiks fra videoId'et
  const suffix = videoId.slice(0, 6).toLowerCase();
  candidate = `${baseSlug}-${suffix}`;
  candidatePath = `${dir}/${candidate}.md`;

  let attempt = 1;
  while (fs.existsSync(candidatePath) && readExistingId(candidatePath) !== videoId) {
    attempt++;
    candidate = `${baseSlug}-${suffix}-${attempt}`;
    candidatePath = `${dir}/${candidate}.md`;
  }

  return candidate;
}

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
    let youtubeTitle = null;

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
        youtubeTitle = snippet.title;

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

    // Sprogtjek: kasser videoen FØR den dyre artikel-prompt, hvis den ikke er på engelsk
    const langCheckPrompt = [
      "Answer with only one word: YES or NO. Is BOTH the spoken content and the title of this video primarily in English?",
      ...(youtubeTitle ? [`Title: ${youtubeTitle}`] : []),
      `Content: ${text.substring(0, 1500)}`
    ].join('\n');

    const langResult = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(langCheckPrompt);
    const langAnswer = langResult.response.text().trim();
    console.log("Sprogtjek-svar:", langAnswer);

    const cleanedLangAnswer = langAnswer.replace(/[*.]/g, '').trim();

    if (cleanedLangAnswer.toUpperCase() !== "YES") {
      console.log(`Sprunget over: video er ikke på engelsk (${videoId})`);
      return;
    }

    // Vælg artikel-profil deterministisk ud fra video-ID, så artiklerne varierer i struktur og længde. Kun normale artikler bruger den.
    const profileHash = hashString(videoId || '');
    const articleProfile = ARTICLE_PROFILES[profileHash % ARTICLE_PROFILES.length];
    const targetWords = articleProfile.min + (Math.floor(profileHash / ARTICLE_PROFILES.length) % (articleProfile.max - articleProfile.min + 1));
    if (!isShort) console.log(`Artikel-profil: ${articleProfile.name} (~${targetWords} ord)`);

    // Shorts får kun en let metadata-prompt (title/tags/summary) - ingen dyr artikel- eller FAQ-generering
    const prompt = isShort
      ? `Act as a metadata generator for "Tech Feed Watch", a tech news site.
    Analyze this Short's content (transcript or title/description) and return EXACTLY in this format:
    TITLE: A concise, engaging headline
    TAGS: Choose 1-2 tags that best fit the video, ONLY from this exact list: AI & Tech, SEO, Automation, Coding, Business & Money, AI Video, Productivity, Fintech, Crypto. Return them comma-separated, e.g. 'SEO, AI Video'. Do not invent new tags.
    SUMMARY: A sharp 1-2 sentence summary of the Short.

    Video Content Data: ${text.substring(0, 5000)}`
      : `You are the Lead Tech Analyst and Senior Journalist for Tech Feed Watch, a premium tech media outlet covering AI, Tech, FinTech, and Crypto with unbiased, high-quality journalism. Use this video only as a starting point and news hook - do NOT summarize it. Before writing, silently identify the core topic and the 3-5 key concepts/keywords the video revolves around. Then write an original, independently-reasoned analysis of that TOPIC, adding genuine value the source does not provide, so the reader learns more than the video told them.

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
    10. ADD ORIGINAL VALUE beyond the source: include relevant context, history, comparisons to alternatives or competitors, or second-order implications the video did not mention - but only well-established, generally-known facts. Never fabricate statistics, quotes, dates, or events, and never merely restate what the video said.
    11. Weave the core topic and its key concepts/keywords naturally into the headline, the H2 headings, and the body so the piece ranks for what readers actually search - but never keyword-stuff or repeat awkwardly.

    This article MUST follow the "${articleProfile.name}" format below - match its structure, length, and voice so it reads differently from a standard template.

    ${articleProfile.structure}
    ${internalLinksContext}

    Video Content Data: ${text.substring(0, 20000)}`;

    const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
    const rawText = result.response.text();

    const titleMatch = rawText.match(/TITLE:\s*(.*)/i);
    const tagsMatch = rawText.match(/TAGS:\s*(.*)/i);
    const summaryMatch = rawText.match(/SUMMARY:\s*([\s\S]*?)(?=FAQ:|CONTENT:|$)/i);

    const safeTitle = (titleMatch ? titleMatch[1] : "New Video").replace(/"/g, "'").replace(/\n/g, " ").trim();
    const baseSlug = slugify(safeTitle) || videoId.toLowerCase();
    const slug = resolveUniqueSlug(baseSlug, videoId);
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

    // Shorts får hverken FAQ eller brødtekst
    const faqs = [];
    let content = "";

    if (!isShort) {
      const faqMatch = rawText.match(/FAQ:\s*([\s\S]*?)(?=CONTENT:|$)/i);
      const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*)/i);

      const faqBlock = faqMatch ? faqMatch[1] : "";
      const faqPairRegex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=Q:|$)/gi;
      let faqPairMatch;
      while ((faqPairMatch = faqPairRegex.exec(faqBlock)) !== null) {
        const question = sanitizeFaqText(faqPairMatch[1]);
        const answer = sanitizeFaqText(faqPairMatch[2]);
        if (question && answer) {
          faqs.push({ question, answer });
        }
      }

      content = contentMatch ? contentMatch[1].trim() : "";
      content = content.replace(/^```(markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    const date = new Date().toISOString().split('T')[0];

    const faqsYaml = faqs.length > 0
      ? "faqs:\n" + faqs.map(f => `  - question: ${toYamlDoubleQuoted(f.question)}\n    answer: ${toYamlDoubleQuoted(f.answer)}`).join('\n') + "\n"
      : "";

    const tagsYaml = "tags:\n" + finalTags.map(t => `  - ${toYamlDoubleQuoted(t)}`).join('\n') + "\n";

    const markdown = `---\ntitle: "${safeTitle}"\nyoutubeId: "${videoId}"\ndate: "${date}"\n${tagsYaml}summary: "${safeSummary}"\nduration: "${duration}"\nisShort: ${isShort}\n${faqsYaml}---\n\n${content}\n`;

    if (!fs.existsSync('./src/content/videos')) { fs.mkdirSync('./src/content/videos', { recursive: true }); }
    fs.writeFileSync(`./src/content/videos/${slug}.md`, markdown);
    console.log(`✅ Succes! Fil oprettet: ${slug}.md (varighed ${duration}).`);
    // Lav delekort til sociale medier (fejler stille - videoen er allerede oprettet)
    await generateOgCard(videoId, slug);
  } catch (error) {
    console.log("❌ Fejl:", error.message);
  }
}

run();