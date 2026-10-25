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

// ===== Jacobs stemme flettet ind (25/10-2026) =====
// Først en "My take"-boks sidst i artiklen - Jacob: "ser latterligt ud ... find en anden løsning".
// Nu: ét almindeligt afsnit (3-6 sætninger, første person) UDEN overskrift og boks, sat ind sidst i
// den sektion, hvor hans holdning passer bedst - som en klummeskribent, der giver sin mening undervejs.
export function minHoldningPrompt(hjerne, emneTekst, artikel, spoergsmaal) {
  const holdninger = emneAfsnit(hjerne, emneTekst);
  if (!hjerne || !holdninger.length) return null;
  const brod = String(artikel).split(/\n## Sources\s*\n/)[0];
  const overskrifter = (brod.match(/^## .+$/gm) || []).map((h) => h.replace(/^## /, '').trim());
  return `You add the site owner's own voice to an article that answers "${spoergsmaal}". He runs TechFeedWatch. Below are his own notes in Danish (who he is, his style, his positions, his experience) and the finished article. Write in English.

TASK
Write his view in the FIRST PERSON as 2 or 3 SHORT paragraphs (2-3 sentences each), and for each choose the article section where it fits most naturally - different sections, so his voice appears where it matters, not in one block. Each is inserted as an ordinary paragraph at the end of its section - no heading, no box - so it must read as a natural part of the article's flow.

RULES
- Each paragraph 2-3 short sentences (5-8 sentences in total at most). Plain words, calm and conversational - as if explaining over a cup of coffee. Never aggressive, never preachy, never selling anything.
- Each paragraph must connect to what its section just said, then add what HE thinks and why - and, only where it truly fits, a lesson from his own experience (safety, crypto, AI tools, being hacked ...). Never boast.
- Use ONLY what his notes state. Never invent experiences, details, numbers, dates or names. Do not mention employers, places, his age, family, partner or private life.
- Do not repeat facts the article already gives. A number may only appear if the article already states it, with the same source.
- If his notes say he has no experience with the topic, say that honestly in one short clause, then give his view.
- No headings, no lists, no quotation marks around the whole text, no sign-off.
- If nothing in his notes genuinely bears on this question, output exactly NONE.

Output ONLY a JSON array: [{"section": "<one heading copied exactly from the list>", "text": "<the paragraph>"}, ...] with 2-3 items in different sections - or NONE.

SECTION HEADINGS
${overskrifter.map((h) => `- ${h}`).join('\n')}

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
${brod.slice(0, 14000)}`;
}

// Sætter afsnittet ind sidst i den valgte sektion (før næste "## "). Findes sektionen ikke:
// som sidste afsnit før "## Sources". Returnerer den nye markdown.
export function fletIndHoldning(md, sektion, tekst) {
  const linjer = String(md).replace(/\r\n/g, '\n').split('\n');
  const start = linjer.findIndex((l) => l.replace(/^## /, '').trim() === String(sektion || '').trim() && /^## /.test(l));
  let slut;
  if (start >= 0) {
    slut = linjer.findIndex((l, i) => i > start && /^## /.test(l));
    if (slut < 0) slut = linjer.length;
  } else {
    slut = linjer.findIndex((l) => /^## Sources\s*$/.test(l));
    if (slut < 0) slut = linjer.length;
  }
  // Bag eventuelle tomme linjer, så afsnittet står lige efter sektionens sidste tekst.
  let i = slut; while (i > 0 && !linjer[i - 1].trim()) i--;
  linjer.splice(i, 0, '', tekst.trim());
  return linjer.join('\n').replace(/\n{3,}/g, '\n\n');
}

// Kontrollerer modellens afsnit. Returnerer { ok, tekst, grund }.
const PRIVAT = /\b(54|fifty-four|girlfriend|partner|wife|children|kids|Scotland|Zealand|Sj[æa]lland|Brabrand)\b/i;
const FIRMAER = /M[æa]e?rsk|Musikhus|Concert Hall of Aarhus|AarBus|Bang\s*&\s*Olufsen|DS Dental|Beumer|Terma|Semco|Keolis|Region Midtjylland/i;
// 25/10 kl. 21:33 (Jacob: "de afsnit er for lange ... der skal være flere afsnit"): 2-3 korte afsnit
// (2-3 sætninger hver) i hver sin sektion i stedet for ét langt. Returnerer { ok, dele:[{sektion,tekst}] }.
export function tjekMinHoldning(svar, artikel) {
  const raa = String(svar || '').trim();
  if (!raa || /^NONE\b/i.test(raa)) return { ok: false, grund: 'ingen holdning passer til emnet' };
  let j = null; try { j = JSON.parse((raa.match(/\[[\s\S]*\]/) || ['null'])[0]); } catch { /* nedenfor */ }
  if (!Array.isArray(j) || !j.length) return { ok: false, grund: 'svaret var ikke en JSON-liste med section/text' };
  const brod = String(artikel);
  const dele = [];
  for (const x of j.slice(0, 3)) {
    const t = String(x?.text || '').trim().replace(/^["“]|["”]$/g, '').replace(/^#+.*\n/, '').replace(/\s*\n+\s*/g, ' ').trim();
    const sektion = String(x?.section || '').trim();
    if (!t) continue;
    const ss = t.split(/(?<=[.!?])\s+/).filter((y) => y.split(/\s+/).length >= 3);
    if (ss.length < 1 || ss.length > 3) return { ok: false, grund: `et afsnit har ${ss.length} sætninger (skal være 2-3)` };
    if (PRIVAT.test(t)) return { ok: false, grund: 'privat oplysning' };
    if (FIRMAER.test(t)) return { ok: false, grund: 'firmanavn' };
    const nyeTal = [...t.matchAll(/\d[\d,.]*/g)].map((m) => m[0].replace(/[.,]$/, '')).filter((n) => !brod.includes(n));
    if (nyeTal.length) return { ok: false, grund: `tal, artiklen ikke har: ${nyeTal.join(', ')}` };
    if (dele.some((d) => d.sektion === sektion)) continue; // højst ét afsnit pr. sektion
    dele.push({ sektion, tekst: t });
  }
  if (!dele.length) return { ok: false, grund: 'ingen brugbare afsnit' };
  if (!dele.some((d) => /\b(I|I'm|I've|my|me)\b/.test(d.tekst))) return { ok: false, grund: 'ikke i første person' };
  return { ok: true, dele };
}
