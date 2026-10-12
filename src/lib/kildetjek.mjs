// Kontroller til opskriften "søgning først, video som supplement" (fase B, 12/10-2026).
// Alt her er deterministisk (ingen modelkald), så det kan selvtestes og måles ens hver gang.
//
//  - videoAfsnit: det ene H2-afsnit om videoen (overskriften nævner kanalen)
//  - videoAndel: hvor stor en del af artiklen der er videoens indhold
//  - talUdenKilde: sætninger med tal, der ikke nævner, hvor tallet kommer fra
//  - kildeliste: "## Sources" nederst, bygget af koden — ikke af modellen
import { kildeNavn } from './konkret.mjs';
import { brugteFakta } from './faktaark.mjs';
import { domaeneLed, udgivernavne } from './soegning.mjs';

export const VIDEO_ANDEL_MAAL = 0.25;   // det, prompten beder om
export const VIDEO_ANDEL_MAKS = 0.30;   // stop-grænse (lidt luft til målestøj)
export const MAKS_TAL_UDEN_KILDE = 1;   // flere end dette efter rettelse = ingen artikel
export const MIN_KILDER_BRUGT = 2;      // mindst så mange websider skal nævnes i teksten

const ord = (s) => String(s).split(/\s+/).filter(Boolean).length;
const udenLinks = (s) => String(s).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

