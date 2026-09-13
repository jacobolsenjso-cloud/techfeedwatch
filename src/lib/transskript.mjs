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
export async function hentSegmenter(videoId, { forsoeg = 4, onVent = null } = {}) {
  const sti = cacheSti(videoId);
  if (fs.existsSync(sti)) {
    try {
      const segs = JSON.parse(fs.readFileSync(sti, 'utf8'));
      if (Array.isArray(segs) && segs.length) return { segmenter: segs, fraCache: true };
    } catch { /* ødelagt cache-fil — hent forfra */ }
  }

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
  throw sidsteFejl;
}

// Bekvemmelighed: bare teksten.
export async function hentTekst(videoId, opt) {
  const { segmenter, fraCache } = await hentSegmenter(videoId, opt);
  return { tekst: segmenter.map((s) => s.text).join(' '), fraCache };
}
