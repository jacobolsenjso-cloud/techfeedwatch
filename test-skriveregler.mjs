// Selvtest af src/lib/skriveregler.mjs (fase 2, 6/10-2026).
// Hver test skriver OK eller FEJL, og til sidst "alt OK" eller "N FEJL" (exit 1).
// Testene bruger både tekster, der SKAL fanges, og tekster, der IKKE må fanges —
// så en regel, der holder op med at virke, får testen til at fejle. Lære fra den
// anden blog 6/10: en selvtest havde ikke testet noget i et døgn uden at sige det.
// Derfor fejler testen også, hvis den kører færre test end forventet.
//
// Brug:  node test-skriveregler.mjs                 -> selvtest
//        node test-skriveregler.mjs --artikel <fil>  -> reglernes tal for én artikel
import fs from 'fs';
import * as R from './src/lib/skriveregler.mjs';

const ai = process.argv.indexOf('--artikel');
if (ai > -1) {
  const fil = process.argv[ai + 1];
  const md = fs.readFileSync(fil, 'utf8');
  const q = (md.match(/^targetQuestion:\s*"(.*)"\s*$/m) || [])[1] || '';
  const faq = [...md.matchAll(/^\s+answer:\s*"(.*)"\s*$/gm)].map((m) => m[1]);
  const fa = R.foersteAfsnit(md), a = R.afsnitsTal(md);
  const ud = [
    `| Regel | Resultat |`, `|---|---|`,
    `| Ord i alt | ${R.antalOrd(R.brodtekst(md))} |`,
    `| Første afsnit | ${fa.ord} ord, ${fa.saetninger} sætninger (højst ${R.FOERSTE_MAKS_ORD} / ${R.FOERSTE_MAKS_SAETNINGER}) |`,
    `| Lister (mindst 2 punkter) | ${R.lister(md).length} (mindst ${R.MIN_LISTER}) |`,
    `| Afsnit | ${a.afsnit}, heraf én sætning: ${a.enSaetning}, for lange: ${a.forLange}, længste: ${a.maksOrd} ord |`,
    `| Talesprog | ${R.talesprog(md).map((x) => x.ord).join(', ') || '0'} |`,
    `| Tekst-diagrammer | ${R.tekstDiagram(md).length} |`,
    `| Uklare kilder (inkl. FAQ) | ${R.uklareKilder(md, faq).map((x) => x.ord).join(', ') || '0'} |`,
    `| Klistret søgeord | ${R.klistretSoegeord(md, q).length} |`,
  ];
  console.log(ud.join('\n'));
  process.exit(0);
}

let ok = 0, fejl = 0;
function t(navn, betingelse) {
  if (betingelse) { ok++; console.log(`OK   ${navn}`); }
  else { fejl++; console.log(`FEJL ${navn}`); }
}

// --- Sætninger og blokke ---
t('sætninger: knækker ikke efter U.S. og e.g.', R.saetninger('Data from the U.S. Bureau shows growth. Tools, e.g. ChatGPT, help.').length === 2);
t('sætninger: knækker ikke inde i et link', R.saetninger('Read [the guide. It helps](/video/x) today. Then act.').length === 2);
t('sætninger: teksten er uændret', R.saetninger('One. Two! Three?').join(' ') === 'One. Two! Three?');
t('blokke: liste lige under afsnit uden tom linje', R.blokke('Intro text here:\n- one\n- two').map((b) => b.type).join(',') === 'p,liste');
t('blokke: tom linje mellem listepunkter er samme liste', R.lister('- a\n\n- b\n\n- c').length === 1);

t('frontmatter: fjernes også med BOM foran', R.brodtekst('\uFEFF---\ntitle: "x"\n---\n\nBody text.').trim() === 'Body text.');

// --- 2a Spørgsmålsfilter ---
t('spørgsmål: lille grammatisk rettelse godkendes', R.godkendSpoergsmaal('what is ai content engine', 'what is an ai content engine').ok);
t('spørgsmål: nyt emne afvises', !R.godkendSpoergsmaal('ai chips supply chain', 'how do semiconductors work').ok);
t('spørgsmål: uændret afvises (intet at rette)', !R.godkendSpoergsmaal('what is mcp', 'What is MCP?').ok);
t('spørgsmål: lang omskrivning afvises', !R.godkendSpoergsmaal('what is rag', 'what is retrieval augmented generation rag and how does it work').ok);

// --- 2b Talesprog ---
t('talesprog: "I\'m going to show you" fanges', R.talesprog('Intro.\n\nNow I\'m going to show you the setup.').length === 1);
t('talesprog: "in this video" fanges', R.talesprog('Start.\n\nIn this video we cover pricing.').length === 1);
t('talesprog: citat i anførselstegn er tilladt', R.talesprog('As Ann puts it, "I still test every build. My team does too."').length === 0);
t('talesprog: navnet "Have I Been Pwned" er ikke en fortæller', R.talesprog('Check Have I Been Pwned for leaks.').length === 0);
t('talesprog: AI tæller ikke som "I"', R.talesprog('AI models need data.').length === 0);

