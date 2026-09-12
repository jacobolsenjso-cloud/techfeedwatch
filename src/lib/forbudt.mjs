// Forbudte ord — deterministisk oprydning EFTER modellen har skrevet.
//
// Hvorfor: prompten har haft en "BANNED WORDS"-liste længe, og alligevel stod
// der "testament" og "unleash" i to af tre testartikler 12/9. En sprogmodel
// overholder ikke en negativ liste pålideligt — så listen håndhæves her, hvor
// den ikke kan overhøres. Ordene er de sædvanlige "AI-skrivning"-markører;
// Google og læsere genkender dem på afstand.
//
// Erstatningerne er bevidst neutrale. Et ord der ikke kan erstattes uden at
// ødelægge sætningen (fx "in conclusion" som optakt) fjernes, og sætningen
// får stort begyndelsesbogstav igen.

// [mønster, erstatning]. Mønstrene tager de almindelige bøjninger med.
const REGLER = [
  [/\bdelv(e|es|ed|ing)\b/gi, (m, e) => ({ e: 'dig', es: 'digs', ed: 'dug', ing: 'digging' })[e.toLowerCase()]],
  [/\btapestr(y|ies)\b/gi, (m, e) => (e.toLowerCase() === 'y' ? 'mix' : 'mixes')],
  [/\brealms?\b/gi, (m) => (m.endsWith('s') ? 'areas' : 'area')],
  [/\bnavigat(e|es|ed|ing)\b/gi, (m, e) => ({ e: 'handle', es: 'handles', ed: 'handled', ing: 'handling' })[e.toLowerCase()]],
  [/\blandscapes?\b/gi, (m) => (m.endsWith('s') ? 'fields' : 'field')],
  [/\b(is|are|was|were|remains|stands as|serves as)\s+a\s+testament\s+to\b/gi, (m, v) => `${v} proof of`],
  [/\ba\s+testament\s+to\b/gi, 'proof of'],
  [/\btestaments?\b/gi, 'proof'],
  [/\bcrucial(ly)?\b/gi, (m, ly) => (ly ? 'critically' : 'critical')],
  [/\brobust(ly|ness)?\b/gi, (m, s) => ({ '': 'solid', ly: 'solidly', ness: 'solidity' })[(s || '').toLowerCase()]],
  [/\bdemystif(y|ies|ied|ying)\b/gi, (m, e) => ({ y: 'explain', ies: 'explains', ied: 'explained', ying: 'explaining' })[e.toLowerCase()]],
  [/\bunlock(s|ed|ing)?\b/gi, (m, s) => ({ '': 'open up', s: 'opens up', ed: 'opened up', ing: 'opening up' })[(s || '').toLowerCase()]],
  [/\bunleash(es|ed|ing)?\b/gi, (m, s) => ({ '': 'release', es: 'releases', ed: 'released', ing: 'releasing' })[(s || '').toLowerCase()]],
  [/\belevat(e|es|ed|ing)\b/gi, (m, e) => ({ e: 'raise', es: 'raises', ed: 'raised', ing: 'raising' })[e.toLowerCase()]],
  [/\bseamless(ly)?\b/gi, (m, ly) => (ly ? 'smoothly' : 'smooth')],
  [/\bparadigm shifts?\b/gi, (m) => (m.endsWith('s') ? 'fundamental shifts' : 'fundamental shift')],
  // Optakter fjernes helt. Stod de først i sætningen (stort I), får næste ord
  // stort bogstav, så sætningen stadig begynder rigtigt.
  [/\b(I|i)n today'?s digital age,?\s*([a-z])?/g, (m, i, b) => (b ? (i === 'I' ? b.toUpperCase() : b) : '')],
  [/\b(I|i)n conclusion,?\s*([a-z])?/g, (m, i, b) => (b ? (i === 'I' ? b.toUpperCase() : b) : '')],
  [/\b(M|m)oreover,?\s*([a-z])?/g, (m, i, b) => (b ? (i === 'M' ? b.toUpperCase() : b) : '')],
  [/\b(F|f)urthermore,?\s*([a-z])?/g, (m, i, b) => (b ? (i === 'F' ? b.toUpperCase() : b) : '')],
  [/\bfirstly\b/gi, 'first'],
  // Læseren ved ikke, at der findes et "source material" — det er robottens ord, ikke artiklens.
  [/,?\s*\bas (?:stated|noted|mentioned|described|outlined|explained) in the (?:source material|transcript|source)\b/gi, ''],
  [/\b(?:according to|per) the (?:source material|transcript)\b,?\s*/gi, ''],
];

// Finder de forbudte ord der står i teksten (til logning og audit).
export function findForbudte(text) {
  const fundne = new Set();
  for (const [re] of REGLER) {
    for (const m of String(text).matchAll(re)) fundne.add(m[0].replace(/,.*$/, '').trim().toLowerCase());
  }
  return [...fundne];
}

// Bevarer stort begyndelsesbogstav, når det oprindelige ord havde det.
function medKasse(original, ny) {
  if (!ny) return ny;
  return /^[A-Z]/.test(original) ? ny.charAt(0).toUpperCase() + ny.slice(1) : ny;
}

export function fjernForbudteOrd(text) {
  let t = String(text);
  for (const [re, erstat] of REGLER) {
    t = t.replace(re, (...args) => {
      const ny = typeof erstat === 'function' ? erstat(...args) : erstat;
      return medKasse(args[0], ny ?? args[0]);
    });
  }
  return t.replace(/[ \t]{2,}/g, ' ');
}
