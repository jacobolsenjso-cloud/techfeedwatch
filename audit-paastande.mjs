// Vagten over påstandene — finder de steder, hvor sitet siger noget, der
// kan være holdt op med at være sandt, uden at nogen ville opdage det.
//
// HVORFOR DEN FINDES: målt 21/9-2026 indeholder 295 af 390 artikler en
// tidsbunden påstand, og 152 har en HÅRD påstand — et konkret tal eller en
// navngiven version. To af dem var allerede forkerte den dag, jeg målte:
// "Gemini 3.6 Flash is Google's fastest AI model to date" (3.8 var udkommet)
// og "the latest version, powered by Gemini 3.5 Flash, is available now".
// Begge var sande, da de blev skrevet. Problemet er ikke, at de blev
// forkerte — det er, at INTET ville have opdaget det. Samme fejlform som
// den grønne IndexNow-kørsel, der ikke sendte noget, og de 25 tomme
// artikler, der lå ude i tre uger.
//
// HVAD DEN IKKE GØR: den afgør ikke, om en påstand er sand. Det kræver en
// kilde uden for sitet og koster penge pr. artikel. Den finder de steder,
// hvor en påstand har en INDBYGGET udløbsdato — det kan afgøres med
// sikkerhed uden at spørge nogen, og det er gratis og altid det samme svar.
//
// Fem regler, alle deterministiske:
//   1. UDLØBET DATO      "by 2025" når vi skriver 2026. Sikker fejl.
//   2. SITET MODSIGER SIG SELV
//                        én artikel kalder Gemini 3.6 den nyeste, en anden
//                        nævner 3.8. Kræver ingen viden udefra — kun at
//                        sammenligne sitet med sig selv.
//   3. SUPERLATIV PÅ PRODUKT
//                        "den hurtigste model to date". Udløber ved næste
//                        udgivelse, og det sker hver 3.-4. uge.
//   4. RELATIV TID       "early last year", "recently". Ordene rådner uden
//                        at teksten ændrer sig.
//   5. UINDFRIET SIKKERHED
//                        "currently" uden noget tal bagved. Der er ingen
//                        påstand at tjekke — ordet kan bare slettes.
//
// Brug:
//   node audit-paastande.mjs              skriver rapport + register
//   node audit-paastande.mjs --kun=1,2    kun udvalgte regler
//   node audit-paastande.mjs --stille     kun opsummering

import fs from 'node:fs';
import path from 'node:path';

const MAPPE = 'src/content/videos';
const REGISTER = 'paastande.json';
const RAPPORT = 'paastande-rapport.md';
const I_DAG = new Date().toISOString().slice(0, 10);
const AAR_NU = Number(I_DAG.slice(0, 4));

const args = process.argv.slice(2);
const stille = args.includes('--stille');
const kun = args.find((a) => a.startsWith('--kun='))?.slice(6).split(',').map(Number);

// Produkter vi følger versioner på. Listen er bevidst kort: den skal kun
// rumme det, sitet FAKTISK skriver om ofte nok til at modsige sig selv.
const PRODUKTER = ['Gemini', 'GPT', 'Claude', 'Llama', 'Grok', 'Mistral', 'DeepSeek', 'Qwen'];

