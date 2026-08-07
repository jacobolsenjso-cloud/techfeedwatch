// Tilgængeligheds-gennemgang af sitet. Kører hver sidetype i en rigtig browser
// og måler det man ikke kan se ved at kigge: farvekontrast, tryk-mål,
// manglende alt-tekst, knapper uden navn og overskrifter i forkert rækkefølge.
//
// Baggrund: to fejl af netop denne slags blev fundet ved et tilfælde i denne
// uge — en tommel-ned med et tryk-mål på 50x36 px, og relaterede artikler som
// mørkeblå links på mørk baggrund. Begge havde stået der i ugevis. Et menneske
// der kigger, finder dem kun hvis det tilfældigvis kigger det rigtige sted.
//
// Kræver at `npm run preview` kører (eller sæt BASE til det live site).
// Brug: node audit-a11y.mjs            (begge bredder, kan tage over 4 minutter)
//       node audit-a11y.mjs mobil      (kun mobil)
//       node audit-a11y.mjs desktop    (kun desktop)
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const BASE = process.env.A11Y_BASE || 'http://localhost:4321';
const ONLY = process.argv[2];
// Lys og mørk tilstand har hver sine farver. Retter man kontrasten ét sted uden
// at se det andet, flytter man bare fejlen — en mørkere tekstfarve hjælper på
// hvid baggrund og skader på mørk.
const VIEWPORTS = [['mobil', 390, 844, false], ['mobil-mørk', 390, 844, true],
                   ['desktop', 1280, 900, false], ['desktop-mørk', 1280, 900, true]]
  .filter(([n]) => !ONLY || n.startsWith(ONLY));

// Én side pr. skabelon. Flere sider af samme type finder de samme fejl igen.
const PAGES = [
  ['forside', '/'],
  ['artikel', '/video/altcoin-bull-market-signal-decoding-macroeconomic-impact/'],
  ['tag', '/tag/crypto/'],
  ['latest', '/latest/'],
  ['best by topic', '/popular/'],
  ['trends', '/trends/'],
  ['library', '/library/'],
  ['tools oversigt', '/tools/'],
  ['tools kategori', '/tools/developer/'],
  ['værktøj', '/tools/sort-list/'],
  ['guide', '/guides/ultimate-guide-to-seo/'],
  ['glossar', '/glossary/ai-agent/'],
  ['about', '/about/'],
  ['start here', '/start-here/'],
  ['søg', '/search/'],
  ['404', '/findes-ikke-xyz'],
];

