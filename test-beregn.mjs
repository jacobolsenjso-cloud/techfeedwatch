// Selvtest af src/lib/beregn.mjs (16/10-2026). Kør: node test-beregn.mjs - alle linjer OK, ellers exitkode 1.
// Forventede tal er regnet i hånden (står i kommentaren), ikke kopieret fra koden.
import { dca, fifo, gebyrer, aiPris, lokalAI, gpuTjek, laan, inflation } from './src/lib/beregn.mjs';
let fejl = 0;
const t = (navn, faktisk, forventet, tol = 0.01) => {
  const ok = typeof forventet === 'number' ? Math.abs(faktisk - forventet) <= tol : JSON.stringify(faktisk) === JSON.stringify(forventet);
  if (!ok) fejl++;
  console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}${ok ? '' : ` - fik ${JSON.stringify(faktisk)}, ventede ${JSON.stringify(forventet)}`}`);
};
// DCA: 100/md til 10, 20, 40 -> 10 + 5 + 2,5 = 17,5 stk, værdi 17,5 x 40 = 700, investeret 300
const d = dca([['2020-01', 10], ['2020-02', 20], ['2020-03', 40]], 100, '2020-01');
t('dca: stk', d.coins, 17.5); t('dca: værdi', d.vaerdi, 700); t('dca: investeret', d.investeret, 300);
t('dca: snitkurs 300/17,5', d.snitKurs, 17.142857, 1e-5); t('dca: alt på én gang 300/10 x 40', d.engangVaerdi, 1200);
t('dca: start efter første måned', dca([['2020-01', 10], ['2020-02', 20]], 100, '2020-02').coins, 5);
t('dca: intet beløb = null', dca([['2020-01', 10]], 0, '2020-01'), null);
// FIFO: køb 1 @100 (+1 gebyr), køb 1 @200, sælg 1 @300 (-1 gebyr) -> 300 - 1 - 101 = 198
const f = fifo([{ type: 'buy', antal: 1, pris: 100, gebyr: 1 }, { type: 'buy', antal: 1, pris: 200 }, { type: 'sell', antal: 1, pris: 300, gebyr: 1 }], 30);
t('fifo: gevinst', f.realiseret, 198); t('fifo: skat 30 %', f.skat, 59.4); t('fifo: beholdning', f.beholdning, 1); t('fifo: kostpris af resten', f.kostBeholdning, 200);
t('fifo: tab giver 0 skat', fifo([{ type: 'buy', antal: 1, pris: 100 }, { type: 'sell', antal: 1, pris: 50 }], 30).skat, 0);
t('fifo: solgt mere end købt', fifo([{ type: 'sell', antal: 1, pris: 50 }]).fejl, 'You sold more than you had bought.');
// Gebyrer: 1000 x (0,5 % + 1 %/2) = 10 pr. handel; 2 handler/md -> 240/år
const g = gebyrer({ beloeb: 1000, handlerPrMd: 2, gebyrPct: 0.5, spreadPct: 1 });
t('gebyr: pr. handel', g.prHandel, 10); t('gebyr: pr. år', g.prAar, 240);
// AI: 10 beskeder/dag, 100 ord ind, 300 ud -> 39.900 ind + 119.700 ud tokens/md; pris 2/10 pr. 1M -> 0,0798 + 1,197 = 1,2768
const a = aiPris({ beskederPrDag: 10, ordInd: 100, ordUd: 300, prisInd: 2, prisUd: 10, abonnement: 20 });
t('ai: tokens ind', a.tokInd, 39900); t('ai: api-pris', a.api, 1.2768, 1e-4); t('ai: billigst', a.billigst, 'api');
t('ai: break-even = 20 / (1,2768/300) / 30', a.breakEvenBeskederPrDag, 156.64, 0.01);
// Lokal AI: 8 mia x 4 bit = 4 GB vægte, x1,2 = 4,8 GB
const l = lokalAI({ paramsMia: 8, bits: 4, vramGB: 8, ramGB: 16 });
t('lokal: vægte', l.vaegteGB, 4); t('lokal: brug', l.brugGB, 4.8); t('lokal: passer i GPU', l.dom, 'gpu');
t('lokal: 70 mia x 4 bit = 42 GB > 8 + 16x0,75', lokalAI({ paramsMia: 70, bits: 4, vramGB: 8, ramGB: 16 }).dom, 'nej');
t('lokal: delt mellem GPU og RAM', lokalAI({ paramsMia: 14, bits: 8, vramGB: 8, ramGB: 32 }).dom, 'delt');
// GPU
t('gpu: 65/80 = 15 normal', gpuTjek({ gpu: 65, hotspot: 80, maerke: 'nvidia' }).dDom, 'normal');
t('gpu: 60/88 = 28 problem', gpuTjek({ gpu: 60, hotspot: 88, maerke: 'amd' }).dDom, 'problem');
t('gpu: nvidia 105 tæt på 107', gpuTjek({ gpu: 85, hotspot: 105, maerke: 'nvidia' }).lDom, 'taet-paa');
t('gpu: amd 110 ved loftet', gpuTjek({ gpu: 90, hotspot: 110, maerke: 'amd' }).lDom, 'ved-loft');
// Lån: 100.000 over 10 år til 5 % -> 1.060,66/md (standard annuitetstabel)
const ln = laan({ hovedstol: 100000, rentePct: 5, aar: 10 });
t('lån: ydelse', ln.ydelse, 1060.66, 0.01); t('lån: renter', ln.renter, 27278.62, 0.05);
t('lån: 0 % rente', laan({ hovedstol: 1200, rentePct: 0, aar: 1 }).ydelse, 100);
// Inflation: 1000 ved 3 % i 10 år -> 1343,92; købekraft 744,09
const inf = inflation({ beloeb: 1000, inflationPct: 3, aar: 10 });
t('inflation: fremtidig pris', inf.fremtidigPris, 1343.92); t('inflation: købekraft', inf.koebekraft, 744.09);
console.log(fejl ? `\n${fejl} FEJL` : '\nAlle OK');
process.exit(fejl ? 1 : 0);
