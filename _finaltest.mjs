import puppeteer from 'puppeteer';

const B = 'https://techfeedwatch.com';
const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const line = (l, v) => console.log(`  ${l.padEnd(34)} ${v}`);

// --- Offline: er det VORES side der vises? ---
{
  const page = await browser.newPage();
  await page.goto(B, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  await page.goto(B + '/library', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  await page.setOfflineMode(true);

  // a) en side vi ALDRIG har besøgt -> skal give offline-siden
  await page.goto(B + '/aldrig-besogt-side', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  const a = await page.evaluate(() => ({
    h1: (document.querySelector('h1') || {}).innerText || '—',
    hasRetry: !!document.getElementById('offlineRetry'),
  }));

  // b) en side vi HAR besøgt -> skal komme fra cachen
  await page.goto(B + '/library', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  const b = await page.evaluate(() => (document.querySelector('h1') || {}).innerText || '—');

  console.log('--- Offline');
  line('Ukendt side viser', `"${a.h1}"  ${a.hasRetry ? '(med Try again-knap)' : ''}`);
  line('Tidligere besøgt side viser', `"${b.trim()}"`);
  await page.setOfflineMode(false);
  await page.close();
}

// --- Indlæses GA4 EFTER samtykke? ---
{
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 });
  const ga = [];
  page.on('request', (r) => { if (r.url().includes('googletagmanager.com/gtag')) ga.push(r.url()); });

  await page.goto(B, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));

  // Tryk "Giv samtykke" i Googles dialog
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const yes = btns.find((b) => /giv samtykke|^consent$|accept all/i.test((b.textContent || '').trim()));
    if (yes) { yes.click(); return yes.textContent.trim(); }
    return null;
  });
  await new Promise((r) => setTimeout(r, 6000));

  const cookies = await page.evaluate(() => document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean));

  console.log('\n--- Efter samtykke');
  line('Klikkede på', clicked || 'fandt ikke knappen');
  line('GA4 indlæst', ga.length ? `ja (${ga.length} kald)` : 'NEJ');
  line('cookies', cookies.join(', ') || 'ingen');
  await page.close();
}

await browser.close();
