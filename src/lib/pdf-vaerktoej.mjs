// PDF-værktøjer (16/10-2026): sammenlæg og opdel. Kører i browseren med pdf-lib (MIT, 1.17.1),
// så filerne aldrig forlader brugerens computer. Selvtest: test-pdf.mjs.
import { PDFDocument } from 'pdf-lib';

// "1-3, 5, 8-" -> [[0,1,2],[4],[7,8,...]] (0-baseret). Hver kommadel bliver én ny fil ved opdeling.
// Returnerer { grupper, fejl }.
export function parseSider(tekst, antal) {
  const grupper = [];
  for (const del of String(tekst || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = del.match(/^(\d+)?\s*(-)?\s*(\d+)?$/);
    if (!m || (!m[1] && !m[3])) return { grupper: [], fejl: `"${del}" is not a page or a range like 2-5.` };
    const fra = m[1] ? Number(m[1]) : 1;
    const til = m[2] ? (m[3] ? Number(m[3]) : antal) : fra;
    if (fra < 1 || til > antal || fra > til) return { grupper: [], fejl: `"${del}" is outside pages 1-${antal}.` };
    grupper.push(Array.from({ length: til - fra + 1 }, (_, i) => fra - 1 + i));
  }
  return { grupper, fejl: grupper.length ? null : 'Enter at least one page or range.' };
}

// Sammenlæg: filer = [Uint8Array/ArrayBuffer, ...] i den ønskede rækkefølge.
export async function flet(filer) {
  const ud = await PDFDocument.create();
  for (const f of filer) {
    const kilde = await PDFDocument.load(f, { ignoreEncryption: false });
    const sider = await ud.copyPages(kilde, kilde.getPageIndices());
    sider.forEach((s) => ud.addPage(s));
  }
  return ud.save();
}

// Opdel: én ny PDF pr. gruppe af sider.
export async function opdel(fil, grupper) {
  const kilde = await PDFDocument.load(fil);
  const ud = [];
  for (const g of grupper) {
    const ny = await PDFDocument.create();
    const sider = await ny.copyPages(kilde, g);
    sider.forEach((s) => ny.addPage(s));
    ud.push(await ny.save());
  }
  return ud;
}

export async function sideAntal(fil) {
  return (await PDFDocument.load(fil)).getPageCount();
}
