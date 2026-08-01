import puppeteer from 'puppeteer';
import fs from 'fs';

const B = 'https://techfeedwatch.com';
const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const results = [];
const check = (name, ok, note = '') => {
  results.push({ name, ok, note });
  console.log(`${ok ? '✅' : '❌'} ${name.padEnd(34)} ${note}`);
};

const newPage = async (w = 1280, h = 900) => {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/fundingchoicesmessages|pagead2\.googlesyndication/.test(r.url()) ? r.abort() : r.continue()));
  return p;
};

// --- Mørk tilstand
{
  const p = await newPage();
  await p.goto(B, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 1500));
  const res = await p.evaluate(async () => {
    const before = document.body.classList.contains('dark-mode');
    document.getElementById('themeToggle').click();
    await new Promise((r) => setTimeout(r, 400));
    const after = document.body.classList.contains('dark-mode');
    const stored = localStorage.getItem('theme');
    return { toggled: before !== after, stored, bg: getComputedStyle(document.body).backgroundColor };
  });
  check('Mørk tilstand skifter', res.toggled, `gemt: ${res.stored}, baggrund: ${res.bg}`);
  await p.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const persist = await p.evaluate(() => document.body.classList.contains('dark-mode'));
  check('Mørk tilstand huskes', persist);
  await p.close();
}

// --- Tag-filtrering på forsiden
{
  const p = await newPage();
  await p.goto(B, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 3000));
  const res = await p.evaluate(async () => {
    const chip = [...document.querySelectorAll('.filter-tag')].find((b) => b.dataset.tag === 'Crypto');
    if (!chip) return { found: false };
    chip.click();
    await new Promise((r) => setTimeout(r, 1500));
    const fr = document.getElementById('filteredResults');
    return {
      found: true,
      visible: fr && getComputedStyle(fr).display !== 'none',
      cards: fr ? fr.querySelectorAll('.watch-card').length : 0,
      defaultHidden: getComputedStyle(document.getElementById('defaultView')).display === 'none',
      hasSource: fr ? !!fr.querySelector('.card-source') : false,
    };
  });
  check('Tag-filter viser resultater', res.found && res.visible && res.cards > 0, `${res.cards} kort, standardvisning skjult: ${res.defaultHidden}`);
  check('Filtrerede kort har kilde', res.hasSource);
  await p.close();
}

// --- Søgning i topbaren
{
  const p = await newPage();
  await p.goto(B, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 3000));
  const res = await p.evaluate(async () => {
    const btn = document.getElementById('searchBtn');
    if (btn) btn.click();
    const inp = document.getElementById('topSearchInput');
    if (!inp) return { found: false };
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, 'bitcoin');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1500));
    const sug = document.getElementById('searchSuggest');
    return { found: true, suggestions: sug ? sug.children.length : 0, visible: sug ? getComputedStyle(sug).display !== 'none' : false };
  });
  check('Søgeforslag i topbaren', res.found && res.suggestions > 0, `${res.suggestions} forslag`);
  await p.close();
}

// --- Gem + historik fra artikelside
{
  const p = await newPage();
  await p.goto(B + '/video/ai-hacking-autonomous-agents-threaten-corporate-networks/', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 3000));
  const res = await p.evaluate(async () => {
    const save = document.getElementById('saveBtn');
    const like = document.getElementById('likeBtn');
    save && save.click();
    await new Promise((r) => setTimeout(r, 400));
    like && like.click();
    await new Promise((r) => setTimeout(r, 400));
    return {
      saved: JSON.parse(localStorage.getItem('watchLater') || '[]').length,
      history: JSON.parse(localStorage.getItem('videoHistory') || '[]').length,
      likeActive: like ? like.classList.contains('btn-active') : null,
      likeShowsNumber: like ? /\d/.test(like.innerText) : null,
    };
  });
  check('Gem-knap virker', res.saved > 0, `${res.saved} gemt`);
  check('Historik registreres', res.history > 0, `${res.history} i historik`);
  check('Helpful-knap markeres', res.likeActive === true);
  check('Ingen opdigtede like-tal', res.likeShowsNumber === false);
  await p.close();
}

// --- Mobilmenu
{
  const p = await newPage(390, 844);
  await p.goto(B, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2000));
  const res = await p.evaluate(async () => {
    const btn = document.getElementById('mobileMenuBtn');
    const sb = document.getElementById('sidebar');
    if (!btn || !sb) return { found: false };
    const closed = sb.getBoundingClientRect().left < 0;
    btn.click();
    await new Promise((r) => setTimeout(r, 600));
    const open = sb.getBoundingClientRect().left >= 0;
    const r2 = btn.getBoundingClientRect();
    return { found: true, closed, open, btnSize: `${Math.round(r2.width)}x${Math.round(r2.height)}` };
  });
  check('Mobilmenu åbner', res.found && res.closed && res.open, `knap ${res.btnSize}`);
  await p.close();
}

// --- Scroll-til-top
{
  const p = await newPage();
  await p.goto(B, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2000));
  const res = await p.evaluate(async () => {
    const area = document.querySelector('.content-area');
    const btn = document.getElementById('scrollTopBtn');
    if (!area || !btn) return { found: false };
    area.scrollTop = 2000;
    await new Promise((r) => setTimeout(r, 800));
    const visible = getComputedStyle(btn).display !== 'none';
    btn.click();
    await new Promise((r) => setTimeout(r, 1200));
    return { found: true, visible, backToTop: area.scrollTop < 100 };
  });
  check('Scroll-til-top', res.found && res.visible && res.backToTop);
  await p.close();
}

fs.writeFileSync('audit-interactive.json', JSON.stringify(results, null, 1));
console.log(`\n=== ${results.filter((r) => !r.ok).length} af ${results.length} interaktive tjek fejlede`);
await browser.close();
