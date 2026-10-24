// AI Slop Checker-motoren (24/10-2026). Kører i browseren og i node (test).
// Måler vaner, der får tekst til at lyde generisk - IKKE om en AI skrev den.
// Ordlisten bygger på sitets egen robot: forbudt.mjs (de ord publiceringssystemet
// fjerner) og konkret.mjs (tal med betydning). Grænseværdierne er vores egne
// tommelfingerregler og står åbent på siden.

// [mønster, forslag]. Ét ord alene er fint - det er tætheden, der tæller.
export const ORD = [
  [/\bdelv(e|es|ed|ing)\b/gi, 'dig into, look at'],
  [/\btapestr(y|ies)\b/gi, 'mix'],
  [/\brealms?\b/gi, 'area, field'],
  [/\bnavigat(e|es|ed|ing)\b/gi, 'handle, deal with'],
  [/\blandscapes?\b/gi, 'field, market'],
  [/\btestaments?\b/gi, 'proof'],
  [/\bcrucial(ly)?\b/gi, 'important, key'],
  [/\brobust(ly|ness)?\b/gi, 'solid, reliable'],
  [/\bdemystif(y|ies|ied|ying)\b/gi, 'explain'],
  [/\bunlock(s|ed|ing)?\b/gi, 'open up, get'],
  [/\bunleash(es|ed|ing)?\b/gi, 'release'],
  [/\belevat(e|es|ed|ing)\b/gi, 'raise, improve'],
  [/\bseamless(ly)?\b/gi, 'smooth'],
  [/\bparadigm shifts?\b/gi, 'big change'],
  [/\bleverag(e|es|ed|ing)\b/gi, 'use'],
  [/\bharness(es|ed|ing)?\b/gi, 'use'],
  [/\bcutting[- ]edge\b/gi, 'new, latest (or say what is new)'],
  [/\bgame[- ]chang(er|ers|ing)\b/gi, 'say what actually changes'],
  [/\brevolutioni[sz](e|es|ed|ing)\b/gi, 'change'],
  [/\bever[- ]evolving\b/gi, 'changing'],
  [/\bplethora\b/gi, 'many'],
  [/\bmyriad\b/gi, 'many'],
  [/\bembark(s|ed|ing)? on\b/gi, 'start'],
  [/\bfoster(s|ed|ing)?\b/gi, 'build, encourage'],
  [/\bholistic(ally)?\b/gi, 'complete, whole'],
  [/\bsynerg(y|ies)\b/gi, 'say what works together'],
  [/\bpivotal\b/gi, 'key'],
  [/\bmeticulous(ly)?\b/gi, 'careful'],
  [/\bfirstly\b/gi, 'first'],
  [/\bmoreover\b/gi, 'also (or cut it)'],
  [/\bfurthermore\b/gi, 'also (or cut it)'],
];

// Fyldfraser: siger intet, men fylder.
export const FRASER = [
  /\bin today'?s (fast[- ]paced|digital|modern|ever[- ]changing) (world|age|landscape)\b/gi,
  /\bit(?:'s| is) (important|worth|crucial) to (note|remember|mention|understand) that\b/gi,
  /\bit(?:'s| is) worth noting\b/gi,
  /\bwhen it comes to\b/gi,
  /\bat the end of the day\b/gi,
  /\bin this (article|post|guide|blog post),? (we|you)(?:'ll| will)\b/gi,
  /\b(let'?s|we'?ll) dive (in|into|deeper)\b/gi,
  /\bdive (deep )?into\b/gi,
  /\bwithout further ado\b/gi,
  /\bin conclusion\b/gi,
  /\bplays? an? (crucial|vital|key|pivotal|important) role\b/gi,
  /\ba wide (range|array|variety) of\b/gi,
  /\bwhether you(?:'re| are) an? [\w -]{2,30} or an? [\w -]{2,30}\b/gi,
  /\bthe world of\b/gi,
  /\bstands? as a testament\b/gi,
  /\bin the (realm|world) of\b/gi,
  /\b(look|looking) no further\b/gi,
  /\bthe possibilities are endless\b/gi,
];

// Tal med betydning (samme mønster som sitets konkret.mjs).
const TAL = /(\$|€|£)\s?\d[\d.,]*|\d[\d.,]*\s?(%|percent|million|billion|trillion|k\b|GB|TB|MB|ms|seconds|minutes|hours|days|weeks|months|years|x\b)|\b(19|20)\d\d\b/g;

export function analyser(tekst) {
  const t = String(tekst || '');
  const ord = t.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || [];
  const antalOrd = ord.length;
  const saetninger = (t.match(/[^.!?\n]+[.!?]+/g) || (t.trim() ? [t] : [])).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 3);
  const fund = [];
  for (const [re, forslag] of ORD) for (const m of t.matchAll(re)) fund.push({ start: m.index, slut: m.index + m[0].length, tekst: m[0], slags: 'word', forslag });
  for (const re of FRASER) for (const m of t.matchAll(re)) fund.push({ start: m.index, slut: m.index + m[0].length, tekst: m[0], slags: 'phrase', forslag: 'cut it, or say the specific thing' });
  // Overlap: en frase vinder over et ord inde i den.
  fund.sort((a, b) => a.start - b.start || (b.slut - b.start) - (a.slut - a.start));
  const rene = [];
  for (const f of fund) if (!rene.length || f.start >= rene[rene.length - 1].slut) rene.push(f);

  const laengder = saetninger.map((s) => s.split(/\s+/).length);
  const snit = laengder.length ? laengder.reduce((a, b) => a + b, 0) / laengder.length : 0;
  const sd = laengder.length > 1 ? Math.sqrt(laengder.reduce((a, b) => a + (b - snit) ** 2, 0) / (laengder.length - 1)) : 0;
  const variation = snit ? sd / snit : 0; // lav = monoton rytme
  const starter = {};
  for (const s of saetninger) { const w = (s.match(/[A-Za-z]+/) || [''])[0].toLowerCase(); if (w) starter[w] = (starter[w] || 0) + 1; }
  const [hyppigStart, hyppigAntal] = Object.entries(starter).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  const tal = (t.match(TAL) || []).length;

  const per100 = (n) => (antalOrd ? (n / antalOrd) * 100 : 0);
  const fyldTaethed = per100(rene.length);
  const talTaethed = per100(tal);

  // Score 0-100 (højere = mere generisk). Tre dele, hver med loft, så én ting ikke dominerer.
  const delFyld = Math.min(60, fyldTaethed * 20);                       // 3 fund pr. 100 ord = 60
  const delTal = antalOrd >= 80 ? Math.max(0, 25 - talTaethed * 25) : 0; // 1 tal pr. 100 ord = 0
  const delRytme = saetninger.length >= 5 ? Math.max(0, Math.min(15, (0.45 - variation) * 50)) : 0;
  const score = Math.round(delFyld + delTal + delRytme);

  return {
    antalOrd, antalSaetninger: saetninger.length, fund: rene, score,
    dele: { fyld: Math.round(delFyld), tal: Math.round(delTal), rytme: Math.round(delRytme) },
    fyldTaethed, talTaethed, tal, variation, snit,
    gentagetStart: hyppigAntal >= 3 && saetninger.length && hyppigAntal / saetninger.length >= 0.25 ? { ord: hyppigStart, antal: hyppigAntal } : null,
  };
}
