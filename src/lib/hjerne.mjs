// Jacobs hjerne (trin 5 af robot-koblingen, 21/10-2026): læser mappen _hjerne
// (workflowet henter den fra det PRIVATE repo jacob-hjerne med en læsenøgle) og
// bygger den stemme-blok, skriveprompten i add-video.mjs får.
//
// BREMSEN (Jacobs ja 21/10): holdninger kommer kun med, når artiklens emne
// rammer et afsnit i emner.md - og prompten må højst skrive ÉT kort
// perspektivafsnit pr. artikel (25/10, Jacob: "mere plads, men kun der hvor det giver mening":
// 3-6 sætninger, før 2-4). Rammer intet, får prompten kun stilen.
// Findes _hjerne ikke (lokal kørsel, manglende nøgle), returnerer laesHjerne null - og
// siden 25/10 skriver robotten så INGEN artikel (add-video.mjs/omskriv-gamle.mjs stopper).
import fs from 'node:fs';

const DIR = process.env.HJERNE_DIR || '_hjerne';

// Læser hjernefilerne. null = ingen hjerne (robotten kører som før).
export function laesHjerne() {
  try {
    const l = (f) => { try { return fs.readFileSync(`${DIR}/${f}`, 'utf8').replace(/\r\n/g, '\n').trim(); } catch { return ''; } };
    const hjerne = { core: l('core.md'), voice: l('voice.md'), beliefs: l('beliefs.md'), emner: l('emner.md'), erfaringer: l('erfaringer.md') };
    return (hjerne.voice || hjerne.emner || hjerne.core) ? hjerne : null;
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
    const alle = navn.split(/[\s/&,()-]+/).filter((o) => o && !FOR_GENERELLE.has(o));
    // Ord på 4+ tegn matches som før (også "agents" i "agentic"). 25/10: korte forkortelser
    // ("ai", "ar", "vr", "seo") matches nu som HELE ord - før blev de aldrig fundet, og 104 af
    // 457 artikler (fx "how does ai affect seo") fik kun stilen, ingen holdninger.
    const lange = alle.filter((o) => o.length >= 4);
    // Korte ord KUN fra den engelske nøgleordsliste i parentesen - ikke fra de danske navne
    // ("Kodning med AI" ville ellers ramme alle AI-artikler og skubbe det rigtige emne ud).
    const noegle = (navn.match(/\(([^)]*)\)/)?.[1] || '').split(/[\s,]+/);
    const korte = noegle.filter((o) => o.length >= 2 && o.length <= 3 && /^[a-z]+$/.test(o));
    if (t.includes(navn) || lange.some((o) => t.includes(o)) || korte.some((o) => new RegExp(`\\b${o}\\b`).test(t))) ud.push(linje.trim());
  }
  // Det brede "AI & Tech" sidst, så et mere præcist emne (SEO, kodning, agenter) får pladsen først.
  ud.sort((a, b) => Number(/^- \*\*AI & Tech/.test(a)) - Number(/^- \*\*AI & Tech/.test(b)));
  return ud.slice(0, 2);
}

// Bygger blokken til skriveprompten. Stilen er altid med; holdninger (og
// erfaringer som baggrund) kun når emnet rammer. Teksterne er på dansk -
// blokken siger det, og at artiklen forbliver på engelsk.
export function stemmeBlok(hjerne, tekst) {
  if (!hjerne) return '';
  const holdninger = emneAfsnit(hjerne, tekst);
  const dele = [`SITE OWNER'S VOICE (the owner's own notes, written in Danish - the article stays in English):`];
  // 25/10: core.md (hvem Jacob er, kildekritik, opslagsværk) blev læst, men aldrig brugt. Nu altid med.
  if (hjerne.core) dele.push(`Who the owner is and why the site exists - let it shape the angle and tone:\n${hjerne.core.slice(0, 6000)}`);
  if (hjerne.voice) dele.push(`Style ideals - follow the spirit, not the wording:\n${hjerne.voice.slice(0, 6000)}`);
  if (holdninger.length) {
    dele.push(`OWNER'S STATED POSITIONS that concern this article's topic:\n${holdninger.join('\n')}`);
    // 25/10: beliefs.md blev heller aldrig brugt; erfaringer blev klippet ved 2.500 af 4.053 tegn.
    if (hjerne.beliefs) dele.push(`OWNER'S GENERAL POSITIONS (use only where one genuinely bears on this topic):\n${hjerne.beliefs.slice(0, 4000)}`);
    if (hjerne.erfaringer) dele.push(`OWNER'S OWN EXPERIENCE (background - use only what is stated, never invent more):\n${hjerne.erfaringer.slice(0, 8000)}`);
    dele.push(`EXCEPTION TO RULE 18: when the owner's position or experience above genuinely bears on the reader's question, WRITE ONE passage (3-6 sentences) in the first person, presenting the owner's stated position or experience above, placed where the article's own facts support it (often the video section or a closing section). Use ONLY what is stated above - never invent personal details, and attribute any figure to its source as usual. If the position does not genuinely bear on the reader's question, write NO first-person content at all - only where it makes sense. The passage must add the owner's view, a safety point or a lesson from his experience; it must never repeat facts the article already gives.`);
  } else {
    dele.push(`No stated position matches this topic: write NO first-person content (rule 18 applies in full).`);
  }
  return dele.join('\n    ');
}
