// Spørgsmålsfilter (fase 2, 6/10-2026). Bruges af auto-youtube.mjs.
//
// Autocomplete giver brokker ("what is ai content engine"), og de stod ordret
// som targetQuestion — på forsiden og i "People also ask". Målt 6/10: 71 af 420
// artikler havde et ugrammatisk spørgsmål (rettet i hånden i fase 1).
// Gemini dømmer 3 gange (flertal), og en rettelse bruges kun, hvis
// godkendSpoergsmaal siger, at den er lille og bevarer alle kerneord. Fejler
// noget, bruges den rå søgning — filteret kan aldrig stoppe robotten.
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL, hentModel } from './model.mjs';
import { godkendSpoergsmaal } from './skriveregler.mjs';

export const filterPrompt = (q) => `A Google search will be shown to readers as the question an article answers: "${q}".
Is it a grammatical, complete English question (or a clear noun phrase like "difference between X and Y") that a reader understands without guessing? It is BROKEN if a verb or noun is missing ("can i ai videos"), the grammar is wrong in a way readers notice ("what is ai chips used for", "what is ai content engine"), or it is cut off mid-phrase.
If it is fine, answer exactly: ok
If it is BROKEN, answer with only the shortest fix a searcher would type, lowercase, keeping the same meaning and as many original words as possible.`;

export async function retSpoergsmaal(q, log = console.log) {
  if (!q || !process.env.GEMINI_API_KEY) return q;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const svar = [];
  for (let k = 0; k < 3; k++) {
    try {
      // 2048: tænkningen tæller med i loftet (Lære 1/10: 512 klippede svaret)
      const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 2048, temperature: 0 } }).generateContent(filterPrompt(q));
      svar.push((r.response.text() || '').trim().split('\n')[0].toLowerCase().replace(/^["']+|["'.?!]+$/g, '').trim());
    } catch (e) { log(`Info: spørgsmålsfilter, dom ${k + 1} fejlede (${e.message.split('\n')[0]}).`); }
  }
  const rettelser = svar.filter((s) => s && s !== 'ok');
  if (!svar.length || rettelser.length * 2 <= svar.length) {
    log(`Info: Spørgsmålsfilter: "${q}" er i orden (${svar.length - rettelser.length}/${svar.length} ok).`);
    return q;
  }
  const hyppigst = [...rettelser].sort((a, b) => rettelser.filter((x) => x === b).length - rettelser.filter((x) => x === a).length)[0];
  const dom = godkendSpoergsmaal(q, hyppigst);
  if (!dom.ok) { log(`Info: Spørgsmålsfilter: rettelsen "${hyppigst}" afvist (${dom.hvorfor}) — bruger "${q}".`); return q; }
  log(`Info: Spørgsmålsfilter: "${q}" -> "${dom.spoergsmaal}" (${rettelser.length}/${svar.length} domme).`);
  return dom.spoergsmaal;
}
