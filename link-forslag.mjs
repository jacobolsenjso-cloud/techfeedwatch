// Foreslår 2-3 interne links i brødteksten på artikler, der ikke linker til nogen
// anden artikel. Målt 23/9: 248 artikler (juni-august) har 0 — robotten lærte
// først at linke i midten af september.
//
// Princippet: INGEN ord skrives om. Et link sættes kun på en frase, der ALLEREDE
// står i teksten, og som er målartiklens eget emne (2-4 ord fra dens søgespørgsmål
// eller titel, fx "zero trust security"). Så kan intet blive usandt eller
// ugrammatisk, og ankerteksten passer altid til målet.
//
// Regler:
//  - kun brødtekst (ikke frontmatter/FAQ, overskrifter, tabeller, kode, citater)
//  - frasen skal have mindst 2 indholdsord, og mindst ét, der ikke er generisk
//  - kilden og målet skal dele et emne-tag
//  - ankerteksten skal dele et kerneord med målets titel (samme regel som robottens ankerTjek)
//  - højst 3 links pr. artikel, i hver sin afsnit, første forekomst
//  - højst 5 nye indgående pr. mål, så ét populært emne ikke suger det hele
//  - ved lige længde vælges mål, som ingen linker til endnu
//
// Brug:  node link-forslag.mjs            -> skriver _link-forslag.html + _link-forslag.json (rører intet)
//        node link-forslag.mjs --skriv    -> indsætter PRÆCIS det, der står i _link-forslag.json
import fs from 'node:fs';
import { kerneord, stamme } from './src/lib/headline.mjs';

const D = 'src/content/videos/';
const MAX_PR_ARTIKEL = 3;
const MAX_IND_PR_MAAL = 5;
const STOP = new Set(['the','a','an','of','for','to','in','on','and','or','with','is','are','what','how','why','when','which','who','does','do','can','should','will','your','you','my','it','its','this','that','from','by','as','at','into','vs','best','top','new','use','using','used','about','explained','guide','mean','means','2024','2025','2026','way','ways']);
// Udsagnsord og småord, der gør en frase til en handling i stedet for et emne
// ("open up", "manages and executes", "builds trust" — fundet i stikprøven 23/9).
const VERBUM = new Set(['open','up','down','out','build','builds','building','change','changes','changing','reshape','reshapes','power','powers','drive','drives','boost','boosts','lower','lowers','harness','harnesses','enable','enables','automate','automates','manage','manages','execute','executes','transform','transforms','transforming','make','makes','beat','beats','fuel','fuels','show','shows','cut','cuts','democratize','democratizes','explain','defined','truly','today','now','really','impact','impacts','affect','affects','help','helps','boosting','unlock','unlocks','redefine','redefines','revolutionize','revolutionizes','work','works','and','or','but','vs','generate','generates','optimize','optimizes','create','creates','offer','offers','solve','solves','keep','keeps','matter','matters','need','needed','do','does','did']);
const GENERISK = new Set(['ai','tool','tools','technology','tech','future','data','work','business','app','apps','system','systems','digital','online','free','world','people','time','today','modern','key','power','impact','role','benefit','benefits']);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const skrivHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function laes() {
  const ud = [];
  for (const f of fs.readdirSync(D).filter((f) => f.endsWith('.md'))) {
    const raw = fs.readFileSync(D + f, 'utf8');
    const n = raw.replace(/\r\n/g, '\n');
    const m = n.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) continue;
    const fm = m[1];
    if (/^isShort:\s*true/m.test(fm)) continue;
    const tags = [...(fm.match(/^tags:\n((?:\s*-\s*.*\n?)*)/m)?.[1] || '').matchAll(/-\s*"?(.*?)"?\s*$/gm)].map((x) => x[1]);
    ud.push({
      slug: f.replace(/\.md$/, ''), fil: D + f, raw, crlf: raw.includes('\r\n'),
      title: fm.match(/^title:\s*"(.*?)"/m)?.[1] || '',
      q: fm.match(/^targetQuestion:\s*"(.*?)"/m)?.[1] || '',
      tags, fmLen: m[0].length, body: n.slice(m[0].length),
    });
  }
  return ud;
}

// 2-4-ords fraser fra en tekst: ingen stopord i kanterne, mindst 2 indholdsord,
// mindst ét ikke-generisk. Længste først.
function fraser(tekst) {
  const ord = tekst.toLowerCase().replace(/[?!.,:;"()]/g, ' ').split(/\s+/).filter(Boolean);
  const ud = new Set();
  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i + n <= ord.length; i++) {
      const g = ord.slice(i, i + n);
      if (STOP.has(g[0]) || STOP.has(g[n - 1])) continue;
      if (g.some((w) => VERBUM.has(w))) continue;
      const indhold = g.filter((w) => !STOP.has(w));
      if (indhold.length < 2) continue;
      if (!indhold.some((w) => !GENERISK.has(w))) continue;
      ud.add(g.join(' '));
    }
  }
  return [...ud].sort((a, b) => b.split(' ').length - a.split(' ').length);
}