// Selve gennemgangen kører INDE i siden, fordi den skal bruge de beregnede
// stilarter — den farve et element faktisk får, ikke den der står i CSS'en.
function auditInPage() {
  const fund = [];
  const add = (type, alvor, hvor, detalje) => fund.push({ type, alvor, hvor, detalje });

  const synlig = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // Et element uden klasse kan ikke findes igen ud fra sit navn alene — første
  // udgave meldte 'span "Crypto"' og efterlod ingen måde at finde den på.
  // Derfor tages forældrenes klasser med som en sti.
  const kort = (el) => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 42);
    const navn = (n) => {
      const c = (n.className && typeof n.className === 'string') ? n.className.trim().split(/\s+/)[0] : '';
      return n.tagName.toLowerCase() + (n.id ? `#${n.id}` : (c ? `.${c}` : ''));
    };
    const sti = [];
    let n = el;
    for (let i = 0; i < 3 && n && n.tagName !== 'BODY'; i++) { sti.unshift(navn(n)); n = n.parentElement; }
    return `${sti.join(' > ')}${t ? ` "${t}"` : ''}`;
  };

  // --- Kontrast ---
  const tilRgb = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const luminans = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  // Baggrunden er sjældent sat på elementet selv, og den er ofte halvt
  // gennemsigtig. Første udgave sprang gennemsigtige baggrunde over og gik
  // videre opad — så et tidsmærke med rgba(0,0,0,0.8) blev målt som hvid tekst
  // på et lyst kort: 1.23:1 i stedet for de rigtige ~16:1. 181 falske fejl.
  // Her lægges lagene oven på hinanden, som browseren selv gør det.
  const baggrund = (el) => {
    const lag = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const c = tilRgb(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) { lag.push(c); if (c.a >= 0.999) break; }
      n = n.parentElement;
    }
    lag.push({ r: 255, g: 255, b: 255, a: 1 });   // siden bag alting
    let ud = lag[lag.length - 1];
    for (let i = lag.length - 2; i >= 0; i--) {
      const f = lag[i];
      ud = {
        r: f.r * f.a + ud.r * (1 - f.a),
        g: f.g * f.a + ud.g * (1 - f.a),
        b: f.b * f.a + ud.b * (1 - f.a),
        a: 1,
      };
    }
    return ud;
  };
  const forhold = (a, b) => {
    const l1 = luminans(a), l2 = luminans(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  // Kun elementer med deres EGEN tekst. Ellers måles en <div> med al sin
  // indlejrede tekst, og samme fejl meldes én gang pr. niveau opad.
  const egenTekst = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

  document.querySelectorAll('body *').forEach((el) => {
    if (!egenTekst(el) || !synlig(el)) return;
    // WCAG undtager inaktive kontroller fra kontrastkravet. En slukket
    // "forrige side"-knap SKAL se slukket ud, og at gøre den mørkere ville
    // fjerne den eneste besked om at den ikke kan klikkes.
    if (el.closest('[aria-disabled="true"], [disabled]')) return;
    const s = getComputedStyle(el);
    const fg = tilRgb(s.color);
    if (!fg || fg.a < 0.9) return;
    const bg = baggrund(el);
    // Opacity på elementet eller en forælder dæmper teksten mod baggrunden, og
    // scriptet så det slet ikke: en linje med opacity 0.5 blev målt som om den
    // var fuldt synlig. Her lægges den samlede gennemsigtighed oveni.
    let o = 1, n2 = el;
    while (n2 && n2 !== document.documentElement) { o *= Number(getComputedStyle(n2).opacity) || 1; n2 = n2.parentElement; }
    const synligFg = o >= 0.999 ? fg : {
      r: fg.r * o + bg.r * (1 - o),
      g: fg.g * o + bg.g * (1 - o),
      b: fg.b * o + bg.b * (1 - o),
    };
    const r = forhold(synligFg, bg);
    const px = parseFloat(s.fontSize);
    const fed = Number(s.fontWeight) >= 700;
    // WCAG AA: 3:1 for stor tekst (18.66px fed / 24px), ellers 4.5:1
    const stor = px >= 24 || (px >= 18.66 && fed);
    const krav = stor ? 3 : 4.5;
    if (r < krav) {
      add('kontrast', r < krav - 1 ? 'fejl' : 'grænse', kort(el),
        `${r.toFixed(2)}:1, kræver ${krav}:1 (${Math.round(px)}px${fed ? ' fed' : ''})`);
    }
  });

  // --- Tryk-mål ---
  // WCAG 2.2 AA kræver 24x24. De 44x44 er AAA, men er den størrelse en finger
  // reelt har brug for — derfor meldes de som en bemærkning, ikke som en fejl.
  document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]').forEach((el) => {
    if (!synlig(el)) return;
    // Links midt i en tekst er undtaget: de kan ikke gøres større uden at
    // ødelægge linjeafstanden, og standarden undtager dem netop derfor.
    // Undtagelsen gælder ALLE inline-links, ikke kun dem i p og li — første
    // udgave meldte brødkrumme-links som fejl, og de er samme slags tekst.
    if (getComputedStyle(el).display === 'inline') return;

    // Et afkrydsningsfelt INDE I en label har labelen som tryk-mål. Men en
    // label der bare står ved siden af som overskrift er ikke tryk-målet —
    // første udgave brugte også el.labels[0] og målte derfor tekstboksens
    // overskrift: 360x16 meldt om et felt der er 360x180.
    let maal = el;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
      const label = el.closest('label');
      if (label && getComputedStyle(label).display !== 'inline') maal = label;
    }

    const r = maal.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w < 24 || h < 24) add('tryk-mål', 'fejl', kort(el), `${w}x${h}, kræver 24x24 (WCAG 2.2 AA)`);
    else if (w < 44 || h < 44) add('tryk-mål', 'bemærkning', kort(el), `${w}x${h}, under 44x44 (behageligt for en finger)`);
  });

  // --- Billeder uden alt ---
  // alt="" er en bevidst besked om at billedet er pynt. Et manglende attribut
  // er derimod noget nogen glemte, og skærmlæseren læser filnavnet op.
  document.querySelectorAll('img').forEach((el) => {
    if (!el.hasAttribute('alt')) {
      add('alt-tekst', 'fejl', kort(el), (el.getAttribute('src') || '').slice(-46));
    }
  });

  // --- Knapper og links uden navn ---
  // Et ikon uden tekst er tomt for en skærmlæser. aria-label eller title tæller.
  document.querySelectorAll('a[href], button, [role="button"]').forEach((el) => {
    if (!synlig(el)) return;
    const navn = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim()
      || [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join(' ').trim();
    if (!navn) add('uden navn', 'fejl', kort(el), 'hverken tekst, aria-label eller title');
  });

  // --- Formularfelter uden label ---
  document.querySelectorAll('input, select, textarea').forEach((el) => {
    if (!synlig(el) || el.type === 'hidden') return;
    const harLabel = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
      || el.getAttribute('placeholder') || el.getAttribute('title');
    if (!harLabel) add('uden label', 'fejl', kort(el), `type=${el.type || el.tagName.toLowerCase()}`);
  });

  // --- Overskrifter ---
  const overskrifter = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(synlig);
  const h1 = overskrifter.filter((h) => h.tagName === 'H1').length;
  if (h1 === 0) add('overskrifter', 'fejl', 'siden', 'ingen h1');
  if (h1 > 1) add('overskrifter', 'fejl', 'siden', `${h1} stk. h1 — der må kun være én`);
  let forrige = 0;
  for (const h of overskrifter) {
    const n = Number(h.tagName[1]);
    // Et spring fra h2 til h4 efterlader et hul i strukturen: en skærmlæser
    // der springer fra overskrift til overskrift mister et niveau.
    if (forrige && n > forrige + 1) {
      add('overskrifter', 'bemærkning', kort(h), `springer fra h${forrige} til h${n}`);
    }
    forrige = n;
  }

  // --- Sidens grundlæggende ---
  if (!document.documentElement.getAttribute('lang')) add('dokument', 'fejl', 'html', 'mangler lang');
  if (!document.title.trim()) add('dokument', 'fejl', 'head', 'mangler title');

  return fund;
}

