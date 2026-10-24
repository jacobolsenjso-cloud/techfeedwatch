// Test af PageSpeed-Workeren.
//   node cloudflare/pagespeed/test.mjs        - logiktest (ingen netværk)
//   node cloudflare/pagespeed/test.mjs live   - kalder den udrullede Worker som techfeedwatch.com
import { tjekAdresse, udsnit } from './worker.mjs';
let ok = 0, fejl = 0;
const t = (navn, b) => { b ? ok++ : fejl++; console.log(`${b ? 'OK ' : 'FEJL'} ${navn}`); };

t('https godkendt', tjekAdresse('https://techfeedwatch.com/') === 'https://techfeedwatch.com/');
t('http godkendt', !!tjekAdresse('http://example.com/a?b=1'));
t('ftp afvist', tjekAdresse('ftp://example.com/') === null);
t('localhost afvist', tjekAdresse('http://localhost:4321/') === null);
t('privat net afvist', tjekAdresse('http://192.168.1.1/') === null && tjekAdresse('http://10.0.0.1/') === null && tjekAdresse('http://172.20.0.1/') === null);
t('uden punktum afvist', tjekAdresse('http://intranet/') === null);
t('vrøvl afvist', tjekAdresse('ikke en adresse') === null);

const eks = {
  id: 'https://example.com/',
  loadingExperience: { overall_category: 'AVERAGE', metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2900, category: 'AVERAGE' }, CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 3, category: 'FAST' } } },
  lighthouseResult: {
    finalDisplayedUrl: 'https://example.com/', fetchTime: '2026-10-24T20:00:00.000Z',
    categories: { performance: { score: 0.734 }, accessibility: { score: 0.96 }, 'best-practices': { score: 1 }, seo: { score: null } },
    audits: {
      'largest-contentful-paint': { title: 'Largest Contentful Paint', displayValue: '3.1 s', score: 0.6 },
      'render-blocking-resources': { title: 'Eliminate render-blocking resources', score: 0.3, scoreDisplayMode: 'metricSavings', details: { overallSavingsMs: 820 } },
      'unused-javascript': { title: 'Reduce unused JavaScript', score: 0.5, scoreDisplayMode: 'metricSavings', metricSavings: { LCP: 450, FCP: 0 } },
      'uses-http2': { title: 'Use HTTP/2', score: 1, details: { overallSavingsMs: 0 } },
      'dom-size': { title: 'Avoid an excessive DOM size', score: 0.4, scoreDisplayMode: 'informative' },
    },
  },
};
const u = udsnit(eks, 'mobile');
t('scorer rundet', u.scores.performance === 73 && u.scores.accessibility === 96 && u.scores.bestPractices === 100 && u.scores.seo === null);
t('lab har LCP', u.lab.length === 1 && u.lab[0].value === '3.1 s');
t('feltdata 2 målinger', u.field?.metrics.length === 2 && u.field.overall === 'AVERAGE');
t('forbedringer sorteret, bestået og informative udeladt', u.improvements.length === 2 && u.improvements[0].savingsMs === 820 && u.improvements[1].savingsMs === 450);
t('ingen feltdata = null', udsnit({ lighthouseResult: {} }, 'desktop').field === null);
t('svaret indeholder ingen nøgle', !JSON.stringify(u).includes('key'));

if (process.argv[2] === 'live') {
  const W = 'https://tfw-pagespeed.jacobolsenjso.workers.dev';
  const h = await (await fetch(`${W}/health`)).json();
  console.log('health:', JSON.stringify(h));
  const fremmed = await fetch(`${W}/run?url=https://example.com/`, { headers: { Origin: 'https://evil.example' } });
  t('fremmed side afvist (403)', fremmed.status === 403);
  const t0 = Date.now();
  const r = await fetch(`${W}/run?url=${encodeURIComponent('https://techfeedwatch.com/')}&strategy=mobile`, { headers: { Origin: 'https://techfeedwatch.com' } });
  const j = await r.json();
  console.log(`run: [${r.status}] ${Date.now() - t0} ms`);
  console.log(JSON.stringify(j, null, 1).slice(0, 2500));
  t('live svar 200 med performance-score', r.status === 200 && typeof j.scores?.performance === 'number');
}
console.log(`\n${ok} ok, ${fejl} fejl`);
process.exit(fejl ? 1 : 0);
