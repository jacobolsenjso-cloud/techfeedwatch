import puppeteer from 'puppeteer';

const B = 'https://techfeedwatch.com';
const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 120)); });

const line = (l, v) => console.log(`  ${l.padEnd(32)} ${v}`);

// 1) Tom tilstand
await page.goto(B + '/watch-later/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
const empty = await page.evaluate(() => {
  const m = document.getElementById('emptyMsg');
  const g = document.getElementById('saved-grid');
  return {
    emptyVisible: m ? getComputedStyle(m).display !== 'none' : null,
    emptyText: m ? m.innerText.trim() : null,
    gridChildren: g ? g.children.length : null,
    h1: (document.querySelector('h1') || {}).innerText || '—',
  };
});
console.log('--- Tom side');
line('h1', `"${empty.h1.trim()}"`);
line('Tom-besked synlig', empty.emptyVisible ? 'ja' : 'NEJ');
line('Tekst', `"${empty.emptyText}"`);
line('Kort i gitter', empty.gridChildren);

// 2) Gem en artikel via knappen på artikelsiden
await page.goto(B + '/video/ai-hacking-autonomous-agents-threaten-corporate-networks/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));
const saved = await page.evaluate(() => {
  const btn = document.getElementById('saveBtn');
  if (!btn) return { found: false };
  btn.click();
  return {
    found: true,
    label: (document.getElementById('saveText') || {}).innerText,
    stored: localStorage.getItem('watchLater'),
  };
});
console.log('\n--- Gem fra artikel');
line('Save-knap fundet', saved.found ? 'ja' : 'NEJ');
line('Knaptekst efter klik', saved.label || '—');
line('Gemt i localStorage', saved.stored ? saved.stored.slice(0, 110) + '…' : 'INTET');

// 3) Vises den nu på siden?
await page.goto(B + '/watch-later/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500));
const shown = await page.evaluate(() => {
  const g = document.getElementById('saved-grid');
  const card = g && g.querySelector('a.watch-card');
  const img = card && card.querySelector('img');
  return {
    count: g ? g.children.length : 0,
    href: card ? card.getAttribute('href') : null,
    title: card ? (card.querySelector('h2') || {}).innerText : null,
    imgSrc: img ? img.getAttribute('src') : null,
    imgLoaded: img ? img.naturalWidth > 0 : null,
    emptyHidden: (() => { const m = document.getElementById('emptyMsg'); return m ? getComputedStyle(m).display === 'none' : null; })(),
    gridCols: g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0,
  };
});
console.log('\n--- Efter gem');
line('Kort vist', shown.count);
line('Tom-besked skjult', shown.emptyHidden ? 'ja' : 'NEJ');
line('Titel', shown.title ? `"${shown.title.trim().slice(0, 45)}"` : 'MANGLER');
line('Link', shown.href || 'MANGLER');
line('Billede indlæst', shown.imgLoaded ? 'ja' : 'NEJ  (' + shown.imgSrc + ')');
line('Gitter-kolonner', shown.gridCols);

// 4) Virker linket?
if (shown.href) {
  const r = await fetch(B + shown.href, { redirect: 'follow' });
  line('Link svarer', `${r.status} -> ${r.url.replace(B, '')}`);
}

console.log('\n--- JS-fejl: ' + (errors.length ? '\n   ' + errors.slice(0, 5).join('\n   ') : 'ingen'));
await browser.close();