// --- 2c Tekst-diagrammer ---
t('diagram: kassetegn fanges', R.tekstDiagram('Flow:\n\n┌──────┐\n│ App  │\n└──────┘').length === 1);
t('diagram: pile på flere linjer fanges', R.tekstDiagram('User --> API\nAPI --> Database').length === 1);
t('diagram: en tabel er ikke et diagram', R.tekstDiagram('| A | B |\n|---|---|\n| 1 | 2 |').length === 0);
t('diagram: én pil i en sætning er fin', R.tekstDiagram('Data flows from the app → the server in one hop.').length === 0);

// --- 2d Uklare kilder og klistrede søgeord ---
t('uklar: "Experts say" fanges', R.uklarKilde('Experts say the market will grow.') === 'Experts say');
t('uklar: "studies show" fanges', !!R.uklarKilde('Recent studies show strong adoption.'));
t('uklar: navngivet "IBM researchers found" er fint', R.uklarKilde('Last year IBM researchers found a flaw.') === null);
t('uklar: "according to data from the U.S. Bureau" er fint', R.uklareKilder('Growth was 4%, according to data from the U.S. Bureau of Labor Statistics.').length === 0);
t('uklar: "reportedly" er fint', R.uklarKilde('SpaceX is reportedly seeking new funding.') === null);
t('uklar: FAQ-svar tjekkes også', R.uklareKilder('Fine text.', ['Experts say it is safe.']).length === 1);
t('klistret: spørgsmål midt i sætning fanges', R.klistretSoegeord('Intro.\n\nUnderstanding what is canva text to video starts here.', 'what is canva text to video').length === 1);
t('klistret: som spørgsmål med "?" er fint', R.klistretSoegeord('So what is canva text to video?', 'what is canva text to video').length === 0);
t('klistret: "Wondering what is X?" fanges trods "?"', R.klistretSoegeord('Wondering what is virtual reality therapy? Read on.', 'what is virtual reality therapy').length === 1);

// --- 2e Første afsnit ---
const langt = 'One two three four five six seven eight nine ten eleven twelve. ' .repeat(6).trim();
t('første afsnit: over 60 ord er for langt', !R.foersteAfsnit(langt).ok);
const delt = R.delFoersteAfsnit(langt + '\n\n## Next\n\nMore text.');
t('første afsnit: deles efter 2. sætning', delt.delt && R.foersteAfsnit(delt.md).saetninger === 2);
t('første afsnit: ingen ord ændret ved deling', R.synlig(delt.md).split(/\s+/).join(' ') === R.synlig(langt + '\n\n## Next\n\nMore text.').split(/\s+/).join(' '));

// --- 2f Lister ---
t('lister: to lister tælles', R.lister('Text.\n\n- a\n- b\n\nMore.\n\n1. x\n2. y').length === 2);
t('lister: ét punkt er ikke en liste', R.lister('Text.\n\n- only one').length === 0);

// --- 2g Korte afsnit ---
const s = (n) => `This sentence has exactly nine words in it ${n}.`;
const fire = [1, 2, 3, 4].map(s).join(' ');
t('afsnit: 4 sætninger er for langt', R.forLangtAfsnit(fire));
t('afsnit: 2 korte sætninger er fint', !R.forLangtAfsnit([1, 2].map(s).join(' ')));
const dl = R.delLangeAfsnit(`Intro sentence here.\n\n${fire}`);
t('afsnit: deles uden at ændre ord', dl.delt === 1 && R.synlig(dl.md).split(/\s+/).join(' ') === R.synlig(`Intro sentence here.\n\n${fire}`).split(/\s+/).join(' '));
t('afsnit: første afsnit røres ikke af delLangeAfsnit', R.delLangeAfsnit(fire).delt === 0);
const efterDeling = R.afsnitsTal(dl.md);
t('afsnit: 4 sætninger deles 2+2, ikke 3+1 (ingen enkeltsætning)', efterDeling.afsnit === 3 && efterDeling.enSaetning === 1);

// --- 2h Fyld ---
const art = 'Answer first. Short.\n\nThis matters a lot for everyone today. The chip costs $40 per unit. It changes everything about the industry.';
const k = R.fyldKandidater(art);
t('fyld: sætning med tal er ikke kandidat', !k.some((x) => x.includes('$40')));
t('fyld: første afsnit er ikke kandidat', !k.includes('Answer first.'));
const fj = R.fjernSaetninger(art, ['This matters a lot for everyone today.'], 5);
t('fyld: udpeget sætning fjernes', fj.fjernet === 1 && !fj.md.includes('This matters'));
t('fyld: et afsnits eneste sætning fjernes aldrig', R.fjernSaetninger('Intro.\n\nOnly one generic sentence stands here alone.', ['Only one generic sentence stands here alone.'], 5).fjernet === 0);

// Testen må ikke kunne blive grøn uden at teste noget.
const FORVENTET = 42;
t(`antal test kørt (${ok + fejl}) >= ${FORVENTET}`, ok + fejl >= FORVENTET);
console.log(fejl ? `\n${fejl} FEJL (${ok} OK)` : `\nalt OK (${ok} test)`);
process.exit(fejl ? 1 : 0);