// Deler artiklen i afsnit med deres H2. Overskrifter tæller ikke som tekst.
export function afsnitMedH2(md) {
  const ud = [];
  let h2 = null;
  for (const blok of String(md).replace(/\r/g, '').split(/\n\s*\n/)) {
    const b = blok.trim();
    if (!b) continue;
    const h = b.match(/^##\s+(.+)$/m);
    if (h && /^#{2}\s/.test(b)) { h2 = h[1].trim(); const rest = b.replace(/^##\s+.+$/m, '').trim(); if (rest) ud.push({ h2, tekst: rest }); continue; }
    if (/^#{3,}\s/.test(b)) continue;
    ud.push({ h2, tekst: b });
  }
  return ud;
}

// Er overskriften videoens afsnit? Den skal nævne kanalen (hele navnet eller dets første ord på mindst 4 tegn).
export function erVideoOverskrift(h2, channelTitle) {
  const navn = kildeNavn(channelTitle);
  if (!h2 || navn.length < 2) return false;
  const h = h2.toLowerCase();
  if (h.includes(navn.toLowerCase())) return true;
  const foerste = navn.split(/\s+/)[0];
  return foerste.length >= 4 && h.includes(foerste.toLowerCase());
}
export function videoAfsnit(md, channelTitle) {
  const h2er = [...new Set(afsnitMedH2(md).map((a) => a.h2).filter(Boolean))];
  return h2er.filter((h) => erVideoOverskrift(h, channelTitle));
}

// Sætninger i et tekststykke. Listepunkter er hver sin sætning.
export function saetninger(tekst) {
  const ud = [];
  for (const linje of udenLinks(tekst).split('\n')) {
    const l = linje.replace(/^\s*([-*]|\d+\.)\s+/, '').replace(/[*_]/g, '').trim();
    if (!l || /^\|?\s*:?-{3,}/.test(l)) continue;
    for (const s of l.split(/(?<=[.!?]["”']?)\s+(?=["“(]?[A-Z0-9$])/)) if (s.trim()) ud.push(s.trim());
  }
  return ud;
}

// Video-andel = ord i videoens afsnit + ord i sætninger andre steder, der bruger et
// punkt fra videoens faktaark, som ikke også står i søge-fakta (de har en webkilde).
// Hellere for streng end for blød: et navn fra videoen tæller, hvor det end står.
export function videoAndel(md, channelTitle, videoFakta, soegTekst = '') {
  const kunVideo = (videoFakta || []).filter((f) => !brugteFakta(soegTekst, [f]).length);
  let ialt = 0, video = 0, afsnitOrd = 0;
  for (const a of afsnitMedH2(md)) {
    if (/^sources$/i.test(a.h2 || '')) continue;
    const iVideo = erVideoOverskrift(a.h2, channelTitle);
    for (const s of saetninger(a.tekst)) {
      const n = ord(s);
      ialt += n;
      if (iVideo) { video += n; afsnitOrd += n; } else if (brugteFakta(s, kunVideo).length) video += n;
    }
  }
  return { andel: ialt ? video / ialt : 0, ialt, video, afsnitOrd };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function harKildenavn(s, navne) {
  return navne.some((n) => (/^[a-z0-9-]+$/.test(n) ? new RegExp(`\\b${esc(n)}\\b`, 'i').test(s) : s.includes(n)));
}

// Et tal, der er en påstand: beløb, procent, mængde med enhed, store tal (10,626 / 30458).
// Rene årstal tæller ikke (en dato er ikke en statistik) — taelTal i konkret.mjs tæller
// dem med og overser store tal uden enhed, derfor en egen regel her.
// Tekniske enheder tilføjet 12/10: GPU-prøven havde 15 temperaturer (95°C …) uden kilde,
// som tjekket ikke så, fordi °C ikke stod på listen.
const PAASTAND = /(\$|€|£)\s?\d[\d.,]*|\d[\d.,]*\s?(%|percent|million|billion|trillion|k\b|GB|TB|MB|ms|seconds|minutes|hours|days|weeks|months|years|x\b|°\s?[CF]?|degrees|GHz|MHz|W\b|watts?|nm\b|mm\b|fps|Mbps|Gbps|GB\/s|TB\/s|mAh|V\b|volts?|inch(es)?)|\b\d{1,3}(,\d{3})+\b|\b(?!(?:19|20)\d\d\b)\d{4,}\b/;
export const harTalPaastand = (s) => PAASTAND.test(String(s));

// Sætninger med tal, hvor hverken sætningen selv eller den lige før nævner en kilde.
// I videoens afsnit er kanalen navngivet i overskriften, så de tal tæller som navngivne.
export function talUdenKilde(md, navne, channelTitle) {
  const alle = [...(navne || []), kildeNavn(channelTitle)].filter((n) => n && n.length >= 2);
  const ud = [];
  // Sidste sætning i afsnittet lige før — tæller med, når det står under samme overskrift.
  // Målt 12/10: robotten deler lange afsnit EFTER kildetjekket, så "The authors determined …
  // 89 %" kom til at starte et nyt afsnit, mens kilden (Google Research) stod i sætningen før.
  let forrige = null, forrigeH2 = null;
  for (const a of afsnitMedH2(md)) {
    const ss = saetninger(a.tekst);
    const erTabel = /^\s*\|/.test(a.tekst);
    if (erVideoOverskrift(a.h2, channelTitle) || /^sources$/i.test(a.h2 || '')) {
      // videoafsnit og kildeliste: kanalen er navngivet i overskriften
    } else if (erTabel) {
      // En tabel nævner sjældent kilden i hver række: kilden skal stå i tabellen eller i
      // sætningen lige før den. Mangler den, tælles tabellen som ÉT fund (første række med tal).
      const foerTabel = forrigeH2 === a.h2 ? forrige : null;
      const medTal = ss.filter(harTalPaastand);
      if (medTal.length && !harKildenavn(a.tekst, alle) && !(foerTabel && harKildenavn(foerTabel, alle))) ud.push(medTal[0]);
    } else {
      ss.forEach((s, i) => {
        const foer = i > 0 ? ss[i - 1] : (forrigeH2 === a.h2 ? forrige : null);
        if (harTalPaastand(s) && !harKildenavn(s, alle) && !(foer && harKildenavn(foer, alle))) ud.push(s);
      });
    }
    forrige = ss[ss.length - 1] || null;
    forrigeH2 = a.h2;
  }
  return ud;
}

// Hvilke websider bruger artiklen? En side tæller, når et udgivernavn fra dens
// fakta eller dens domænenavn står i teksten (fx "IBM", "Verizon", "NIST").
export function brugteKilder(md, soeg) {
  const tekst = udenLinks(md);
  return (soeg?.kilder || []).filter((k) => {
    const navne = udgivernavne(soeg.fakta.filter((f) => f.kilder.includes(k.nr)));
    const led = domaeneLed(k.domaene);
    return harKildenavn(tekst, [...navne, led].filter((n) => n && n.length >= 2));
  });
}

// "## Sources" nederst. Bygges af koden ud fra de sider, artiklen faktisk bruger,
// plus videoen. Modellen skriver aldrig selv kildelisten (den kunne finde på links).
// Uden sidetitel (PDF'er, sider der afviser maskiner) laves en læselig titel af adressen:
// ".../2024-dbir-infographic.pdf" -> "2024 dbir infographic (PDF)". Målt 12/10: tre Verizon-
// kilder stod som "verizon.com", hvilket ikke siger læseren, hvad de er.
export function titelAfAdresse(url) {
  try {
    const u = new URL(url);
    const dele = u.pathname.split('/').filter(Boolean);
    const sidste = decodeURIComponent(dele[dele.length - 1] || '');
    const pdf = /\.pdf$/i.test(sidste);
    const navn = sidste.replace(/\.(pdf|html?|aspx?|php)$/i, '').replace(/[-_]+/g, ' ').trim();
    if (navn.length >= 6 && /[a-z]{3,}/i.test(navn)) return `${navn.charAt(0).toUpperCase()}${navn.slice(1)}${pdf ? ' (PDF)' : ''}`;
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`;
  } catch { return ''; }
}

export function kildelisteMd(kilder, { videoId, videoTitel, kanal } = {}) {
  const ren = (s) => String(s || '').replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
  const linjer = kilder.map((k) => `- [${ren(k.titel) || ren(titelAfAdresse(k.url)) || k.domaene}](${k.url}) — ${k.domaene}`);
  if (videoId) linjer.push(`- [${ren(videoTitel) || 'Video'}](https://www.youtube.com/watch?v=${videoId}) — ${ren(kanal) || 'YouTube'} on YouTube`);
  return `## Sources\n\n${linjer.join('\n')}`;
}
