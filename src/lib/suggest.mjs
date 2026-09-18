// Finder de spørgsmål folk faktisk stiller om et emne, via Googles
// autocomplete. Gratis, ingen nøgle, intet loft i praksis.
//
// Hvorfor det her overhovedet findes: robotten valgte emne ud fra hvilket
// mærke der havde færrest artikler, søgte på YouTube efter det, og skrev en
// artikel om den video den fandt. Ingen i kæden spurgte nogensinde om nogen
// søger på det. Artiklerne var optimeret i FORM, men ikke rettet mod
// efterspørgsel.
//
// To ting blev målt før dette blev bygget:
//
// 1) Rå autocomplete duer IKKE. "quantum computing" giver "stock", "etf",
//    "companies"; "stablecoin" giver "price"; "ai video" giver "generator
//    free". Det er købs- og navigationssøgninger, som sitet hverken kan eller
//    bør betjene. Spørgsmålsformerne giver derimod rigtige spørgsmål.
//
// 2) Google gætter videre på præfikset. "how open banking" gav "how open bank
//    account online" — et helt andet behov. Derfor SKAL forslaget stadig
//    indeholde emnet, ellers kasseres det.

// Udvidet 18/9: AR & VR løb tør for ubrugte spørgsmål med de fem første
// præfikser alene. De nye giver spørgsmål, der stadig kan besvares med fakta.
const PRAEFIKSER = ['what is', 'how does', 'why', 'what are', 'how to use', 'is', 'can', 'what does', 'how much does', 'difference between', 'should i'];

// Ord der afslører en søgning sitet ikke skal skrive til: køb, kurser, priser,
// og lande-varianter der peger på lokal lovgivning vi ikke dækker.
const AFVIS = /\b(stock|stocks|etf|price|prices|buy|cheap|free|download|coupon|salary|course|courses|jobs|near me|reddit|login|sign in|app|india|uk|usa|australia|canada|denmark|nigeria|philippines|nz|singapore|ireland|pdf|ppt|book|act)\b/i;

// Slang og meme-sprog: "how are ai chips cooked" (12/9) er et rigtigt
// autocomplete-forslag, men "cooked" betyder "færdig/ødelagt" på nettet, og
// overskrifts-værnet tvang ordet ind i overskriften. Listen er kort med vilje;
// det egentlige filter er Gemini-tjekket i auto-youtube.mjs (vaelgSpoergsmaal).
const SLANG = /\b(cooked|goated|sus|cringe|rizz|lowkey|highkey|meme|memes|tier list|dank|based|mid|bussin|no cap|fr|lol|lmao|wtf|tbh)\b/i;

export async function hentForslag(emne, { timeoutMs = 8000 } = {}) {
  const ud = new Set();
  for (const p of PRAEFIKSER) {
    const q = `${p} ${emne}`;
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(q)}`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) continue;
      const j = await r.json();
      for (const s of (j[1] || [])) {
        const lav = s.toLowerCase().trim();
        if (lav === q.toLowerCase()) continue;          // selve præfikset
        if (lav.length < 12 || lav.length > 80) continue;
        if (AFVIS.test(lav) || SLANG.test(lav)) continue;
        // Google gætter videre — forslaget skal stadig handle om emnet.
        const kerne = emne.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        if (kerne.length && !kerne.some((w) => lav.includes(w))) continue;
        ud.add(lav);
      }
    } catch { /* et enkelt præfiks der fejler må ikke vælte kørslen */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return [...ud];
}
