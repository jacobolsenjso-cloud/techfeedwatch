// Relevans-tjek: dækker kilden (transskriptet) det, artiklen skal svare på?
//
// Delt mellem robotten (add-video.mjs, før artiklen skrives) og
// audit-relevans.mjs (tør kørsel over arkivet), så de to aldrig dømmer
// forskelligt. Målt 12/9: en artikel omdøbt til "what is ai algorithmic
// trading" havde en kildevideo, der slet ikke handlede om det — den slags kan
// ingen omskrivning redde.
//
// Svaret er YES/NO. Med et lille output-budget kom svaret tit tomt (modellen
// bruger af budgettet på at tænke), så der er plads, og et tomt svar får ét
// forsøg mere før det tæller som NO.
export async function erRelevant(genAI, text, emne, { erSpoergsmaal = true } = {}) {
  const hvad = erSpoergsmaal ? `the search "${emne}"` : emne;
  const prompt = `Answer with only one word: YES or NO. Does this transcript substantively cover the subject of ${hvad} — enough that an article on that subject could draw specific facts, examples or numbers from it? A passing mention is NO.\n\nTranscript (excerpt): ${String(text).substring(0, 6000)}`;
  let svar = '';
  for (let forsoeg = 0; forsoeg < 2 && !/^(YES|NO)/.test(svar); forsoeg++) {
    const r = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 512, temperature: 0 } }).generateContent(prompt);
    svar = (r.response.text() || '').replace(/[*.\s]/g, '').toUpperCase();
  }
  return { ja: svar.startsWith('YES'), svar: svar || '(tomt)' };
}
