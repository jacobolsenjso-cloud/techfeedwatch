import puppeteer from 'puppeteer';

const B = 'https://techfeedwatch.com';
const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.setRequestInterception(true);
page.on('request', (r) => (/fundingchoicesmessages\.google\.com/.test(r.url()) ? r.abort() : r.continue()));

// Gem tre artikler, så siden har noget at vise
await page.goto(B, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => {
  const items = [
    ['ai-hacking-autonomous-agents-threaten-corporate-networks', 'AI Hacking: Autonomous Agents Threaten Corporate Networks', '_yfiUQSbdPY'],
    ['ai-code-agents-on-google-cloud-reshaping-software-development', 'AI Code Agents on Google Cloud: Shape Software Development', 'Gv9dJPGJn1U'],
    ['index-funds-explained-the-core-of-long-term-investing', 'Index Funds Explained: The Core of Long-Term Investing', 'D80vHtDWzr8'],
  ].map(([slug, title, id]) => ({ slug, title, img: `https://img.youtube.com/vi/${id}/mqdefault.jpg` }));
  localStorage.setItem('watchLater', JSON.stringify(items));
});

await page.goto(B + '/watch-later/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500));
await page.screenshot({ path: 'wl.png' });
console.log('gemt wl.png');
await browser.close();
