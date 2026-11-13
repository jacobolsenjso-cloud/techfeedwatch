// Måling af den anden kilde (Jacob 13/11-2026: "mål før"): DataForSEO-spørgsmål for alle emners tre startord.
// Spørger: hvor mange NYE spørgsmål (ikke brugt, ikke prøvet) med søgetal og sværhed ≤ 30 giver hvert emne - og har
// det bedste af dem en YouTube-video, robotten kan bruge? Pris ca. $0,024 pr. startord (54 startord ≈ $1,30); svarene
// gemmes i 30 dage (src/data/dataforseo-forslag.json + dataforseo.json), så robotten ikke betaler for dem igen.
// YouTube: én søgning pr. emne (100 af dagens 10.000 enheder) - tæller videoer på engelsk, 4-60 min, hvis titel deler
// mindst to kerneord med spørgsmålet. Det er en grov måling: robottens egne sigter (kanal-værn, relevans) er strengere.
// Kører på GitHub (workflow "DataForSEO-maaling"), hvor nøglerne er. Skriver kun spørgsmål og tal ud.
import fs from 'node:fs';
import { hentSpoergsmaal, forslagLinje, vaerdi, talTekst, harNoegle } from './src/lib/dataforseo.mjs';
import { PRAEFIKSER, godtForslag } from './src/lib/suggest.mjs';

if (!harNoegle()) { console.log('Stop: DATAFORSEO_LOGIN/PASSWORD mangler - intet kald.'); process.exit(1); }
// Emnerne læses fra auto-youtube.mjs (TOPIC_BY_TAG) - samme frø som robotten, uden at starte robotten
const kilde = fs.readFileSync('auto-youtube.mjs', 'utf8');
const blok = kilde.slice(kilde.indexOf('const TOPIC_BY_TAG'), kilde.indexOf('};', kilde.indexOf('const TOPIC_BY_TAG')));
const alleEmner = [...blok.matchAll(/^\s*"([^"]+)":\s*"([^"]+)"/gm)].map((m) => ({ tag: m[1], froe: m[2].split('|').map((x) => x.trim()).filter(Boolean).slice(0, 3) }));
// MAAL_EMNER="AI & Tech;SEO" måler kun de navngivne emner (13/11: spørgsmålsfilteret prøvet på de 3, der gav 0)
const valgte = (process.env.MAAL_EMNER || '').split(';').map((x) => x.trim()).filter(Boolean);
const emner = valgte.length ? alleEmner.filter((e) => valgte.includes(e.tag)) : alleEmner;
const laes = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const brugt = new Set([...laes('src/data/used-questions.json'), ...laes('src/data/tried-questions.json')].map((x) => x.q));

const kerne = (s) => new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !['what', 'does', 'much', 'between', 'should', 'happens', 'when', 'best', 'take'].includes(w)));
async function youtube(q) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { fejl: 'YOUTUBE_API_KEY mangler' };
  const p = new URLSearchParams({ part: 'snippet', q, type: 'video', maxResults: '10', relevanceLanguage: 'en', videoDuration: 'medium', key });
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { fejl: `HTTP ${r.status}` };
    const j = await r.json();
    const k = kerne(q);
    const passer = (j.items || []).filter((it) => { const t = kerne(it.snippet?.title || ''); return [...k].filter((w) => t.has(w)).length >= Math.min(2, k.size); });
    return { fundet: (j.items || []).length, passer: passer.length, eksempel: passer[0]?.snippet?.title || '' };
  } catch (e) { return { fejl: String(e.message).slice(0, 80) }; }
}

let usd = 0, alleNye = 0, medVideo = 0;
const L = [];
const p = (s = '') => { L.push(s); console.log(s); };
p(`# DataForSEO-forslag: ${emner.length} emner × 3 startord (${new Date().toISOString().slice(0, 16)} UTC)`);
for (const e of emner) {
  const { spoergsmaal, log } = await hentSpoergsmaal(e.froe, PRAEFIKSER, godtForslag);
  usd += log.pris || 0;
  const nye = spoergsmaal.filter((x) => !brugt.has(x.q)).sort((a, b) => vaerdi(b.t) - vaerdi(a.t));
  alleNye += nye.length;
  p(`\n## ${e.tag} (${e.froe.join(', ')}): ${spoergsmaal.length} spørgsmål, ${nye.length} nye · ${forslagLinje(log)}`);
  for (const x of nye.slice(0, 3)) p(`- "${x.q}" - ${talTekst(x.t)}`);
  if (nye[0]) {
    const y = await youtube(nye[0].q);
    if (y.fejl) p(`  YouTube: fejl (${y.fejl})`);
    else { p(`  YouTube for det bedste: ${y.passer} af ${y.fundet} videoer passer${y.eksempel ? ` (fx "${y.eksempel.slice(0, 80)}")` : ''}`); if (y.passer) medVideo++; }
  }
}
p(`\n# I alt: ${alleNye} nye spørgsmål med søgetal; ${medVideo} af ${emner.length} emner har en passende video til det bedste; pris $${usd.toFixed(3)}`);
fs.writeFileSync(process.env.RUNNER_TEMP ? `${process.env.RUNNER_TEMP}/forslag-maaling.md` : '_forslag-maaling.md', L.join('\n') + '\n');
