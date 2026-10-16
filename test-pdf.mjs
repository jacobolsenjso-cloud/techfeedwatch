// Selvtest af src/lib/pdf-vaerktoej.mjs (16/10-2026): laver rigtige PDF'er i hukommelsen og tjekker
// sidetal og at siderne kommer i rigtig rækkefølge (hver side har sin egen bredde som "mærke").
import { PDFDocument } from 'pdf-lib';
import { parseSider, flet, opdel, sideAntal } from './src/lib/pdf-vaerktoej.mjs';
let fejl = 0;
const t = (navn, faktisk, forventet) => {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet);
  if (!ok) fejl++;
  console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}${ok ? '' : ` - fik ${JSON.stringify(faktisk)}, ventede ${JSON.stringify(forventet)}`}`);
};
const lav = async (bredder) => { const d = await PDFDocument.create(); bredder.forEach((b) => d.addPage([b, 500])); return d.save(); };
const bredder = async (bytes) => (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth());

t('sider: "1-3, 5"', parseSider('1-3, 5', 10).grupper, [[0, 1, 2], [4]]);
t('sider: "8-" til slut', parseSider('8-', 10).grupper, [[7, 8, 9]]);
t('sider: "-2" fra start', parseSider('-2', 10).grupper, [[0, 1]]);
t('sider: uden for', parseSider('9-12', 10).fejl, '"9-12" is outside pages 1-10.');
t('sider: vrøvl', parseSider('abc', 10).fejl, '"abc" is not a page or a range like 2-5.');
t('sider: tom', parseSider('', 10).fejl, 'Enter at least one page or range.');

const a = await lav([100, 101]); const b = await lav([200, 201, 202]);
const f = await flet([a, b]);
t('flet: 5 sider i rækkefølge', await bredder(f), [100, 101, 200, 201, 202]);
t('flet: omvendt rækkefølge', await bredder(await flet([b, a])), [200, 201, 202, 100, 101]);
t('sideAntal', await sideAntal(f), 5);
const dele = await opdel(f, parseSider('1, 3-5', 5).grupper);
t('opdel: 2 filer', dele.length, 2);
t('opdel: fil 1', await bredder(dele[0]), [100]);
t('opdel: fil 2', await bredder(dele[1]), [200, 201, 202]);
console.log(fejl ? `\n${fejl} FEJL` : '\nAlle OK');
process.exit(fejl ? 1 : 0);
