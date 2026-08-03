import puppeteer from 'puppeteer';

const B = 'https://techfeedwatch.com';

// Vent på deploy
const t0 = Date.now();
while (Date.now() - t0 < 240000) {
  const h = await (await fetch(B + '/watch-later/?cb=' + Date.now())).text();
  if (h.includes('newestFirst')) { console.log(`deploy nede efter ${Math.round((Date.now() - t0) / 1000)}s\n`); break; }
  await new Promise((r) => setTimeout(r, 12000));
}

const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.setRequestInterception(true);
page.on('request', (r) => (/fundingchoicesmessages|pagead2\.googlesyndication/.test(r.url()) ? r.abort() : r.continue()));

// Hent tre rigtige artikler
await page.goto(B, { waitUntil: 'networkidle2', timeout: 60000 });
const arts = await page.evaluate(async () => {
  const all = await (await fetch('/videos.json')).json();
  return all.slice(0, 3).map((v) => ({ slug: v.slug, title: v.title }));
});

// Gem dem én ad gangen via knappen på artikelsiden, i rækkefølge 1, 2, 3
for (const a of arts) {
  await page.goto(`${B}/video/${a.slug}/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.evaluate(() => {
    const b = document.getElementById('saveBtn');
    if (b && !b.classList.contains('btn-active')) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  console.log(`gemt: ${a.title.slice(0, 50)}`);
}

// Se rækkefølgen på Watch Later
await page.goto(B + '/watch-later/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
const shown = await page.evaluate(() =>
  [...document.querySelectorAll('.wl-card h2')].map((h) => h.innerText.trim())
);

console.log('\nRækkefølge på Watch Later (øverst først):');
shown.forEach((t, i) => console.log(`  ${i + 1}. ${t.slice(0, 50)}`));

const forventet = [...arts].reverse().map((a) => a.title);
const rigtigt = shown.length === 3 && shown.every((t, i) => t === forventet[i]);
console.log(`\nSenest gemte ligger øverst: ${rigtigt ? 'JA' : 'NEJ'}`);
if (!rigtigt) console.log('  forventede:', forventet.map((t) => t.slice(0, 40)));

// Undo skal stadig lægge artiklen tilbage på sin plads
await page.evaluate(() => document.querySelector('.wl-remove').click());
await new Promise((r) => setTimeout(r, 800));
const efterFjern = await page.evaluate(() => document.querySelectorAll('.wl-card').length);
await page.evaluate(() => document.querySelector('.wl-toast button').click());
await new Promise((r) => setTimeout(r, 800));
const efterUndo = await page.evaluate(() =>
  [...document.querySelectorAll('.wl-card h2')].map((h) => h.innerText.trim())
);
console.log(`\nEfter fjern: ${efterFjern} kort | efter Undo: ${efterUndo.length} kort`);
console.log(`Undo bevarer rækkefølgen: ${efterUndo[0] === shown[0] ? 'JA' : 'NEJ'}`);

await browser.close();