const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const alle = [];

for (const [vpNavn, w, h, moerk] of VIEWPORTS) {
  for (const [label, sti] of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile: w < 800, deviceScaleFactor: 1 });
    try {
      await page.goto(BASE + sti, { waitUntil: 'networkidle2', timeout: 45000 });
      await new Promise((r) => setTimeout(r, 900));
      if (moerk) {
        await page.evaluate(() => document.body.classList.add('dark-mode'));
        await new Promise((r) => setTimeout(r, 250));
      }
      // Samtykkedialogen indsætter sine egne overskrifter og knapper. De er
      // Googles kode, ikke sitets, og de ville drukne de rigtige fund.
      await page.evaluate(() => {
        document.querySelectorAll('.fc-consent-root, .fc-dialog-overlay, [class*="fc-"]').forEach((n) => n.remove());
      });
      const fund = await page.evaluate(auditInPage);
      fund.forEach((f) => alle.push({ ...f, vp: vpNavn, side: label }));
      const fejl = fund.filter((f) => f.alvor === 'fejl').length;
      console.log(`${fejl ? '❌' : '✅'} ${vpNavn.padEnd(8)} ${label.padEnd(16)} ${fund.length} fund (${fejl} fejl)`);
    } catch (e) {
      console.log(`⚠️  ${vpNavn.padEnd(8)} ${label.padEnd(16)} kunne ikke hentes: ${e.message.slice(0, 60)}`);
    }
    await page.close();
  }
}
await browser.close();

// Grupperet efter FEJL, ikke efter side. Ellers drukner én fejl der optræder
// på seksten sider de andre femten, og man kan ikke se om der er ét problem
// eller seksten.
const grupper = new Map();
for (const f of alle) {
  const key = `${f.alvor}|${f.type}|${f.detalje}`;
  if (!grupper.has(key)) grupper.set(key, { ...f, steder: [] });
  grupper.get(key).steder.push(`${f.vp}:${f.side}`);
}

const fejl = [...grupper.values()].filter((g) => g.alvor === 'fejl').sort((a, b) => b.steder.length - a.steder.length);
const andre = [...grupper.values()].filter((g) => g.alvor !== 'fejl').sort((a, b) => b.steder.length - a.steder.length);

const skriv = (titel, liste, maks) => {
  console.log(`\n${titel} — ${liste.length} slags`);
  if (!liste.length) { console.log('   ingen'); return; }
  for (const g of liste.slice(0, maks)) {
    console.log(`  ${String(g.steder.length).padStart(4)}x  [${g.type}] ${g.hvor}`);
    console.log(`        ${g.detalje}`);
    console.log(`        fx ${[...new Set(g.steder)].slice(0, 3).join(', ')}`);
  }
  if (liste.length > maks) console.log(`   ... og ${liste.length - maks} slags mere (se audit-a11y.json)`);
};

console.log(`\n${'='.repeat(60)}`);
skriv('FEJL — bryder WCAG 2.2 AA', fejl, 15);
skriv('BEMÆRKNINGER — værd at kigge på, ikke et krav', andre, 10);

fs.writeFileSync('audit-a11y.json', JSON.stringify([...grupper.values()], null, 1));
console.log(`\n=== ${fejl.length} slags fejl · ${andre.length} slags bemærkninger · fuld liste i audit-a11y.json`);
