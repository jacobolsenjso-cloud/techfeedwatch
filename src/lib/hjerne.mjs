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
    // 25/10 (Jacob): ejerens stemme får sit EGET faste afsnit sidst ("My take", minHoldningPrompt nedenfor).
    // Brødteksten bruger holdningerne til vinkel og eksempler, men skriver ikke i første person.
    dele.push(`Let the owner's positions and experience shape the article's angle, emphasis and examples where they genuinely fit. Do NOT write first-person content in the article body - the owner's own short section is added separately at the end.`);
  } else {
    dele.push(`No stated position matches this topic: write NO first-person content (rule 18 applies in full).`);
  }
  return dele.join('\n    ');
}

// ===== "My take" (25/10-2026, Jacob: "giv din stemme sit eget faste afsnit, når emnet passer") =====
// Et kort afsnit i første person sidst i artiklen, skrevet ud fra hjernen og den FÆRDIGE artikel,
// så det kan rette sig efter netop dette emne og ikke gentager artiklens fakta.
export const MY_TAKE = 'My take';
export function minHoldningPrompt(hjerne, emneTekst, artikel, spoergsmaal) {
  const holdninger = emneAfsnit(hjerne, emneTekst);
  if (!hjerne || !holdninger.length) return null;
  return `You write a short section in the FIRST PERSON for the owner of TechFeedWatch, in his own voice, to end an article that answers "${spoergsmaal}".
Below are his own notes in Danish (who he is, his style, his positions and his experience) and the finished article. Write in English.

RULES
- 3-6 sentences, one or two short paragraphs. Plain words, calm and conversational - as if explaining over a cup of coffee. Never aggressive, never preachy, never selling anything.
- Say what HE thinks about THIS article's question, why, and - only where it truly fits - a lesson from his own experience (safety, crypto, AI tools, being hacked ...). Never boast.
- Use ONLY what his notes state. Never invent experiences, details, numbers, dates or names. Do not mention employers, places, his age, family, partner or private life.
- Do not repeat facts the article already gives; add his view. A number may only appear if the article already states it, with the same source.
- If his notes say he has no experience with the topic, say that honestly in one short clause, then give his view.
- No headings, no lists, no quotation marks around the whole text, no sign-off.
- If nothing in his notes genuinely bears on this question, output exactly NONE.

HIS NOTES
Who he is:
${(hjerne.core || '').slice(0, 6000)}

His style:
${(hjerne.voice || '').slice(0, 6000)}

His positions on this topic:
${holdninger.join('\n')}

His general positions:
${(hjerne.beliefs || '').slice(0, 4000)}

His experience:
${(hjerne.erfaringer || '').slice(0, 8000)}

THE ARTICLE
${String(artikel).split(/\n## Sources\s*\n/)[0].slice(0, 14000)}

Output ONLY the section text (or NONE).`;
}

// Kontrollerer modellens afsnit. Returnerer { ok, tekst, grund }.
const PRIVAT = /\b(54|fifty-four|girlfriend|partner|wife|children|kids|Scotland|Zealand|Sj[æa]lland|Brabrand)\b/i;
const FIRMAER = /M[æa]e?rsk|Musikhus|Concert Hall of Aarhus|AarBus|Bang\s*&\s*Olufsen|DS Dental|Beumer|Terma|Semco|Keolis|Region Midtjylland/i;
export function tjekMinHoldning(tekst, artikel) {
  const t = String(tekst || '').trim().replace(/^["“]|["”]$/g, '').replace(/^#+.*\n/, '').trim();
  if (!t || /^NONE\b/i.test(t)) return { ok: false, grund: 'ingen holdning passer til emnet' };
  const ss = t.split(/(?<=[.!?])\s+/).filter((x) => x.split(/\s+/).length >= 3);
  if (ss.length < 3 || ss.length > 7) return { ok: false, grund: `${ss.length} sætninger (skal være 3-6)` };
  if (!/\b(I|I'm|I've|my|me)\b/.test(t)) return { ok: false, grund: 'ikke i første person' };
  if (PRIVAT.test(t)) return { ok: false, grund: 'privat oplysning' };
  if (FIRMAER.test(t)) return { ok: false, grund: 'firmanavn' };
  const brod = String(artikel);
  const nyeTal = [...t.matchAll(/\d[\d,.]*/g)].map((m) => m[0].replace(/[.,]$/, '')).filter((n) => !brod.includes(n));
  if (nyeTal.length) return { ok: false, grund: `tal, artiklen ikke har: ${nyeTal.join(', ')}` };
  return { ok: true, tekst: t };
}
