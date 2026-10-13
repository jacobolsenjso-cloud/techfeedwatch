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

// Samme som genAI.getGenerativeModel(opts), men generateContent prøver igen
// ved forbigående fejl. Brug denne i stedet for getGenerativeModel.
export function hentModel(genAI, opts) {
  const navn = opts?.model || GEMINI_MODEL;
  const m = genAI.getGenerativeModel({ model: GEMINI_MODEL, ...opts });
  return {
    generateContent: async (input) => {
      const r = await medGentag(() => m.generateContent(input));
      taelForbrug(navn, r);
      return r;
    },
  };
}

// Forbrugstæller (13/10): lægger tokens, Google-søgninger og billeder sammen for alle kald
// gennem hentModel, så prisen pr. artikel kan MÅLES i stedet for at blive skønnet.
// Priser fra ai.google.dev 12/10-2026 (USD pr. mio. tokens; fordobles 1/1-2027 for 3.8 Flash).
// Google-søgninger: 5.000 gratis pr. md. (delt), derefter 14 USD pr. 1.000 — tælles, ikke prissat.
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
  forbrug.soegninger += r?.response?.candidates?.[0]?.groundingMetadata?.webSearchQueries?.length || 0;
  forbrug.usd += ((u.promptTokenCount || 0) * p.ind + ud * p.ud + billed * (p.billede || 0)) / 1e6;
}
// Skrives når processen slutter. Linjen læses af målingerne. Ændr ikke formatet.
process.on('exit', () => {
  if (forbrug.kald) console.log(`FORBRUG: ${JSON.stringify({ ...forbrug, usd: Math.round(forbrug.usd * 10000) / 10000 })}`);
});
