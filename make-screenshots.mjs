import puppeteer from 'puppeteer';
import fs from 'fs';

// Genererer de skærmbilleder manifestet henviser til. Uden dem viser Android
// den simple install-dialog; med dem får man den rigere med billeder.
//
// Kræver en headless browser. Er den ikke hentet:
//   npx puppeteer browsers install chrome-headless-shell
//
// Kør: node make-screenshots.mjs [baseUrl]

const BASE = process.argv[2] || 'https://techfeedwatch.com';
const OUT = 'public/screenshots';

const shots = [
  { name: 'mobile-home',    url: '/',        width: 412,  height: 915,  form: 'narrow' },
  { name: 'mobile-article', url: '/library', width: 412,  height: 915,  form: 'narrow' },
  { name: 'wide-home',      url: '/',        width: 1280, height: 800,  form: 'wide' },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  browser: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const s of shots) {
  const page = await browser.newPage();
  await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 1 });

  // Samtykkebanneret ville dække halvdelen af billedet — sæt et gemt valg først
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('tfw_consent', JSON.stringify({
        v: 1, analytics: false, ads: false,
        ts: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 180,
      }));
    } catch (e) {}
  });

  await page.goto(BASE + s.url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Giv billeder tid til at lande
  await new Promise((r) => setTimeout(r, 2500));

  const file = `${OUT}/${s.name}.png`;
  await page.screenshot({ path: file, type: 'png' });
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`✅ ${file}  ${s.width}x${s.height}  ${kb} kB  (${s.form})`);
  await page.close();
}

await browser.close();
console.log('\nFærdig.');
