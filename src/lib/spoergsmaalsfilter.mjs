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

// Redaktør-prompten, der vælger blandt autocomplete-forslagene (flyttet hertil fra
// auto-youtube.mjs 14/10, så den kan testes). Strammet 14/10: "how is programming com company"
// slap igennem — et spørgsmål om ét firmas omdømme med et domænenavn skrevet som ord. Ingen
// video kunne svare på det, og 4 kandidater kostede ~0,29 USD.
export const redaktoerPrompt = (liste) => `Below is a numbered list of Google autocomplete searches. Which of them are clear, plain-English informational questions that a factual reference article could answer with concrete facts (definitions, how something works, comparisons, numbers)? EXCLUDE any that use slang or meme language (e.g. "cooked", "goated"), that are jokes, that are ambiguous, that are poetic, speculative, metaphorical or opinion-only (e.g. "why ai videos look like dreams", "is ai alive"), that ask for a price, a purchase, a login or a job, or that only make sense for one person's situation. ALSO EXCLUDE any that ask how good, legit or well-reviewed one specific company, website or seller is (e.g. "how is programming com company", "is xyz legit"), and any that contain a website or brand name broken into words (e.g. "programming com"). Return ONLY a JSON array of the numbers to keep, e.g. [1,3,4].\n\n${liste.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

// afvisBrudte (14/10): kalder flertallet søgningen BRUDT, og kan rettelsen ikke godkendes,
// returneres null i stedet for den brudte søgning. Målt 14/10 (#664): "how is programming com
// company" blev dømt brudt, rettelsen afvist, og robotten brugte så ~0,29 USD på 4 videoer om
// et volapyk-spørgsmål. Uden flaget er opførslen som før (filteret stopper aldrig noget).
export async function retSpoergsmaal(q, log = console.log, { afvisBrudte = false } = {}) {
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
  if (!dom.ok && afvisBrudte) { log(`Info: Spørgsmålsfilter: "${q}" er brudt (${rettelser.length}/${svar.length} domme), og rettelsen "${hyppigst}" kan ikke bruges (${dom.hvorfor}) — springes over.`); return null; }
  if (!dom.ok) { log(`Info: Spørgsmålsfilter: rettelsen "${hyppigst}" afvist (${dom.hvorfor}) — bruger "${q}".`); return q; }
  log(`Info: Spørgsmålsfilter: "${q}" -> "${dom.spoergsmaal}" (${rettelser.length}/${svar.length} domme).`);
  return dom.spoergsmaal;
}

// Emnetjek (12/10-2026). Grammatikfilteret ovenfor godkendte "what happens to sora in naruto"
// (en anime-figur) for emnet AI Video, fordi spørgsmålet er grammatisk fint. Her spørges,
// om søgningen — som de fleste mener den — handler om sitets emne. Gemini dømmer 3 gange,
// flertal afgør. Returnerer true/false, eller null hvis tjekket ikke kunne køre (så
// stopper det aldrig robotten).
export const emnePrompt = (q, emne) => `A technology website (AI, tech, software, hardware, fintech, crypto, cybersecurity) wants to write an article answering the Google search "${q}" under its topic "${emne}".
Does this search, as most people typing it mean it, ask about technology, software, AI, hardware, digital business, finance or crypto?
Answer NO if it is mainly about entertainment, fiction, anime, game lore, sports, celebrities, or another meaning of a word that also names a tech product (for example "what happens to sora in naruto" is about an anime character, not OpenAI's Sora).
Answer exactly: yes or no`;

export async function passerEmnet(q, emne, log = console.log) {
  if (!q || !process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const svar = [];
  for (let k = 0; k < 3; k++) {
    try {
      const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 2048, temperature: 0 } }).generateContent(emnePrompt(q, emne));
      const s = (r.response.text() || '').trim().toLowerCase();
      if (/^yes/.test(s)) svar.push(true); else if (/^no/.test(s)) svar.push(false);
    } catch (e) { log(`Info: emnetjek, dom ${k + 1} fejlede (${e.message.split('\n')[0]}).`); }
  }
  if (!svar.length) return null;
  const ja = svar.filter(Boolean).length;
  log(`Info: Emnetjek: "${q}" ${ja * 2 > svar.length ? 'handler om emnet' : 'handler IKKE om emnet'} (${ja}/${svar.length} ja).`);
  return ja * 2 > svar.length;
}
