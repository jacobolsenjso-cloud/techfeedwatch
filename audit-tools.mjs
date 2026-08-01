import puppeteer from 'puppeteer';
import fs from 'fs';

// Tester hvert værktøj FUNKTIONELT: fylder felterne ud, trykker på knappen,
// og kontrollerer at der faktisk kommer et resultat ud. At siden loader er
// ikke nok — et værktøj der ikke regner er stadig i stykker.
//
// Kør: node audit-tools.mjs

const B = 'https://techfeedwatch.com/tools';

// [sti, testinput pr. felttype, hvad der beviser succes]
const TOOLS = [
  ['ai-token-calculator',     'The quick brown fox jumps over the lazy dog. '.repeat(20)],
  ['case-converter',          'hello world from tech feed watch'],
  ['compound-calculator',     null],
  ['contrast-checker',        null],
  ['crypto-profit-calculator', null],
  ['encoder-decoder',         'Hello World æøå'],
  ['hreflang-generator',      'https://example.com/page'],
  ['image-compressor',        null],
  ['image-to-base64',         null],
  ['json-formatter',          '{"a":1,"b":[2,3],"c":{"d":"e"}}'],
  ['keyword-density',         'seo content marketing seo strategy seo tools content '.repeat(12)],
  ['keyword-idea-generator',  'ai marketing'],
  ['meta-tag-generator',      'My Test Page Title'],
  ['open-graph-generator',    'My Test Page Title'],
  ['password-generator',      null],
  ['readability-checker',     'The cat sat on the mat. It was a sunny day outside. Birds were singing loudly in the tall green trees near the old house. '.repeat(6)],
  ['robots-txt-generator',    'https://example.com/sitemap.xml'],
  ['schema-generator',        'Test Article Headline'],
  ['serp-preview',            'My Page Title For Search Results'],
  ['slug-generator',          'Hello World! This is a Test Title'],
  ['subtitle-converter',      '1\n00:00:01,000 --> 00:00:04,000\nHello world\n\n2\n00:00:05,000 --> 00:00:08,000\nSecond line\n'],
  ['text-diff',               'line one\nline two\nline three'],
  ['thumbnail-downloader',    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ['utm-builder',             'https://example.com/landing'],
  ['video-schema',            'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ['word-counter',            'One two three four five six seven eight nine ten.'],
  ['youtube-embed-generator', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
];

const browser = await puppeteer.launch({ browser: 'chrome', headless: true, args: ['--no-sandbox'] });
const results = [];

for (const [slug, input] of TOOLS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => (/fundingchoicesmessages|pagead2\.googlesyndication/.test(r.url()) ? r.abort() : r.continue()));

  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message.slice(0, 110)));
  page.on('console', (m) => { if (m.type() === 'error' && !/fundingchoices|googlesyndication|ERR_/i.test(m.text())) jsErrors.push('konsol: ' + m.text().slice(0, 110)); });

  let r = { slug, ok: false, note: '' };
  try {
    await page.goto(`${B}/${slug}/`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((x) => setTimeout(x, 1200));

    // Mål udgangspunktet, så vi kan se om noget ændrer sig
    const before = await page.evaluate(() => document.body.innerText.length);

    r = await page.evaluate(async (testInput) => {
      const setVal = (el, v) => {
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('keyup', { bubbles: true }));
      };

      const fields = [...document.querySelectorAll('input, textarea, select')]
        .filter((el) => !['hidden', 'file'].includes(el.type));

      let filled = 0;
      for (const el of fields) {
        if (el.tagName === 'SELECT') continue;
        if (el.type === 'checkbox' || el.type === 'radio') continue;
        if (el.type === 'number' || el.type === 'range') {
          if (!el.value) { setVal(el, el.min || '10'); filled++; }
          continue;
        }
        if (el.type === 'color') continue;
        if (testInput) { setVal(el, testInput); filled++; }
      }

      // Tryk på alt der ligner en handlingsknap
      const btns = [...document.querySelectorAll('button')]
        .filter((b) => /generate|calculate|convert|check|analy|build|create|run|compare|count|preview|format|encode|decode|shorten|make|get/i.test(b.textContent || ''));
      btns.slice(0, 2).forEach((b) => b.click());

      await new Promise((res) => setTimeout(res, 900));

      return { filled, buttons: btns.length, fields: fields.length };
    }, input);

    await new Promise((x) => setTimeout(x, 1400));

    const after = await page.evaluate(() => {
      const txt = document.body.innerText;
      // Hvad ligner et resultat? Udfyldte output-felter, kodeblokke, eller ny tekst
      const outputs = [...document.querySelectorAll('textarea, pre, code, output, [id*="out" i], [id*="result" i], [class*="result" i], [class*="output" i]')]
        .map((el) => (el.value !== undefined && el.value !== '' ? el.value : el.innerText || ''))
        .filter((v) => v && v.trim().length > 2);
      return { len: txt.length, outputs: outputs.length, sample: (outputs[0] || '').trim().slice(0, 70) };
    });

    const grew = after.len > before + 15;
    r.ok = (after.outputs > 0 || grew) && jsErrors.length === 0;
    r.note = `felter ${r.fields}, udfyldt ${r.filled}, knapper ${r.buttons} -> output ${after.outputs}${after.sample ? ` ("${after.sample.replace(/\n/g, ' ')}")` : ''}`;
    if (jsErrors.length) r.note += `  ⚠ ${jsErrors.slice(0, 2).join(' | ')}`;
  } catch (e) {
    r.note = 'FEJL: ' + e.message.slice(0, 90);
  }

  results.push({ ...r, jsErrors });
  console.log(`${r.ok ? '✅' : '❌'} ${slug.padEnd(26)} ${r.note}`);
  await page.close();
}

fs.writeFileSync('audit-tools.json', JSON.stringify(results, null, 1));
console.log(`\n=== ${results.filter((x) => !x.ok).length} af ${results.length} værktøjer kræver et nærmere kig`);
await browser.close();
