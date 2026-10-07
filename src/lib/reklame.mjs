import { GEMINI_MODEL, hentModel } from './model.mjs';
// Værn mod reklamevideoer (Jacob 7/10-2026: "så ret det").
//
// Prøve #7 (7/10) byggede på en video fra et vikarbureau, der solgte sine egne
// assistenter. Artiklen fik bureauets priser ("$500 a month"), ejerens historie
// og konklusionen "brug et bureau" — den lignede en betalt omtale. Den slags
// skader troværdigheden og kan koste AdSense-godkendelsen.
//
// Relevansdommen (relevans.mjs) fanger det ikke: en salgsvideo kan handle
// præcis om spørgsmålet. Så her stilles et andet spørgsmål: er videoens
// hovedformål at sælge AFSENDERENS egen vare eller tjeneste?
//
// Samme kur som relevansdommen: karakter 0-10, tre kald, medianen afgør, og
// en begrundelse gemmes, så et menneske kan efterprøve dommen.
//   0-3   uafhængig forklaring, test eller tutorial (også om andres produkter)
//   4-6   blandet: forklarer emnet, men nævner egne tilbud
//   7-10  salgsvideo: afsenderens egne priser, "book et opkald", "køb hos os"
export const GRAENSE_REKLAME = 7; // median >= 7 -> kandidaten springes over

function reklamePrompt(text, { titel = '', kanal = '', beskrivelse = '' } = {}) {
  return `Decide whether this YouTube video is mainly a sales pitch for the creator's OWN product or service.

A sales pitch: the creator (or the channel's company) presents its own offer as the answer, gives its own prices or packages, or asks viewers to hire, book a call, buy, sign up or subscribe to its paid service.
NOT a sales pitch: an independent explanation, tutorial, review or comparison — including videos about other companies' products (e.g. a creator showing how to use Canva), and expert explainers that only mention their organisation in passing.

Scale:
0-3  = independent explanation, tutorial, review or news
4-6  = mostly informative, but promotes the creator's own offer along the way
7-10 = mainly an advertisement for the creator's own product or service

Answer with ONLY a JSON object, no other text:
{"score": <0-10>, "why": "<one short sentence>"}

Channel: ${kanal}
Title: ${titel}
Description (excerpt): ${String(beskrivelse).substring(0, 1500)}
Transcript (excerpt): ${String(text).substring(0, 6000)}`;
}

function laesSvar(raw) {
  const s = String(raw || '');
  const m = s.match(/\{[\s\S]*?\}/);
  if (m) { try { const o = JSON.parse(m[0]); const n = Number(o.score); if (Number.isFinite(n)) return { score: Math.max(0, Math.min(10, n)), grund: String(o.why || '').trim() }; } catch { /* stykkevis nedenfor */ } }
  const t = s.match(/"?score"?\s*[:=]\s*(10|[0-9])/i);
  if (!t) return null;
  const g = s.match(/"why"\s*:\s*"([^"]*)/i);
  return { score: Number(t[1]), grund: g ? g[1].trim() : '' };
}

/**
 * Er videoen en salgsvideo? Returnerer { reklame, score, scorer, grund, svar }.
 * Kommer der intet gyldigt svar, er reklame=false: værnet må aldrig stoppe
 * robotten på en teknisk fejl — det logges i stedet.
 */
export async function erReklame(genAI, text, meta = {}, { kald = 3, graense = GRAENSE_REKLAME } = {}) {
  const model = hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 1500, temperature: 0 } });
  const prompt = reklamePrompt(text, meta);
  const scorer = []; let grund = '';
  for (let i = 0; i < kald; i++) {
    try { const sv = laesSvar((await model.generateContent(prompt)).response.text()); if (sv) { scorer.push(sv.score); if (!grund && sv.grund) grund = sv.grund; } } catch { /* ét kald må ikke vælte dommen */ }
  }
  if (!scorer.length) return { reklame: false, score: null, scorer, grund: '', svar: '(intet svar — ikke stoppet)' };
  const median = scorer.slice().sort((a, b) => a - b)[Math.floor(scorer.length / 2)];
  return { reklame: median >= graense, score: median, scorer, grund, svar: `${median}/10 (${scorer.join(',')})${grund ? ` — ${grund}` : ''}` };
}
