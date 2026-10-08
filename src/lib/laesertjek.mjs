import { GEMINI_MODEL, hentModel } from './model.mjs';
// Læsertjek (merværdi, Jacob 8/10-2026: "Vi skal jo have merværdi ... du koder").
//
// Reglerne i skriveregler.mjs måler form. De så ikke, at nattens artikel 7/10
// ("what does a data breach mean") nævnte "Northgate", "Denise" og "Ray" fra
// videoens historie uden at præsentere dem, og havde et afsnit, der kun var
// citatet "The data was encrypted". En læser falder over det på et minut.
//
// Her læser en model den færdige artikel som en læser, der IKKE har set videoen,
// og peger på de sætninger, man snubler over. Kun sætninger, der står ordret i
// artiklen, tæller (modellen må ikke opfinde fund). Bagefter omskrives KUN de
// sætninger - resten af artiklen røres ikke.
export const PROBLEMER = ['NAME', 'FRAGMENT', 'REFERENCE', 'CONTRADICTION'];

function tjekPrompt(md) {
  return `You are a copy editor. Read the article below as an ordinary reader who has NOT watched the video it is based on.
List the sentences a reader would stumble on, of these kinds only:
- NAME: a person, company, product or place mentioned as if the reader already knows who or what it is, because it was only introduced in the video (for example "Northgate got a letter in June." with no explanation of Northgate). Well-known companies, the video's creator and anyone explained in the article are fine.
- FRAGMENT: a broken or incomplete sentence, or a paragraph that is only a stray quote with no sentence around it.
- REFERENCE: "this", "they", "it", "he" or "she" pointing to something the article has not stated.
- CONTRADICTION: a sentence that contradicts another sentence in the article.

Copy each sentence EXACTLY as it appears in the article. List at most 10. If there are none, return an empty list.
Answer with ONLY a JSON array, no other text:
[{"sentence": "<exact sentence>", "problem": "NAME|FRAGMENT|REFERENCE|CONTRADICTION", "why": "<a few words>"}]

ARTICLE:
${md}`;
}

function retPrompt(md, fund) {
  return `Rewrite ONLY the sentences listed below so an ordinary reader who has not seen the video understands them. Use the rest of the article as context.
- NAME: introduce who or what it is in a few words (for example "a small firm the video calls Northgate"), or remove the name if it adds nothing.
- FRAGMENT: make it a complete sentence, or merge it into its neighbour.
- REFERENCE: name what "this/they/it" refers to.
- CONTRADICTION: make the sentence agree with the rest of the article.
Keep every number, name, link and fact that is correct. Do not add new facts. Write in plain editorial English.
Answer with ONLY a JSON array, no other text:
[{"old": "<the exact sentence>", "new": "<the rewritten sentence>"}]

SENTENCES TO REWRITE:
${fund.map((f) => `- [${f.problem}] ${f.sentence}`).join('\n')}

ARTICLE (context):
${md}`;
}

function jsonListe(raw) {
  const s = String(raw || '');
  const m = s.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { const v = JSON.parse(m[0]); return Array.isArray(v) ? v : null; } catch { return null; }
}

/**
 * Finder sætninger, en læser snubler over. Returnerer [{sentence, problem, why}],
 * kun dem der står ordret i artiklen. Fejler kaldet: tom liste (stopper aldrig robotten).
 */
export async function laeserTjek(genAI, md) {
  try {
    const model = hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 3000, temperature: 0 } });
    const liste = jsonListe((await model.generateContent(tjekPrompt(md))).response.text());
    if (!liste) { console.log('   læsertjek: svaret var ikke en liste'); return null; }
    return liste
      .filter((x) => x && typeof x.sentence === 'string' && PROBLEMER.includes(String(x.problem).toUpperCase()))
      .map((x) => ({ sentence: x.sentence.trim(), problem: String(x.problem).toUpperCase(), why: String(x.why || '').trim() }))
      .filter((x) => x.sentence.length > 3 && md.includes(x.sentence))
      .slice(0, 10);
  } catch (e) {
    // null = tjekket kunne ikke køre (fx Gemini 402, 8/10). Må ikke forveksles med "0 fund".
    console.log(`   læsertjek kunne ikke køre: ${String(e.message).slice(0, 160)}`);
    return null;
  }
}

/**
 * Omskriver kun de udpegede sætninger. En erstatning bruges kun, hvis den gamle
 * sætning står præcis én gang, den nye ikke er tom, og den ikke er over dobbelt så lang.
 * Returnerer { md, rettet }.
 */
export async function retLaeserFund(genAI, md, fund) {
  if (!fund.length) return { md, rettet: 0 };
  try {
    const model = hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 4000, temperature: 0.3 } });
    const liste = jsonListe((await model.generateContent(retPrompt(md, fund))).response.text()) || [];
    let ny = md, rettet = 0;
    for (const r of liste) {
      const gammel = String(r?.old || '').trim(), nySaetning = String(r?.new || '').trim();
      if (!gammel || !nySaetning || gammel === nySaetning) continue;
      if (ny.split(gammel).length - 1 !== 1) continue;
      if (nySaetning.length > gammel.length * 2 + 40) continue;
      ny = ny.replace(gammel, nySaetning); rettet++;
    }
    return { md: ny, rettet };
  } catch { return { md, rettet: 0 }; }
}
