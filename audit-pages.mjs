import puppeteer from 'puppeteer';
import fs from 'fs';

// Loader hver sidetype på både mobil og desktop og fanger:
//  - JavaScript-fejl
//  - konsol-fejl
//  - ressourcer der svarer 4xx/5xx
//  - vandret overløb
//  - manglende h1
//
// Kør: node audit-pages.mjs

const B = 'https://techfeedwatch.com';

const PAGES = [
  ['forside', '/'],
  ['forside side 2', '/page/2'],
  ['artikel', '/video/ai-hacking-autonomous-agents-threaten-corporate-networks/'],
  ['tag', '/tag/ai-tech/'],
  ['tag side 2', '/tag/ai-tech/page/2'],
  ['arkiv', '/archive/2026-07/'],
  ['arkiv side 2', '/archive/2026-07/page/2'],
  ['library', '/library/'],
  ['latest', '/latest/'],
  ['popular', '/popular/'],
  ['search', '/search/'],
  ['watch-later', '/watch-later/'],
  ['history', '/history/'],
  ['tools', '/tools/'],
  ['glossary', '/glossary/'],
  ['guides', '/guides/'],
  ['trends', '/trends/'],
  ['about', '/about/'],
  ['corrections', '/corrections/'],
  ['contact', '/contact/'],
  ['terms', '/terms/'],
  ['privacy', '/privacy-policy/'],
  ['sitemap-side', '/sitemap/'],
  ['forfatter', '/author/jacob-olsen/'],
  ['guide', '/guides/ultimate-guide-to-ai-coding/'],
  ['glossar-opslag', '/glossary/api/'],
  ['vaerktoej: kategori', '/tools/developer/'],
  ['vaerktoej: sort-list', '/tools/sort-list/'],
  ['vaerktoej: dubletter', '/tools/remove-duplicate-lines/'],
  ['vaerktoej: tomme linjer', '/tools/remove-empty-lines/'],
  ['vaerktoej: erstat', '/tools/find-and-replace/'],
  ['vaerktoej: split', '/tools/split-file/'],
  ['vaerktoej: join', '/tools/join-files/'],
  ['vaerktoej: dummy-fil', '/tools/random-file-generator/'],
  ['vaerktoej: base64', '/tools/encoder-decoder/'],
  ['vaerktoej: serp', '/tools/serp-preview/'],
  ['offline', '/offline/'],
  ['404', '/findes-ikke-xyz'],
];

// Én bredde ad gangen: hele listen på begge bredder tager over fire minutter,
// og så når man ikke at se resultatet før forbindelsen giver op.
//   node audit-pages.mjs mobil
//   node audit-pages.mjs desktop
const ONLY = process.argv[2];
const VIEWPORTS = [['mobil', 390, 844], ['desktop', 1280, 900]]
  .filter(([name]) => !ONLY || name === ONLY);

const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const findings = [];

for (const [vpName, w, h] of VIEWPORTS) {
  for (const [label, path] of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });

    // Googles samtykkedialog indsætter selv fire <h1> og larmer i konsollen.
    // Den er ikke vores markup, så den blokeres under auditten — ellers
    // drukner sitets egne problemer i støj fra CMP'en.
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      if (/fundingchoicesmessages\.google\.com|pagead2\.googlesyndication\.com/.test(r.url())) r.abort();
      else r.continue();
    });

    const jsErrors = [];
    const consoleErrors = [];
    const badResources = [];

    page.on('pageerror', (e) => jsErrors.push(e.message.slice(0, 140)));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Annonce- og samtykke-scripts larmer uden at det er vores fejl
      // Chrome melder ERR_FAILED for de kald vi selv afbryder ovenfor
      if (/fundingchoices|googlesyndication|adsbygoogle|doubleclick|ERR_BLOCKED|ERR_FAILED|net::ERR/i.test(t)) return;
      // 404-siden melder naturligvis 404 i konsollen. Vi undtager allerede selve
      // svaret; uden denne linje meldes konsolbeskeden som en fejl, og så er de
      // eneste to røde linjer i hele gennemgangen scriptets egen støj.
      if (path === '/findes-ikke-xyz' && /status of 404/i.test(t)) return;
      consoleErrors.push(t.slice(0, 140));
    });
    page.on('response', (r) => {
      const s = r.status();
      const u = r.url();
      if (s < 400) return;
      if (!u.includes('techfeedwatch.com')) return;   // kun vores egne ressourcer
      if (path === '/findes-ikke-xyz' && s === 404) return; // forventet
      badResources.push(`${s} ${u.replace(B, '')}`);
    });

    let info = {};
    try {
      await page.goto(B + path, { waitUntil: 'networkidle2', timeout: 45000 });
      await new Promise((r) => setTimeout(r, 2500));
      info = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const over = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.right > vw + 2) {
            const cs = getComputedStyle(el);
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return;
            let p = el.parentElement, inScroll = false;
            while (p) { const pc = getComputedStyle(p); if (pc.overflowX === 'auto' || pc.overflowX === 'scroll') { inScroll = true; break; } p = p.parentElement; }
            if (!inScroll) over.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
          }
        });
        return {
          h1: document.querySelectorAll('h1').length,
          title: document.title,
          overflow: [...new Set(over)].slice(0, 3),
          hScroll: document.documentElement.scrollWidth > vw + 2,
          bodyLen: document.body.innerText.length,
        };
      });
    } catch (e) {
      jsErrors.push('NAVIGATION: ' + e.message.slice(0, 90));
    }

    const problems = [];
    if (jsErrors.length) problems.push(`JS-fejl: ${jsErrors.join(' | ')}`);
    if (consoleErrors.length) problems.push(`konsol: ${consoleErrors.join(' | ')}`);
    if (badResources.length) problems.push(`ressourcer: ${[...new Set(badResources)].slice(0, 4).join(', ')}`);
    if (info.h1 === 0) problems.push('ingen h1');
    if (info.h1 > 1) problems.push(`${info.h1} h1-elementer`);
    if (info.hScroll) problems.push('vandret scroll');
    if (info.overflow && info.overflow.length) problems.push(`overløb: ${info.overflow.join(', ')}`);
    if (info.bodyLen !== undefined && info.bodyLen < 300) problems.push(`næsten tom (${info.bodyLen} tegn)`);

    findings.push({ vp: vpName, label, path, problems });
    console.log(`${problems.length ? '❌' : '✅'} ${vpName.padEnd(8)} ${label.padEnd(16)} ${problems.join('  ||  ') || ''}`);
    await page.close();
  }
}

fs.writeFileSync(`audit-pages${ONLY ? '-' + ONLY : ''}.json`, JSON.stringify(findings, null, 1));
const bad = findings.filter((f) => f.problems.length);
console.log(`\n=== ${bad.length} af ${findings.length} sidevisninger med problemer`);
await browser.close();
