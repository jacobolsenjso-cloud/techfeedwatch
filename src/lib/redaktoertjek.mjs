// Redaktørtjek (fase B, 12/10-2026): to spørgsmål, en redaktør ville stille.
//  1) Besvarer artiklen de delspørgsmål, Google-søgningen viste, at søgere har?
//  2) Reklamerer den — roser en vare, peger på en guide/tjekliste/et kursus, eller
//     henviser til noget, der ikke står i artiklen?
//  3) Slår den en påstand fast uden belæg — især spørgsmålets egen præmis (tilføjet 12/10)?
// Fase A (12/10) fandt begge dele: "Does SEO Help Your Business?" havde en
// produktros ("Hot Ones Buyer's Guide") og en "10-point checklist", der ikke findes.
//
// Returnerer null, hvis kaldet fejler — så ved vi, at tjekket IKKE kørte.
import { GEMINI_MODEL, hentModel } from './model.mjs';

export function redaktoerPrompt(md, delspoergsmaal, spoergsmaal) {
  return `You are the editor of an article that must answer the Google search "${spoergsmaal}".

QUESTIONS THE ARTICLE MUST ANSWER:
${delspoergsmaal.map((q, i) => `${i + 1}. ${q}`).join('\n')}

TASKS
1. For each numbered question: would a reader come away from the article with a clear answer to it? List the numbers of the questions that are NOT answered.
2. List every sentence that is promotion rather than information: it praises or recommends a specific product, vendor, course, guide, newsletter, download or creator's offer; tells the reader to sign up, buy, download or subscribe; or refers to a resource the article does not contain (for example "grab the 10-point checklist"). Naming a product while explaining or comparing it is NOT promotion. A sentence that links to another article on this site (a link starting with "/video/", "/guides/", "/glossary/", "/tools/" or "/tag/") is NOT promotion. Copy each sentence exactly.
3. List every sentence that states a sweeping or one-sided judgment as settled fact without evidence in the same sentence — especially when it simply repeats an assumption in the search question (for example "Despite clear operational superiority, ..." for the search "why fintech is better than banks"). A judgment backed by a named source or number in the same sentence is NOT one-sided. Copy each sentence exactly.

Return JSON only: {"unanswered":[2],"promo":["exact sentence"],"onesided":["exact sentence"]}

ARTICLE:
${md}`;
}

export async function redaktoerTjek(genAI, md, delspoergsmaal, spoergsmaal) {
  try {
    const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 8192, temperature: 0, responseMimeType: 'application/json' } })
      .generateContent(redaktoerPrompt(md, delspoergsmaal, spoergsmaal));
    const j = JSON.parse((r.response.text() || '').replace(/^```(json)?\s*|\s*```$/g, ''));
    const ubesvarede = (Array.isArray(j.unanswered) ? j.unanswered : [])
      .map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= delspoergsmaal.length)
      .map((n) => ({ nr: n, spoergsmaal: delspoergsmaal[n - 1] }));
    // Kun sætninger, der faktisk står i artiklen, tæller (modellen kan ikke finde på fund).
    // En sætning med et link til sitets egne sider er en intern henvisning, ikke reklame
    // (målt 12/10, prøve 4: 5 interne henvisninger blev kaldt reklame og stoppede artiklen).
    const reklame = (Array.isArray(j.promo) ? j.promo : []).map(String)
      .filter((s) => s.length > 10 && md.includes(s.slice(0, 40)) && !/\]\(\/(video|guides|glossary|tools|tag)\//.test(s));
    // Ensidige sætninger (12/10): fase C's fintech-prøve skrev "Despite clear operational
    // superiority" — spørgsmålets præmis slået fast som sandhed.
    const ensidige = (Array.isArray(j.onesided) ? j.onesided : []).map(String).filter((s) => s.length > 10 && md.includes(s.slice(0, 40)));
    return { ubesvarede, reklame, ensidige };
  } catch {
    return null;
  }
}
