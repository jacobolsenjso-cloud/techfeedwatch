import puppeteer from 'puppeteer';

const B = 'https://techfeedwatch.com';
const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(B, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 7000));

const r = await page.evaluate(async () => {
  const m = await caches.match('/offline');
  if (!m) return { fundet: false };
  const html = await m.text();
  const h1 = (html.match(/<h1[^>]*>([^<]*)/) || [])[1] || '(ingen h1)';
  return { fundet: true, status: m.status, url: m.url, h1: h1.trim(), redirected: m.redirected, type: m.type };
});

console.log('Indholdet af den precachede /offline:');
console.log(JSON.stringify(r, null, 1));

await browser.close();
