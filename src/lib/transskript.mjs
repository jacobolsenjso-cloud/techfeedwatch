// Transskripter med cache på disk.
//
// Hvorfor: at hente undertekster fra YouTube er det dyreste skridt i hele
// kæden — ikke fordi det koster penge, men fordi YouTube drosler os. Målt
// 12-13/9: efter en håndfuld hentninger i træk svarer den "Transcript is
// disabled", og vi må vente 2, 4, 6 minutter. Det gør ~45 artikler til en
// 6-timers kørsel. Samme video hentes i dag flere gange: én gang i
// relevans-auditten, én gang når artiklen omskrives, én gang hvis den
// gendømmes. Med en cache hentes hver video ÉN gang.
//
// Cachen ligger i .cache/transskripter/<videoId>.json og er git-ignoreret.
// I GitHub Actions bæres den mellem kørsler af actions/cache (se
// rewrite-archive.yml), så den vokser fra kørsel til kørsel.
//
// Der gemmes de RÅ segmenter (ikke kun teksten), fordi add-video.mjs regner
// videoens længde ud af sidste segments offset+duration.
import fs from 'fs';
import path from 'path';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './model.mjs';

// --- Kilde 2: Gemini ser videoen selv (16/9) ---------------------------------
// Hvorfor: YouTube nægter at give undertekster til servere (GitHub Actions,
// Cloudflare — målt 14–16/9: "Transcript is disabled" / "Sign in to confirm
// you're not a bot"). Gemini kan tage en YouTube-adresse direkte, og så er
// det Google, der henter videoen — ingen blokering. Målt 16/9 på 3 videoer:
// 99 % af ordene og alle tal identiske med YouTubes egne undertekster.
// Pris: ~10 øre pr. 10-minutters video ved 0,1 billede/sekund (vi skal kun
// bruge lyden); fuld opløsning kostede 4 gange så meget for samme tekst.
//
// Rækkefølge (TRANSSKRIPT_KILDE styrer, standard 'auto'):
//   auto    : på GitHub Actions → Gemini direkte (YouTube er alligevel blokeret,
//             og hvert forsøg koster 12 min); på pc'en → YouTube først (gratis),
//             Gemini hvis YouTube fejler.
//   youtube : kun YouTube (som før 16/9).
//   gemini  : kun Gemini.
const GEMINI_FPS = 0.1;


function kildeValg() {
  const v = (process.env.TRANSSKRIPT_KILDE || 'auto').toLowerCase();
  if (v === 'youtube' || v === 'gemini') return v;
  return process.env.GITHUB_ACTIONS ? 'gemini' : 'auto';
}

// Videoens længde i sekunder fra YouTube Data API (virker fra GitHub — det er
// undertekst-hentningen, YouTube blokerer, ikke API'et). 0 hvis ukendt.
async function videoLaengdeSek(videoId) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return 0;
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${key}`);
    const d = await r.json();
    const m = String(d.items?.[0]?.contentDetails?.duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  } catch { return 0; }
}

// Beder Gemini skrive ned, hvad der bliver sagt. Returnerer ét segment med
// hele teksten og videoens længde, så add-video.mjs kan regne længden ud
// præcis som fra YouTubes segmenter (offset i ms + duration i sekunder).
async function hentViaGemini(videoId, onLog) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY mangler til Gemini-transskript');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 32768, temperature: 0 } });
  const t0 = Date.now();
  const res = await model.generateContent([
    { fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}` }, videoMetadata: { fps: GEMINI_FPS } },
    { text: 'Transcribe everything that is spoken in this video, verbatim, in the original language. Output plain text only, no timestamps, no speaker labels, no commentary.' },
  ]);
  const tekst = (res.response.text() || '').trim();
  const u = res.response.usageMetadata || {};
  if (onLog) onLog(`Gemini-transskript: ${tekst.length} tegn, ${Math.round((Date.now() - t0) / 1000)} s, ${u.promptTokenCount || '?'} tokens ind`);
  if (tekst.length < 200) throw new Error(`Gemini gav for lidt tekst (${tekst.length} tegn)`);
  const sek = await videoLaengdeSek(videoId);
  return [{ text: tekst, offset: 0, duration: sek, kilde: 'gemini' }];
}

const DIR = '.cache/transskripter';

export function cacheSti(videoId) {
  return path.join(DIR, `${videoId}.json`);
}

// Er det en droslings-fejl (vent og prøv igen) eller en rigtig fejl
// (videoen har slet ingen undertekster — vent aldrig på den)?
function erDrosling(besked) {
  return /Transcript is disabled|too many requests|429|blocked/i.test(String(besked));
}

/**
 * Henter transskriptets segmenter, fra cache hvis muligt.
 * Kaster videre hvis videoen ikke kan hentes efter alle forsøg.
 * onVent(sekunder) kaldes før hver ventetid, så kalderen kan logge.
 */
export async function hentSegmenter(videoId, { forsoeg = 4, onVent = null, onLog = null } = {}) {
  const sti = cacheSti(videoId);
  if (fs.existsSync(sti)) {
    try {
      const segs = JSON.parse(fs.readFileSync(sti, 'utf8'));
      if (Array.isArray(segs) && segs.length) return { segmenter: segs, fraCache: true };
    } catch { /* ødelagt cache-fil — hent forfra */ }
  }

  const kilde = kildeValg();
  const gem = (segs) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(sti, JSON.stringify(segs), 'utf8'); };
  if (kilde === 'gemini') {
    const segs = await hentViaGemini(videoId, onLog);
    gem(segs);
    return { segmenter: segs, fraCache: false, kilde: 'gemini' };
  }

  // Med Gemini som reserve venter vi ikke 2+4+6 min på YouTube: ét forsøg,
  // og virker det ikke med det samme, tager Gemini over (målt 16/9: ventetiden
  // var det, der gjorde en kørsel til 25-50 min).
  if (kilde === 'auto' && process.env.GEMINI_API_KEY) forsoeg = 1;
  let sidsteFejl;
  for (let f = 0; f < forsoeg; f++) {
    try {
      const segs = await YoutubeTranscript.fetchTranscript(videoId);
      if (!Array.isArray(segs) || !segs.length) throw new Error('tomt transskript');
      fs.mkdirSync(DIR, { recursive: true });
      fs.writeFileSync(sti, JSON.stringify(segs), 'utf8');
      return { segmenter: segs, fraCache: false };
    } catch (e) {
      sidsteFejl = e;
      if (!erDrosling(e.message) || f === forsoeg - 1) break;
      const sek = 120 * (f + 1);
      if (onVent) onVent(sek);
      await new Promise((r) => setTimeout(r, sek * 1000));
    }
  }
  if (kilde === 'auto') {
    if (onLog) onLog(`YouTube gav ingen undertekster (${String(sidsteFejl?.message || '').slice(0, 60)}) — prøver Gemini`);
    const segs = await hentViaGemini(videoId, onLog);
    gem(segs);
    return { segmenter: segs, fraCache: false, kilde: 'gemini' };
  }
  throw sidsteFejl;
}

// Bekvemmelighed: bare teksten.
export async function hentTekst(videoId, opt) {
  const { segmenter, fraCache } = await hentSegmenter(videoId, opt);
  return { tekst: segmenter.map((s) => s.text).join(' '), fraCache };
}
