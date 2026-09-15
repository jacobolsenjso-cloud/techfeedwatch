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

// --- Konkrethedsscore (flyttet hertil 15/9 fra audit-specificity.mjs, så
// robotten kan kræve det samme, som auditten måler) ---------------------------
//
// Score = tal×2 + navne + citater×3 + nævner kilden×3. Navne = ord med stort
// begyndelsesbogstav midt i en sætning, som ikke er almindelige ord.
const ALMINDELIGE = new Set(['The','A','An','This','That','These','Those','It','In','On','At','For','With','By','From','To','As','And','But','Or','If','When','While','Where','Why','How','What','Which','Who','Yes','No','However','Instead','Although','Because','Beyond','Understanding','Key','Bottom','Line','Practical','Common','Core','Modern','Real','New','Future','Digital','Human','Global','Major','First','Second','Third','Finally','Ultimately','Overall','Both','Many','Most','Some','Each','Every','Another','Other','Such','Their','Its','Our','Your','His','Her','They','We','You','I','AI','Artificial','Intelligence','Machine','Learning','Large','Language','Models','Model','Data','Cloud','Internet','Web','Software','Hardware','Technology','Tech','Business','Businesses','Companies','Company','Organizations','Organisations','Users','Developers','Engineers','Security','Cybersecurity','Financial','Finance','Fintech','Crypto','Blockchain','Bitcoin','Ethereum','Quantum','Computing','Video','Videos','Content','Search','Google']);

// Brødtekst uden overskrifter og link-adresser — det, en læser faktisk ser.
export function renTekst(body) {
  return String(body || '').replace(/^#+.*$/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

export function konkretScore(body, channelTitle) {
  const tekst = renTekst(body);
  const tal = taelTal(tekst);
  const navne = new Set();
  for (const m of tekst.matchAll(/(?<=[a-z,;:]\s)([A-Z][A-Za-z0-9.+-]{2,}(?:\s[A-Z][A-Za-z0-9.+-]{2,})*)/g)) {
    const n = m[1].trim(); if (!ALMINDELIGE.has(n.split(' ')[0])) navne.add(n);
  }
  const citater = (tekst.match(/"[^"]{20,}"|\u201c[^\u201d]{20,}\u201d/g) || []).length;
  const naevnerKilde = naevnerKilde_(tekst, channelTitle) ? 1 : 0;
  return { tal, navne: navne.size, citater, naevnerKilde, score: tal * 2 + navne.size + citater * 3 + naevnerKilde * 3 };
}
// Auditten matchede på kanalnavnets første ord; robotten på hele navnet.
// Her: hele navnet, ellers første ord (>= 4 tegn), så tallene bliver ens.
function naevnerKilde_(tekst, channelTitle) {
  const navn = kildeNavn(channelTitle);
  if (navn.length < 3) return false;
  if (tekst.includes(navn)) return true;
  const foerste = navn.split(' ')[0];
  return foerste.length >= 4 && tekst.includes(foerste);
}

// Grænsen for udgivelse (indført 15/9 efter Jacobs ønske). Målt 15/9 på de
// 384 artikler: median 32, 35 % under 25, 25 % under 20. Af de 22 nye
// robot-artikler lå 11 under 25 og 6 under 20. Starter på 20 — hæves til 25,
// når robotten viser, at den kan holde det.
export const MIN_SCORE = 20;

// --- Læsbarhed --------------------------------------------------------------
// Måles, ikke ønskes: gennemsnitligt antal ord pr. sætning. Over MAX_ORD_PR_SAETNING
// bedes modellen om kortere sætninger. Grænsen er rummelig — sagprosa på engelsk
// ligger typisk på 15-20; over 24 er tung læsning.
export const MAX_ORD_PR_SAETNING = 24;
export function laesbarhed(body) {
  const tekst = renTekst(body).replace(/\s+/g, ' ').trim();
  const saetninger = tekst.split(/(?<=[.!?])\s+(?=[A-Z"\u201c(])/).filter((x) => x.split(' ').length >= 3);
  const ord = saetninger.reduce((n, x) => n + x.split(' ').length, 0);
  return { saetninger: saetninger.length, ordPrSaetning: saetninger.length ? Math.round(ord / saetninger.length * 10) / 10 : 0 };
}
