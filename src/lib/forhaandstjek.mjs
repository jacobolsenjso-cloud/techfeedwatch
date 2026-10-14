// Forhåndstjek (14/10-2026): billig dom på titel + beskrivelse, FØR en kandidat får sit dyre
// faktaark (Gemini ser hele videoen, 10.000-90.000 tokens). Målt 14/10: 14 kandidater blev set
// i fuld længde; 12 af dem fik 0-4/10 i relevans og blev afvist bagefter — ca. 0,5 USD for ingenting.
//
// Ét kald for alle kandidater. Kun TYDELIGT urelevante (score <= SKAER) springes over; er der tvivl,
// får videoen sin fulde vurdering. Fejler kaldet, springes intet over — tjekket må aldrig stoppe robotten.
import { GEMINI_MODEL, hentModel } from './model.mjs';

export const SKAER = 2;

export const forhaandsPrompt = (spoergsmaal, videoer) => `A website wants to answer the Google search "${spoergsmaal}" and needs ONE YouTube video whose content actually answers it.
For each video below you only see its title and description. Rate 0-10 how likely the video is mainly about answering that search:
0-2 = clearly about something else (another meaning, another product, only loosely related),
3-6 = might cover it,
7-10 = very likely answers it.
Be generous when unsure. Return ONLY JSON: [{"id":"...","score":N}, ...]

${videoer.map((v) => `id: ${v.id}\ntitle: ${v.titel}\ndescription: ${String(v.beskrivelse || '').slice(0, 400).replace(/\s+/g, ' ')}`).join('\n\n')}`;

// videoer: [{ id, titel, beskrivelse }]. Returnerer Map id -> score (tom Map, hvis kaldet fejlede).
export async function forhaandsScorer(genAI, spoergsmaal, videoer, log = console.log) {
  const scorer = new Map();
  if (!genAI || !spoergsmaal || !videoer.length) return scorer;
  try {
    // 8192: tænkningen tæller med i loftet (Lære 14/10).
    const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0 } })
      .generateContent(forhaandsPrompt(spoergsmaal, videoer));
    const m = (r.response.text() || '').match(/\[[\s\S]*\]/);
    if (!m) { log('Info: Forhåndstjek gav intet svar — alle kandidater vurderes fuldt.'); return scorer; }
    for (const x of JSON.parse(m[0])) if (x && x.id && Number.isFinite(Number(x.score))) scorer.set(String(x.id), Number(x.score));
  } catch (e) {
    log(`Info: Forhåndstjek fejlede (${String(e.message).split('\n')[0]}) — alle kandidater vurderes fuldt.`);
  }
  return scorer;
}
