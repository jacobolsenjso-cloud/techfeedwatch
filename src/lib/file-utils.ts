// Fælles hjælpere til filværktøjerne. Delt af split-file, join-files og
// random-file-generator, så filstørrelser, navne og downloads opfører sig ens.
//
// Alt arbejde sker i browseren. Det er ikke bare en principsag her: en fil man
// vil dele i stykker er som regel for stor eller for privat til at uploade til
// en fremmed server, og det er hele grunden til at bruge et værktøj som dette.

/** 1048576 -> "1 MB". Bruger 1024 som base, som styresystemerne gør. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/** "10" + "MB" -> 10485760. Returnerer 0 ved ugyldigt input frem for NaN. */
export function toBytes(amount: string | number, unit: 'B' | 'KB' | 'MB' | 'GB'): number {
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const factor = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit];
  return Math.floor(n * factor);
}

/** Gemmer en Blob som en fil. Objekt-URL'en frigives igen, ellers hober de sig op. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Kort forsinkelse: Firefox afbryder downloaden hvis URL'en ryger med det samme.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Delnummer med mindst tre cifre: .001, .002 — samme mønster som 7-Zip og split. */
export const partName = (base: string, index: number): string =>
  `${base}.${String(index + 1).padStart(3, '0')}`;