// Linjer i brødteksten, hvor et link må sættes.
function tilladtLinje(l) {
  const t = l.trim();
  return t && !/^(#|\||```|>|!\[|<)/.test(t);
}

function findForslag(alle) {
  const ind = new Map();
  for (const a of alle) for (const m of a.raw.matchAll(/\]\(\/video\/([^)\/\s#?]+)/g)) ind.set(m[1], (ind.get(m[1]) || 0) + 1);
  const kilder = alle.filter((a) => !/\]\(\/video\//.test(a.body));
  const nyeInd = new Map();
  const plan = [];
  // Mål-fraser beregnes én gang
  const emneStammer = (x) => new Set(kerneord(`${x.title} ${x.q}`).map(stamme).filter((w) => w !== 'ai' && !GENERISK.has(w)));
  const maal = alle.map((t) => ({ ...t, fraser: fraser(`${t.q} . ${t.title}`), titelStammer: new Set(kerneord(t.title).map(stamme).filter((w) => w !== 'ai')), emne: emneStammer(t) }));
  // Alle kendte emne-fraser på sitet: bruges til at se, om et fund kun er en DEL
  // af et længere begreb ("engine optimization" inde i "search engine optimization").
  const alleFraser = new Set(maal.flatMap((t) => t.fraser));
  for (const s of kilder) {
    const linjer = s.body.split('\n');
    const kandidater = [];
    const sEmne = emneStammer(s);
    for (const t of maal) {
      if (t.slug === s.slug) continue;
      if (!t.tags.some((x) => s.tags.includes(x))) continue;
      // Samme emne: kilde og mål skal dele et kerneord i titel/spørgsmål (ikke "AI" eller generiske ord).
      if (![...t.emne].some((w) => sEmne.has(w))) continue;
      for (const fr of t.fraser) {
        const re = new RegExp(`(?<![A-Za-z0-9-])${fr.split(' ').map(esc).join('\\s+')}(?![A-Za-z0-9-])`, 'i');
        const renset = (l) => l.replace(/\[[^\]]*\]\([^)]*\)/g, (x) => ' '.repeat(x.length));
        const lineNo = linjer.findIndex((l) => tilladtLinje(l) && re.test(renset(l)));
        if (lineNo < 0) continue;
        const linje = renset(linjer[lineNo]);
        const m = linje.match(re);
        const anker = linjer[lineNo].substr(m.index, m[0].length);
        // Del af et længere begreb? Ordet før eller efter + frasen er selv en kendt frase.
        const foer = (linje.slice(0, m.index).match(/([A-Za-z0-9-]+)\s+$/) || [])[1];
        const efter = (linje.slice(m.index + m[0].length).match(/^\s+([A-Za-z0-9-]+)/) || [])[1];
        const lav = anker.toLowerCase().replace(/\s+/g, ' ');
        if ((foer && alleFraser.has(`${foer.toLowerCase()} ${lav}`)) || (efter && alleFraser.has(`${lav} ${efter.toLowerCase()}`))) continue;
        if (foer && /^(search|generative|answer|large|deep|machine)$/i.test(foer)) continue;
        // Del af et produktnavn: "Google Cloud" i "Google Cloud BigQuery".
        if (efter && /^[A-Z]/.test(efter) && /[A-Z]/.test(anker.split(/\s+/).pop()[0])) continue;
        if (!kerneord(anker).map(stamme).some((w) => t.titelStammer.has(w))) continue;
        kandidater.push({ maal: t.slug, maalTitel: t.title, anker, lineNo, laengde: fr.split(' ').length, forældreløs: !ind.get(t.slug) });
        break; // længste frase for dette mål
      }
    }
    kandidater.sort((a, b) => b.laengde - a.laengde || b.forældreløs - a.forældreløs || a.lineNo - b.lineNo);
    const valgt = [];
    const brugteLinjer = new Set();
    const brugteAnkre = [];
    for (const k of kandidater) {
      if (valgt.length >= MAX_PR_ARTIKEL) break;
      if (brugteLinjer.has(k.lineNo)) continue;
      if ((nyeInd.get(k.maal) || 0) >= MAX_IND_PR_MAAL) continue;
      if (brugteAnkre.some((a) => a.toLowerCase().includes(k.anker.toLowerCase()) || k.anker.toLowerCase().includes(a.toLowerCase()))) continue;
      valgt.push(k); brugteLinjer.add(k.lineNo); brugteAnkre.push(k.anker);
      nyeInd.set(k.maal, (nyeInd.get(k.maal) || 0) + 1);
    }
    plan.push({ kilde: s.slug, kildeTitel: s.title, links: valgt.map(({ maal, maalTitel, anker, lineNo, forældreløs }) => ({ maal, maalTitel, anker, lineNo, forældreløs, saetning: saetning(linjer[lineNo], anker) })) });
  }
  return { plan, ind };
}

function saetning(linje, anker) {
  const i = linje.toLowerCase().indexOf(anker.toLowerCase());
  const p = linje.lastIndexOf('. ', i);
  const start = p < 0 ? 0 : p + 2;
  let slut = linje.indexOf('. ', i + anker.length);
  slut = slut < 0 ? linje.length : slut + 1;
  return linje.slice(start, slut);
}

function skriv() {
  const { plan } = JSON.parse(fs.readFileSync('_link-forslag.json', 'utf8'));
  const alle = new Map(laes().map((a) => [a.slug, a]));
  let filer = 0, links = 0, sprunget = 0;
  for (const p of plan) {
    if (!p.links.length) continue;
    const a = alle.get(p.kilde);
    if (!a) { sprunget += p.links.length; continue; }
    const linjer = a.body.split('\n');
    let n = 0;
    for (const l of p.links) {
      const linje = linjer[l.lineNo] ?? '';
      const i = linje.indexOf(l.anker);
      // Sikkerhed: linjen skal stadig indeholde præcis den frase, vi viste Jacob.
      if (i < 0 || !fs.existsSync(`${D}${l.maal}.md`)) { sprunget++; continue; }
      linjer[l.lineNo] = `${linje.slice(0, i)}[${l.anker}](/video/${l.maal}/)${linje.slice(i + l.anker.length)}`;
      n++;
    }
    if (!n) continue;
    const nl = a.crlf ? '\r\n' : '\n';
    const ny = a.raw.replace(/\r\n/g, '\n').slice(0, a.fmLen) + linjer.join('\n');
    fs.writeFileSync(a.fil, a.crlf ? ny.replace(/\n/g, nl) : ny, 'utf8');
    filer++; links += n;
  }
  console.log(`Skrevet: ${links} links i ${filer} artikler. Sprunget over (teksten ændret siden forslaget): ${sprunget}.`);
}

if (process.argv.includes('--skriv')) { skriv(); process.exit(0); }

const alle = laes();
const { plan, ind } = findForslag(alle);
fs.writeFileSync('_link-forslag.json', JSON.stringify({ lavet: new Date().toISOString(), plan }, null, 1));
const med = plan.filter((p) => p.links.length);
const total = med.reduce((s, p) => s + p.links.length, 0);
const fordeling = [0, 1, 2, 3].map((k) => plan.filter((p) => p.links.length === k).length);
const nyeMaal = new Set(med.flatMap((p) => p.links.map((l) => l.maal)));
const loeste = [...nyeMaal].filter((m) => !ind.get(m)).length;
const html = `<!doctype html><meta charset="utf-8"><title>Link-forslag</title>
<style>body{font:15px/1.5 system-ui;max-width:900px;margin:24px auto;padding:0 16px}h2{font-size:16px;margin:22px 0 4px}li{margin:6px 0}mark{background:#fde68a;padding:0 2px}.m{color:#555;font-size:13px}.o{color:#b45309;font-size:12px}</style>
<h1>Interne link-forslag — ${plan.length} artikler uden links til andre artikler</h1>
<p><b>${total} links i ${med.length} artikler.</b> Pr. artikel: 0 links ${fordeling[0]}, 1 link ${fordeling[1]}, 2 links ${fordeling[2]}, 3 links ${fordeling[3]}.
${nyeMaal.size} forskellige mål, heraf ${loeste} som i dag ingen linker til. Ingen ord ændres — kun den gule frase bliver et link.</p>
${med.map((p) => `<h2>${skrivHtml(p.kildeTitel)}</h2><ol>${p.links.map((l) => `<li>…${skrivHtml(l.saetning).replace(skrivHtml(l.anker), `<mark>${skrivHtml(l.anker)}</mark>`)}…<br><span class="m">→ ${skrivHtml(l.maalTitel)}</span>${l.forældreløs ? ' <span class="o">(ingen linker hertil i dag)</span>' : ''}</li>`).join('')}</ol>`).join('\n')}`;
fs.writeFileSync('_link-forslag.html', html);
console.log(`Kilder uden links: ${plan.length}. Forslag: ${total} links i ${med.length} artikler. Fordeling 0/1/2/3: ${fordeling.join('/')}. Mål: ${nyeMaal.size}, heraf ${loeste} forældreløse i dag.`);
