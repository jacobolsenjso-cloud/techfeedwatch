// Ét sted for modelnavnet OG for "prøv igen"-reglen.
//
// Modelnavn: 16/9 svarede Google "gemini-2.5-flash is no longer available to
// new users" på den nye gratis-nøgle — kun gemini-3.6-flash tilbydes nye
// projekter. Før stod navnet 22 steder; nu ét. Kan overstyres med GEMINI_MODEL.
//
// 21/9: hævet til gemini-3.8-flash. Målt før skiftet: nøglen kan se 3.5, 3.6,
// 3.7 og 3.8, og et rigtigt kald til 3.8 svarede HTTP 200. Prisen er den
// SAMME som 3.6 ($0,75 ind / $3,75 ud pr. mio. tokens), så skiftet koster
// ikke mere. Bemærk: Google fordobler begge priser 1. januar 2027.
//
// Vi opdagede det, fordi en artikel på sitet kaldte 3.6 "Google's fastest AI
// model to date", mens 3.8 var udkommet. Robotten selv var altså også
// bagud — samme mønster, et sted ingen kiggede.
import { Agent, setGlobalDispatcher } from 'undici';
// 27/10 (Jacob: "når Gemini ikke svarer"): Nodes fetch giver op efter 5 minutter uden svar
// ("fetch failed", målt 25/10 og igen 27/10 på kvantecomputer-artiklens skeptiker-kald). Lange
// faktatjek med Google-søgning kan tage længere - og så blev en færdig, betalt artikel smidt ud.
// Nu venter alle kald op til 10 minutter. Sider, koden selv henter, har deres egen kortere grænse.
// Testet 27/10 på Node 22 (som GitHub bruger) og Node 26 (Jacobs pc).
setGlobalDispatcher(new Agent({ headersTimeout: 10 * 60e3, bodyTimeout: 10 * 60e3 }));

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Prøv igen: gratis-niveauet står bagerst i køen, og Google svarer af og til
// 503 "high demand" eller 429 (for mange kald). Målt 16/9: faktaark-kaldet
// fik 503 midt i en ellers vellykket kørsel. Én kandidat skal ikke gå tabt af
// den grund, så kaldet gentages med voksende ventetid: 15, 30, 60 sekunder.
// Alt andet (ugyldig nøgle, forkert model, spærret indhold) kastes videre med
// det samme — det hjælper ingen ventetid på.
const VENT_SEK = [15, 30, 60];