function artikler() {
  return fs.readdirSync(MAPPE).filter((n) => n.endsWith('.md')).sort().map((n) => {
    const raa = fs.readFileSync(path.join(MAPPE, n), 'utf8');
    const [, fm = '', krop = ''] = raa.split(/^---$/m);
    // FAQ-svarene tæller med: de står i JSON-LD og bliver citeret direkte
    // af AI-svarmaskiner, så en forkert påstand dér rejser længere end
    // én inde i brødteksten.
    const svar = [...fm.matchAll(/answer:\s*"([^"]*)"/g)].map((m) => m[1]).join(' ');
    return { fil: n, titel: (fm.match(/^title:\s*"([^"]*)"/m) || [])[1] || n, tekst: `${krop} ${svar}` };
  });
}

// Én sætning ad gangen, så rapporten kan vise præcis dét, der skal rettes.
const saetninger = (t) => t.split(/(?<=[.!?])\s+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 25 && s.length < 400);

// --- regel 2 har brug for at vide, hvilke versioner sitet selv nævner ---
function nyesteVersioner(alle) {
  const set = new Map(); // produkt -> højeste version som tal
  for (const a of alle) {
    for (const m of a.tekst.matchAll(new RegExp(`\\b(${PRODUKTER.join('|')})[-\\s]?(\\d+(?:\\.\\d+)?)\\b`, 'gi'))) {
      const p = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
      const v = parseFloat(m[2]);
      if (!Number.isNaN(v) && (!set.has(p) || v > set.get(p))) set.set(p, v);
    }
  }
  return set;
}

const SUPERLATIV = /\b(?:the (?:fastest|latest|newest|most powerful|most advanced|most capable|best|largest|cheapest)|to date|so far|state[- ]of[- ]the[- ]art|currently the)\b/i;
// "by 2024" er kun en fejl, hvis sætningen PEGER FREMAD. Første udgave
// meldte "By 2024, Common Crawl had indexed 2.7 billion pages" som udløbet
// — men det er historie, ikke en forudsigelse, og historie forældes ikke.
// Fire af syv fund var den slags. Nu kræves et fremadrettet verbum.
const FREMAD = /\b(?:will|would|expected|projected|predict\w*|forecast\w*|suggest\w*|estimate[sd]?|anticipat\w*|aims?|roadmap|set to|on track|could (?:reach|hit|become|grow))\b/i;
// "the latest news" er ikke en påstand om et produkt. Den slags almene
// vendinger stod for det eneste falske fund i regel 3.
const ALMEN_NYESTE = /\bthe latest (?:news|information|updates?|trends?|data|research|developments?)\b/i;

const RELATIV = /\b(?:early last year|late last year|last year|this year|next year|last month|recently|these days|as of (?:today|now)|right now)\b/i;
const BLOED = /\b(?:currently|at present|the latest|newest|expected to|projected to|is set to)\b/i;
const HAARD = /(?:\$\s?\d|\b\d[\d.,]*\s?(?:billion|million|trillion|percent|%|GB|TB|GHz|ms|tokens?|qubits?|ETH|BTC)\b|\b(?:GPT|Gemini|Claude|Llama|Grok|Mistral|DeepSeek|Qwen)[-\s]?\d)/i;

function find(alle) {
  const nyeste = nyesteVersioner(alle);
  const fund = [];
  const tilfoej = (regel, navn, a, s, hvorfor) => {
    if (kun && !kun.includes(regel)) return;
    fund.push({ regel, navn, fil: a.fil, titel: a.titel, saetning: s.slice(0, 300), hvorfor });
  };

  for (const a of alle) {
    for (const s of saetninger(a.tekst)) {
      // 1. Udløbet dato — sikker fejl, ingen vurdering nødvendig.
      for (const m of s.matchAll(/\bby (20\d\d)\b/gi)) {
        const aar = Number(m[1]);
        if (aar < AAR_NU && FREMAD.test(s)) tilfoej(1, 'udløbet dato', a, s, `forudsigelse om "${aar}" — året er passeret`);
      }
      // 2. Sitet modsiger sig selv om en version.
      for (const m of s.matchAll(new RegExp(`\\b(${PRODUKTER.join('|')})[-\\s]?(\\d+(?:\\.\\d+)?)\\b`, 'gi'))) {
        const p = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
        const v = parseFloat(m[2]);
        const top = nyeste.get(p);
        if (top && v < top && SUPERLATIV.test(s)) {
          tilfoej(2, 'sitet modsiger sig selv', a, s, `kalder ${p} ${v} nyest/bedst, men sitet nævner selv ${p} ${top}`);
        }
      }
      // 3. Superlativ om et navngivet produkt — udløber ved næste udgivelse.
      if (SUPERLATIV.test(s) && new RegExp(`\\b(?:${PRODUKTER.join('|')})\\b`, 'i').test(s) && !ALMEN_NYESTE.test(s)) {
        tilfoej(3, 'superlativ med udløbsdato', a, s, 'superlativ om et navngivet produkt');
      }
      // 4. Relativ tid — ordene rådner, teksten står stille.
      if (RELATIV.test(s) && HAARD.test(s)) {
        tilfoej(4, 'relativ tid', a, s, `"${s.match(RELATIV)[0]}" betyder noget andet nu end da det blev skrevet`);
      }
    }
    // 5. Uindfriet sikkerhed — hele artiklen, ikke sætningen: siger den
    //    "currently" uden nogen steder at have et tal, er der intet at tjekke.
    if (BLOED.test(a.tekst) && !HAARD.test(a.tekst)) {
      tilfoej(5, 'uindfriet sikkerhed', a, (a.tekst.match(new RegExp(`[^.!?]*${BLOED.source}[^.!?]*[.!?]`, 'i')) || [''])[0].replace(/\s+/g, ' ').trim(), 'sikker formulering uden et eneste konkret tal');
    }
  }
  return fund;
}

function main() {
  const alle = artikler();
  if (!alle.length) { console.error('❌ Fandt ingen artikler i ' + MAPPE); process.exit(1); }
  const fund = find(alle);

  // Registeret husker, hvornår en påstand først blev set, så vi kan se, hvad
  // der er NYT siden sidst, i stedet for at læse den samme liste forfra.
  const foer = fs.existsSync(REGISTER) ? JSON.parse(fs.readFileSync(REGISTER, 'utf8')) : {};
  const nu = {};
  let nye = 0;
  for (const f of fund) {
    const id = `${f.fil}#${f.regel}#${f.saetning.slice(0, 60)}`;
    nu[id] = { ...f, foersteGang: foer[id]?.foersteGang || I_DAG };
    if (!foer[id]) nye++;
  }
  const loest = Object.keys(foer).filter((id) => !nu[id]).length;

  const grupper = new Map();
  for (const f of Object.values(nu)) {
    if (!grupper.has(f.regel)) grupper.set(f.regel, []);
    grupper.get(f.regel).push(f);
  }

  const L = [];
  L.push(`# Påstande der kan være holdt op med at passe`, '');
  L.push(`Målt ${I_DAG} på ${alle.length} artikler. **${fund.length} fund**, heraf ${nye} nye siden sidste kørsel og ${loest} forsvundet (rettet eller omskrevet).`, '');
  L.push('Vagten afgør ikke, om en påstand er sand — den finder de steder, hvor en påstand har en indbygget udløbsdato. Regel 1 og 2 er sikre fejl. Regel 3, 4 og 5 kræver, at et menneske kigger.', '');
  for (const regel of [...grupper.keys()].sort()) {
    const g = grupper.get(regel);
    L.push(`## Regel ${regel} — ${g[0].navn} (${g.length})`, '');
    for (const f of g.slice(0, 40)) {
      L.push(`- **${f.titel}**  \n  \`${f.fil}\` · ${f.hvorfor} · først set ${f.foersteGang}  \n  > ${f.saetning}`, '');
    }
    if (g.length > 40) L.push(`… og ${g.length - 40} mere i ${REGISTER}.`, '');
  }
  fs.writeFileSync(RAPPORT, L.join('\n'));
  fs.writeFileSync(REGISTER, JSON.stringify(nu, null, 1));

  if (!stille) {
    for (const regel of [...grupper.keys()].sort()) {
      const g = grupper.get(regel);
      console.log(`  regel ${regel} · ${g[0].navn}: ${g.length}`);
    }
  }
  console.log(`${fund.length} fund i ${alle.length} artikler · ${nye} nye · ${loest} forsvundet siden sidst`);
  console.log(`Skrevet: ${RAPPORT} og ${REGISTER}`);

  // Vagten må ALDRIG standse robottens udgivelse: et forældet tal i en to
  // måneder gammel artikel er ingen grund til at holde dagens artikel
  // tilbage. Derfor kode 0, også når der er fund.
  //
  // Men vagten skal kunne fejle på SIG SELV. Finder den nul i et arkiv,
  // hvor der målt var hundredvis, er det værktøjet der er i stykker — og
  // en tavs grøn kørsel ville skjule præcis det. Det var fejlen i IndexNow.
  if (!fund.length) {
    console.error('❌ Nul fund i hele arkivet. Det er usandsynligt — mistro værktøjet, ikke arkivet.');
    process.exit(1);
  }
}

main();
