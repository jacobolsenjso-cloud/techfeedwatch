// Jacobs hjerne (trin 5 af robot-koblingen, 21/10-2026): læser mappen _hjerne
// (workflowet henter den fra det PRIVATE repo jacob-hjerne med en læsenøgle) og
// bygger den stemme-blok, skriveprompten i add-video.mjs får.
//
// BREMSEN (Jacobs ja 21/10): holdninger kommer kun med, når artiklens emne
// rammer et afsnit i emner.md - og prompten må højst skrive ÉT kort
// perspektivafsnit pr. artikel. Rammer intet, får prompten kun stilen.
// Findes _hjerne ikke (lokal kørsel, manglende nøgle), skriver robotten som
// før - hjernen er altid valgfri og må aldrig kunne vælte en kørsel.
import fs from 'node:fs';

const DIR = process.env.HJERNE_DIR || '_hjerne';

// Læser hjernefilerne. null = ingen hjerne (robotten kører som før).
export function laesHjerne() {
  try {
    const l = (f) => { try { return fs.readFileSync(`${DIR}/${f}`, 'utf8').replace(/\r\n/g, '\n').trim(); } catch { return ''; } };
    const hjerne = { voice: l('voice.md'), beliefs: l('beliefs.md'), emner: l('emner.md'), erfaringer: l('erfaringer.md') };
    return (hjerne.voice || hjerne.emner) ? hjerne : null;
  } catch { return null; }
}

// Finder de afsnit i emner.md, hvis emneord optræder i artiklens emne/spørgsmål/titel.
// Hvert afsnit står som "- **<Emne> (nøgleord, nøgleord …):** ...". Emneordet deles i ord
// (mindst 4 tegn; "tech" og "computing" er for generelle), og hele emnenavnet prøves også.
// 23/10: parenteser deler nu også ord — før klæbede "(" til første og ")" til sidste
// nøgleord ("(education", "certification)"), så netop de to aldrig matchede. Målt 23/10:
// to artikler (iphone-sikkerhed, programming libraries) fik "kun stil", fordi
// overskrifterne manglede engelske nøgleord — de er samtidig føjet til emner.md.
export function emneAfsnit(hjerne, tekst) {
  if (!hjerne?.emner) return [];
  const t = String(tekst || '').toLowerCase();
  const FOR_GENERELLE = new Set(['tech', 'computing', 'money', 'building']);
  const ud = [];
  for (const linje of hjerne.emner.split('\n')) {
    const m = linje.match(/^- \*\*(.+?):?\*\*/);
    if (!m) continue;
    const navn = m[1].toLowerCase();
    const ord = navn.split(/[\s/&,()-]+/).filter((o) => o.length >= 4 && !FOR_GENERELLE.has(o));
    if (t.includes(navn) || ord.some((o) => t.includes(o))) ud.push(linje.trim());
  }
  return ud.slice(0, 2);
}

// Bygger blokken til skriveprompten. Stilen er altid med; holdninger (og
// erfaringer som baggrund) kun når emnet rammer. Teksterne er på dansk -
// blokken siger det, og at artiklen forbliver på engelsk.
export function stemmeBlok(hjerne, tekst) {
  if (!hjerne) return '';
  const holdninger = emneAfsnit(hjerne, tekst);
  const dele = [`SITE OWNER'S VOICE (the owner's own notes, written in Danish - the article stays in English):`];
  if (hjerne.voice) dele.push(`Style ideals - follow the spirit, not the wording:\n${hjerne.voice.slice(0, 1800)}`);
  if (holdninger.length) {
    dele.push(`OWNER'S STATED POSITIONS that concern this article's topic:\n${holdninger.join('\n')}`);
    if (hjerne.erfaringer) dele.push(`OWNER'S OWN EXPERIENCE (background - use only what is stated, never invent more):\n${hjerne.erfaringer.slice(0, 2500)}`);
    dele.push(`EXCEPTION TO RULE 18: you MAY write at most ONE short passage (2-4 sentences) in the first person, presenting the owner's stated position or experience above, placed where the article's own facts support it (often the video section or a closing section). Use ONLY what is stated above - never invent personal details, and attribute any figure to its source as usual. If the position does not genuinely bear on the reader's question, write NO first-person content at all.`);
  } else {
    dele.push(`No stated position matches this topic: write NO first-person content (rule 18 applies in full).`);
  }
  return dele.join('\n    ');
}
