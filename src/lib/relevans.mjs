// Relevans: dækker kilden (transskriptet) det, artiklen skal svare på?
//
// Delt mellem robotten (add-video.mjs, før artiklen skrives) og auditterne,
// så de aldrig dømmer forskelligt.
//
// HISTORIE — hvorfor det ikke længere er et ja/nej-spørgsmål:
// Første udgave spurgte "YES eller NO". Målt 13/9 vendte dommen for 32 af 97
// artikler (37 %) mellem to kørsler få timer fra hinanden — samme spørgsmål,
// samme tekst. Det er ikke støj (på et klart tilfælde svarer den ens 10 af 10
// gange); det er grænsetilfælde, hvor et ja/nej-svar må vælge side og lige så
// godt kan vælge den anden næste gang. Et møntkast må ikke afgøre, om en
// artikel slettes.
//
// Nu: modellen giver en KARAKTER 0-10 og én linje om, hvad videoen faktisk
// handler om. Der spørges tre gange, og MEDIANEN bruges — så et enkelt
// udsving flytter ikke dommen. Begrundelsen gemmes, så et menneske kan
// efterprøve listen med et blik i stedet for at stole blindt på maskinen.
//
// Skalaen, som den står i prompten:
//   8-10  kilden handler direkte om spørgsmålet og har konkrete detaljer
//   4-7   kilden berører emnet, men svarer ikke rigtigt på spørgsmålet
//   0-3   kilden handler om noget andet
export const GRAENSE_ROBOT = 5;   // robotten skriver kun, hvis medianen er >= denne
export const GRAENSE_GOD = 8;     // "kilden dækker" — kan omskrives uden at nogen kigger
export const GRAENSE_DAARLIG = 4; // under denne: kilden dækker ikke

function relevansPrompt(text, emne, erSpoergsmaal) {
  const hvad = erSpoergsmaal ? `the search "${emne}"` : emne;
  return `Rate how well this video transcript covers the subject of ${hvad}.

Scale:
8-10 = the transcript is directly about it and gives specific facts, examples or numbers an article could use
4-7  = the transcript touches the subject but does not really answer it
0-3  = the transcript is about something else

Answer with ONLY a JSON object, no other text:
{"score": <0-10>, "about": "<one short sentence: what the transcript is actually about>"}

Transcript (excerpt): ${String(text).substring(0, 6000)}`;
}

function laesSvar(raw) {
  const s = String(raw || '');
  const m = s.match(/\{[\s\S]*?\}/);
  if (m) {
    try {
      const o = JSON.parse(m[0]);
      const score = Number(o.score);
      if (Number.isFinite(score)) return { score: Math.max(0, Math.min(10, score)), grund: String(o.about || '').trim() };
    } catch { /* faldt igennem — samles stykkevis nedenfor */ }
  }
  // Nødplan: svaret er klippet af midt i JSON'en (målt 13/9: "about"-linjen
  // forsvandt i to af tre kald). Så tages tal og begrundelse hver for sig,
  // så begrundelsen ikke går tabt bare fordi den afsluttende } mangler.
  const t = s.match(/"?score"?\s*[:=]\s*(10|[0-9])/i) || s.match(/\b(10|[0-9])\s*\/\s*10\b/);
  if (!t) return null;
  const g = s.match(/"about"\s*:\s*"([^"]*)/i);
  return { score: Number(t[1]), grund: g ? g[1].trim() : '' };
}

/**
 * Karaktergivning med gentagelse. Returnerer medianen af de gyldige svar.
 * Kommer der ingen gyldige svar overhovedet, er score null — kalderen
 * afgør, hvad der så skal ske (robotten springer kandidaten over).
 */
export async function relevansScore(genAI, text, emne, { erSpoergsmaal = true, kald = 3 } = {}) {
  const prompt = relevansPrompt(text, emne, erSpoergsmaal);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    // 512 var for lidt: gemini-2.5 bruger af budgettet på at tænke, og
    // begrundelsen blev klippet af i to ud af tre svar (målt 13/9).
    generationConfig: { maxOutputTokens: 1500, temperature: 0 },
  });
  const scorer = [];
  let grund = '';
  for (let i = 0; i < kald; i++) {
    try {
      const r = await model.generateContent(prompt);
      const svar = laesSvar(r.response.text());
      if (!svar) continue;
      scorer.push(svar.score);
      if (!grund && svar.grund) grund = svar.grund;
    } catch { /* et enkelt kald der fejler må ikke vælte dommen */ }
  }
  if (!scorer.length) return { score: null, grund: '', scorer: [], spredning: 0 };
  const sorteret = scorer.slice().sort((a, b) => a - b);
  const median = sorteret[Math.floor(sorteret.length / 2)];
  return {
    score: median,
    grund,
    scorer,
    spredning: sorteret[sorteret.length - 1] - sorteret[0], // 0 = alle kald enige
  };
}

/**
 * Ja/nej til robotten, bygget på karakteren. Beholder det gamle navn og den
 * gamle returform, så add-video.mjs ikke skal skrives om.
 */
export async function erRelevant(genAI, text, emne, { erSpoergsmaal = true, graense = GRAENSE_ROBOT, kald = 3 } = {}) {
  const r = await relevansScore(genAI, text, emne, { erSpoergsmaal, kald });
  if (r.score === null) return { ja: false, svar: '(intet svar)', ...r };
  return {
    ja: r.score >= graense,
    svar: `${r.score}/10${r.scorer.length > 1 ? ` (${r.scorer.join(',')})` : ''}${r.grund ? ` — ${r.grund}` : ''}`,
    ...r,
  };
}