function erForbigaaende(e) {
  const m = String(e?.message || e);
  // Et DAGS- eller MÅNEDS-loft går ikke over ved at vente et minut. Målt 17/9
  // (#534): 12 gentagelser på "PerDay"-kvoten spildte 14 min. Giv op straks.
  if (/PerDay|per day|spending cap|monthly/i.test(m)) return false;
  return /\[503|\[429|high demand|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED|Too Many Requests/i.test(m);
}

// Fejl, der stopper ALT, til de er rettet af et menneske (8/10: "402 prepayment credits
// are depleted" stoppede robotten en time, og kørslerne var grønne). Robotten melder dem
// ved at fejle kørslen (rød i GitHub = mail til Jacob), se slutningen af auto-youtube.mjs.
export const geminiStop = { fejl: null };
export function erBlokerende(e) {
  return /\[40[123]\b|prepayment|credits are depleted|billing|API key not valid|API_KEY_INVALID|PERMISSION_DENIED|PerDay|per day|spending cap/i.test(String(e?.message || e));
}

export async function medGentag(fn, { onVent = null } = {}) {
  let sidste;
  for (let i = 0; i <= VENT_SEK.length; i++) {
    try { return await fn(); }
    catch (e) {
      sidste = e;
      if (erBlokerende(e) && !geminiStop.fejl) geminiStop.fejl = String(e.message || e).slice(0, 300);
      if (!erForbigaaende(e) || i === VENT_SEK.length) throw e;
      const sek = VENT_SEK[i];
      if (onVent) onVent(sek, e); else console.log(`   Gemini svarer "prøv igen" — venter ${sek} s (${String(e.message).match(/\[(\d{3})/)?.[1] || '?'})`);
      await new Promise((r) => setTimeout(r, sek * 1000));
    }
  }
  throw sidste;
}

// Klippet-hjælpere (24/10). LOFT_MAKS = det højeste loft, et nyt forsøg må bruge (65536, som
// transskript.mjs allerede bruger) — et kald, der står der i forvejen, prøves ikke igen.
const LOFT_MAKS = 65536;
const erKlippet = (r) => r?.response?.candidates?.[0]?.finishReason === 'MAX_TOKENS';
const forbrugTekst = (loft, r) => {
  const u = r?.response?.usageMetadata || {};
  return `maxOutputTokens ${loft}; tænkning ${u.thoughtsTokenCount || 0}, svar ${u.candidatesTokenCount || 0}`;
};

// Samme som genAI.getGenerativeModel(opts), men generateContent prøver igen
// ved forbigående fejl og (24/10) én gang med dobbelt loft, hvis svaret blev klippet.
// Brug denne i stedet for getGenerativeModel.
export function hentModel(genAI, opts) {
  const navn = opts?.model || GEMINI_MODEL;
  const m = genAI.getGenerativeModel({ model: GEMINI_MODEL, ...opts });
  return {
    generateContent: async (input) => {
      const r = await medGentag(() => m.generateContent(input));
      taelForbrug(navn, r);
      // Klippet svar (14/10): to gange (1/10 og 14/10) gav et for lavt maxOutputTokens et tomt
      // eller halvt svar, som koden tavst behandlede som "intet svar". Tænkningen tæller med i
      // loftet. Nu står det i loggen, hver gang et svar rammer loftet — ét sted for alle kald.
      // 24/10 (Jacob valgte den varige løsning): samme fejl 4 gange (1/10, 14/10, 20/10, 21/10),
      // hver gang rettet ét kald ad gangen. Nu prøver dette ene sted SELV igen én gang med dobbelt
      // loft (højst LOFT_MAKS). Et højere loft koster intet i sig selv — man betaler kun for det,
      // Gemini skriver. "KLIPPET" skrives kun, når heller ikke andet forsøg slap fri: det er det,
      // robot-log.mjs tæller, så driftstavlen kun lyser rødt ved et reelt problem.
      if (erKlippet(r)) {
        const loft = Number(opts?.generationConfig?.maxOutputTokens) || 0;
        if (loft > 0 && loft < LOFT_MAKS) {
          const nytLoft = Math.min(loft * 2, LOFT_MAKS);
          console.log(`   ↻ Gemini-svar ramte loftet (${forbrugTekst(loft, r)}) — prøver igen med ${nytLoft}.`);
          const m2 = genAI.getGenerativeModel({ model: GEMINI_MODEL, ...opts, generationConfig: { ...opts.generationConfig, maxOutputTokens: nytLoft } });
          const r2 = await medGentag(() => m2.generateContent(input));
          taelForbrug(navn, r2);
          if (!erKlippet(r2)) return r2;
          console.log(`   ⚠️ Gemini-svar KLIPPET ved loftet (${forbrugTekst(nytLoft, r2)}) — også efter nyt forsøg med dobbelt loft.`);
          return r2;
        }
        console.log(`   ⚠️ Gemini-svar KLIPPET ved loftet (${forbrugTekst(loft || '?', r)}) — hæv loftet for dette kald.`);
      }
      return r;
    },
  };
}

// Forbrugstæller (13/10): lægger tokens, Google-søgninger og billeder sammen for alle kald
// gennem hentModel, så prisen pr. artikel kan MÅLES i stedet for at blive skønnet.
// Priser fra ai.google.dev 12/10-2026 (USD pr. mio. tokens; fordobles 1/1-2027 for 3.8 Flash).
// Google-søgninger: 5.000 gratis pr. md. (delt), derefter 14 USD pr. 1.000.
// 26/10 (Lære): søgningerne blev talt, men ikke prissat - rapporten sagde 68 kr. for et døgn, Google
// tog 306 kr. (2.471 søgninger 20.-26/10 = 228 kr. på fakturaen). Nu prissættes HVER søgning med
// 0,014 USD. Tidligt på måneden (før de 5.000 gratis er brugt) er tallet derfor lidt for højt - hellere
// det end for lavt.
const PRIS_SOEGNING = 0.014;
const PRIS = {
  'gemini-3.8-flash': { ind: 0.75, ud: 3.75 },
  'gemini-nano-banana-2.1': { ind: 1.5, ud: 7.5, billede: 30 },
};
export const forbrug = { kald: 0, ind: 0, ud: 0, billedTokens: 0, soegninger: 0, usd: 0 };
export function taelForbrug(navn, r) {
  const u = r?.response?.usageMetadata || {};
  const p = PRIS[navn] || PRIS['gemini-3.8-flash'];
  const billed = (u.candidatesTokensDetails || []).filter((d) => d.modality === 'IMAGE').reduce((s, d) => s + (d.tokenCount || 0), 0);
  const ud = (u.candidatesTokenCount || 0) - billed + (u.thoughtsTokenCount || 0);
  forbrug.kald++;
  forbrug.ind += u.promptTokenCount || 0;
  forbrug.ud += ud;
  forbrug.billedTokens += billed;
  const soeg = (r?.response?.candidates || []).reduce((n, c) => n + (c?.groundingMetadata?.webSearchQueries?.length || 0), 0);
  forbrug.soegninger += soeg;
  forbrug.usd += ((u.promptTokenCount || 0) * p.ind + ud * p.ud + billed * (p.billede || 0)) / 1e6 + soeg * PRIS_SOEGNING;
}
// Skrives når processen slutter. Linjen læses af målingerne. Ændr ikke formatet.
process.on('exit', () => {
  if (forbrug.kald) console.log(`FORBRUG: ${JSON.stringify({ ...forbrug, usd: Math.round(forbrug.usd * 10000) / 10000 })}`);
});
