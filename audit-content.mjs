// Kigger arkivet efter huller i indholdet — det audit-schema.mjs gør for
// strukturerede data, men for selve artiklerne.
//
// Findes fordi 25 artikler blev udgivet HELT uden brødtekst, og ingen opdagede
// det i tre uger. De blev fundet ved at nogen tilfældigt talte ord. Robotten
// har nu et værn mod netop dét, men den næste fejl bliver en anden — et
// manglende resumé, en FAQ der fejlede, en artikel uden kanalnavn. Det her
// script leder efter dem alle sammen, hver gang det køres.
//
// Kræver IKKE et build: det læser markdown-filerne direkte, så det kan køres
// på få sekunder efter robotten har udgivet.
//
// Brug: node audit-content.mjs
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/videos';

// Grænserne er sat efter hvad arkivet faktisk indeholder, ikke efter en
// fornemmelse. En normal artikel er 600-1200 ord; alt under 200 er en skal.
const MIN_ORD = 200;
const MIN_RESUME_ORD = 20;
const MIN_FAQ = 2;

const filer = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const fund = [];
const tilfoej = (alvor, type, fil, detalje) => fund.push({ alvor, type, fil, detalje });

for (const f of filer) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  const fm = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if (!fm) { tilfoej('fejl', 'frontmatter', f, 'ingen frontmatter overhovedet'); continue; }

  const g = (k) => raw.match(new RegExp(`^${k}:\\s*"([^"]*)"`, 'm'))?.[1] || '';
  const body = raw.slice(fm[0].length).trim();
  const ord = body ? body.split(/\s+/).length : 0;
  const isShort = /^isShort:\s*true/m.test(raw);

  // --- Brødtekst ---
  // Shorts har aldrig brødtekst, og det er med vilje. Regnes de med, drukner
  // de rigtige fund i støj.
  if (!isShort) {
    if (ord === 0) tilfoej('fejl', 'tom artikel', f, 'ingen brødtekst overhovedet');
    else if (ord < MIN_ORD) tilfoej('fejl', 'for kort', f, `${ord} ord, grænsen er ${MIN_ORD}`);
  }

  // --- Resumé ---
  // Resuméet står i boksen øverst OG i metabeskrivelsen. Mangler det, er både
  // siden og søgeresultatet tomme det sted hvor læseren beslutter sig.
  const resume = g('summary');
  const resumeOrd = resume ? resume.split(/\s+/).length : 0;
  if (!resume) tilfoej('fejl', 'intet resumé', f, 'summary mangler');
  else if (resumeOrd < MIN_RESUME_ORD) tilfoej('advarsel', 'kort resumé', f, `${resumeOrd} ord`);

  // --- Kildeangivelse ---
  // Uden kanalnavn kan artiklen ikke kreditere skaberen, og det er hele
  // grundlaget for at sitet må gøre det her.
  if (!g('channelTitle').trim()) tilfoej('fejl', 'ingen kilde', f, 'channelTitle mangler');
  if (!g('youtubeId')) tilfoej('fejl', 'ingen video', f, 'youtubeId mangler');
  if (!g('title')) tilfoej('fejl', 'ingen titel', f, 'title mangler');

  // --- FAQ ---
  const faqAntal = (raw.match(/^\s+- question:/gm) || []).length;
  if (!isShort && faqAntal === 0) tilfoej('advarsel', 'ingen FAQ', f, 'faqs mangler helt');
  else if (!isShort && faqAntal < MIN_FAQ) tilfoej('advarsel', 'tynd FAQ', f, `kun ${faqAntal} spørgsmål`);

  // --- Ting der ikke må stå i en udgivet artikel ---
  // En model der er løbet tør eller kommet i tvivl efterlader spor. De er
  // lette at overse i 388 filer og pinlige at få øje på som læser.
  //
  // Første udgave ledte efter "Lorem ipsum" og meldte to artikler — den ene
  // HANDLER om at bygge en Lorem Ipsum-generator, den anden linker bare til
  // den. Pladsholdertekst er ikke en omtale af pladsholdertekst. Derfor kræves
  // nu den klassiske fyldsætning, og kun når artiklen ikke selv har emnet.
  const handlerOmLorem = /lorem\s*ipsum/i.test(g('title') + ' ' + f);
  const spor = [
    [/lorem ipsum dolor sit amet/i, 'pladsholdertekst', handlerOmLorem],
    [/\[(TODO|PLACEHOLDER|INSERT)[^\]]*\]/i, 'pladsholder i kantparentes', false],
    [/\bAs an AI (language )?model\b/i, 'modellen taler om sig selv', false],
    [/\bI cannot\b|\bI'm sorry, but\b/i, 'afvisning fra modellen', false],
    [/^#\s/m, 'h1 i brødteksten (kun h2 og nedefter)', false],
    [/```/, 'uafsluttet kodeblok-markering', false],
  ];
  for (const [re, hvad, undtaget] of spor) {
    if (!undtaget && re.test(body)) tilfoej('fejl', 'spor i teksten', f, hvad);
  }
}

// Grupperet efter fejltype, ikke efter fil. Ellers ser 25 ens fejl ud som 25
// forskellige problemer, og man kan ikke se om noget er systematisk.
const grupper = new Map();
for (const x of fund) {
  const key = `${x.alvor}|${x.type}`;
  if (!grupper.has(key)) grupper.set(key, { ...x, filer: [] });
  grupper.get(key).filer.push({ f: x.fil, d: x.detalje });
}

const fejl = [...grupper.values()].filter((g) => g.alvor === 'fejl').sort((a, b) => b.filer.length - a.filer.length);
const advarsler = [...grupper.values()].filter((g) => g.alvor !== 'fejl').sort((a, b) => b.filer.length - a.filer.length);

const skriv = (titel, liste) => {
  console.log(`\n${titel} — ${liste.length} slags`);
  if (!liste.length) { console.log('   ingen'); return; }
  for (const g of liste) {
    console.log(`  ${String(g.filer.length).padStart(4)}x  ${g.type}`);
    for (const x of g.filer.slice(0, 4)) console.log(`        ${x.d.padEnd(34)} ${x.f.replace('.md', '').slice(0, 52)}`);
    if (g.filer.length > 4) console.log(`        ... og ${g.filer.length - 4} mere`);
  }
};

console.log(`${filer.length} artikler gennemgået`);
skriv('FEJL — bør rettes før næste udgivelse', fejl);
skriv('ADVARSLER — værd at kigge på', advarsler);

const antalFejl = fejl.reduce((s, g) => s + g.filer.length, 0);
console.log(`\n=== ${antalFejl} fejl · ${advarsler.reduce((s, g) => s + g.filer.length, 0)} advarsler`);

// Exit-kode så et workflow kan standse på det. Robotten udgav tomme artikler i
// tre uger netop fordi ingenting sagde fra.
process.exit(antalFejl > 0 ? 1 : 0);
