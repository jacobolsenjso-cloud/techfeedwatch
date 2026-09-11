// Konkrethedsværn — bruges af robotten (add-video.mjs) og audit-specificity.mjs,
// så måling og krav aldrig kommer ud af trit.
//
// Hvorfor: målt 11/9-2026 med audit-specificity.mjs havde 123 af 428 artikler
// ikke ét eneste tal, og kun 49 nævnte kilden ved navn. Prompten bad om at
// "use only well-established, generally-known facts" og "do NOT summarize" —
// så modellen skrev korrekt, men generelt. AdSense' "low value content" er
// præcis dét: tekst, der kunne stå i enhver artikel om emnet. Det, der gør en
// artikel værd at have, er det, kun denne kilde bidrog med.

// Tal med betydning: beløb, procent, årstal, mængder, enheder. Løse tal som "3 to 6" tæller ikke alene.
const TAL = /(\$|€|£)\s?\d[\d.,]*|\d[\d.,]*\s?(%|percent|million|billion|trillion|k\b|GB|TB|MB|ms|seconds|minutes|hours|days|weeks|months|years|x\b)|\b(19|20)\d\d\b/g;

export function taelTal(text) {
  return (text.match(TAL) || []).length;
}

// Nævnes kilden ved navn? Kanalnavne som "The Social Dork | Cyber Security"
// forkortes til første led før "|" — det er dét, folk kender kanalen som.
export function kildeNavn(channelTitle) {
  return String(channelTitle || '').split('|')[0].trim();
}
export function naevnerKilde(text, channelTitle) {
  const navn = kildeNavn(channelTitle);
  return navn.length >= 3 && text.includes(navn);
}

// Kravet: mindst 2 tal med betydning OG kilden nævnt ved navn én gang.
// Returnerer en liste over det, der mangler (tom = i orden).
export function manglerKonkret(text, channelTitle) {
  const mangler = [];
  if (taelTal(text) < 2) mangler.push('tal');
  if (channelTitle && !naevnerKilde(text, channelTitle)) mangler.push('kilde');
  return mangler;
}
