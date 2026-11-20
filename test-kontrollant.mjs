// Selvtest af kontrollanten (20/11-2026) - uden net og uden Gemini: falske kildesider og et falsk Gemini, der svarer
// ud fra prompten. Kører i robottens selvtest (daily-update.yml). Afslutter med kode 1 ved fejl.
import { kildeliste, kildeSaetninger, lagC, citatPaaSiden, kontrollerMarkdown, vaernRettelse, erNavnloes } from './src/lib/kontrollant.mjs';
import { laesFelter, medFelter } from './src/lib/artikelfelter.mjs';

let fejl = 0, ok = 0;
const tjek = (navn, betingelse, info = '') => { if (betingelse) ok++; else { fejl++; console.log(`FEJL: ${navn} ${info}`); } };

const MD = `---
title: "Test Article About Qubits"
metaDescription: "Short meta."
summary: "Entanglement links qubits. Measuring one reveals the other."
channelTitle: "Some Channel"
faqs:
  - question: "What is entanglement?"
    answer: "NIST explains entanglement as a link between particles that cannot be described independently."
keyFacts:
  - text: "MIT built a 16-qubit superconducting processor to study entanglement structure."
    source: "MIT"
    url: "https://news.mit.edu/x"
---

Entanglement links qubits into one shared state.

## How it works
According to [IBM](https://www.ibm.com/blog/a), scientists entangled all 27 qubits of a processor in October 2021. MIT highlights that the Gottesman-Knill theorem proves classical simulation is possible. Some Channel explains that cards can be sorted fast in this example.

Researchers estimate that cracking RSA requires 4,000 logical qubits working together.

## Sources
- [IBM blog](https://www.ibm.com/blog/a) — ibm.com
- [MIT News](https://news.mit.edu/x) — mit.edu
- [NIST](https://www.nist.gov/y) — nist.gov
- [Video](https://www.youtube.com/watch?v=abc) — Some Channel on YouTube
`;

// --- rene funktioner ---
const l = laesFelter(MD);
tjek('kildeliste uden YouTube', kildeliste(l.f.brodtekst).length === 3);
const ks = kildeSaetninger(l.f, 'Some Channel');
tjek('IBM-sætningen har linket alene', ks.some((s) => s.link && s.urls.length === 1 && s.urls[0].includes('ibm.com') && s.tekst.includes('27 qubits')));
tjek('MIT-sætningen peger på mit.edu', ks.some((s) => /Gottesman/.test(s.tekst) && s.urls.some((u) => u.includes('mit.edu'))));
tjek('videoens sætning tjekkes ikke mod websider', !ks.some((s) => /Some Channel explains/.test(s.tekst)));
tjek('FAQ og faktaboks er med', ks.some((s) => s.felt === 'faq') && ks.some((s) => s.felt === 'faktaboks'));
tjek('"mit" i "submit" er ikke MIT', !kildeSaetninger({ titel: '', meta: '', resume: '', faqs: [], faktaboks: [], brodtekst: 'Please submit the form to the office today now.\n\n## Sources\n- [M](https://news.mit.edu/x) — mit.edu\n' }).length);
const ps = (t) => kildeSaetninger({ titel: '', meta: '', resume: '', faqs: [], faktaboks: [], brodtekst: `${t}\n\n## Sources\n- [PS Blog](https://blog.playstation.com/x) — playstation.com\n` }).length;
tjek('emnet "PlayStation" er ikke en kilde', ps('A PlayStation 5 costs less upfront than most gaming PCs today.') === 0);
tjek('"PlayStation\'s blog says" er en kilde', ps("PlayStation's official blog says the console supports 120 fps output.") === 1);
tjek('"according to PlayStation" er en kilde', ps('According to PlayStation, the console supports 120 fps output.') === 1);
// Værnene mod kontrollantens egne fejl (målt 20/11)
tjek('værn: nyt link fjernes', vaernRettelse('Creator X explains it.', 'Engineer Y, known as [X](https://optin.example.com/page), explains it.') === 'Engineer Y, known as X, explains it.');
tjek('værn: eksisterende link bevares', vaernRettelse('See [IBM](https://www.ibm.com/a) for it.', 'See [IBM](https://www.ibm.com/a) for this.').includes('(https://www.ibm.com/a)'));
tjek('værn: kilde-link tilladt', vaernRettelse('IBM said so.', 'The [IBM blog](https://www.ibm.com/b) said so.', ['https://www.ibm.com/b']).includes('(https://www.ibm.com/b)'));
tjek('værn: navnløs rettelse -> fjernes', vaernRettelse('In his analysis, 61% of firms were hit.', 'Industry research indicates that 61% of firms were hit.') === '');
tjek('erNavnloes: "studies show"', erNavnloes('Studies show that most users skip the manual.'));
tjek('erNavnloes: "researchers at MIT found" er navngivet', !erNavnloes('Researchers at MIT found that the chip runs cooler.'));
const c = lagC(l.f);
tjek('navnløs autoritet fanges', c.navnloese.length === 1 && /Researchers estimate/.test(c.navnloese[0]));
tjek('meta-længde måles', c.meta === 11);
const side = { tekst: 'Scientists at the University of Melbourne generated a state over all 27 qubits of the processor. It worked well.' };
tjek('citat ordret: ja', citatPaaSiden(side, 'generated a state over all 27 qubits of the processor') === true);
tjek('citat med ... : ja', citatPaaSiden(side, 'Scientists at the University of Melbourne ... all 27 qubits of the processor') === true);
tjek('opdigtet citat: nej', citatPaaSiden(side, 'IBM Research entangled 500 qubits in a single afternoon') === false);
tjek('PDF: kan ikke afgøres', citatPaaSiden({ pdf: 'x' }, 'anything at all here') === null);
// medFelter: ændret meta + faktaboks fjernet skrives tilbage, resten urørt
const l2 = laesFelter(MD); l2.f.meta = 'A longer meta.'; l2.f.faktaboks = [];
const ny = medFelter(MD, l2).raw;
tjek('medFelter: meta skrevet', ny.includes('metaDescription: "A longer meta."'));
tjek('medFelter: fjernet faktapunkt væk', !ny.includes('16-qubit superconducting'));
tjek('medFelter: resten urørt', ny.includes('channelTitle: "Some Channel"') && ny.includes('## Sources'));

// --- hele kontrollanten med falske sider og falsk Gemini ---
const SIDER = {
  'https://www.ibm.com/blog/a': '<html><body><p>' + 'Scientists at the University of Melbourne generated a state over all 27 qubits of the IBM Quantum Montreal processor. '.repeat(20) + '</p></body></html>',
  'https://news.mit.edu/x': '<html><body><p>' + 'MIT researchers built a 16-qubit superconducting processor to study entanglement structure. '.repeat(20) + '</p></body></html>',
  'https://www.nist.gov/y': '<html><body><p>' + 'Entanglement is a property where particles cannot be described independently of each other. '.repeat(20) + '</p></body></html>',
};
globalThis.fetch = async (url) => {
  const t = SIDER[url];
  return { ok: !!t, headers: { get: () => 'text/html' }, text: async () => t || '', arrayBuffer: async () => new ArrayBuffer(0) };
};
const svarPaa = (p) => {
  if (/Below is the text of a web page/.test(p)) {
    const ss = [...p.matchAll(/^(\d+)\. (.*)$/gm)].map((m) => ({ n: Number(m[1]), s: m[2] }));
    return ss.map(({ n, s }) => (/Gottesman/.test(s) ? { n, verdict: 'NO', missing: 'the page does not mention Gottesman-Knill' }
      : /27 qubits/.test(s) && /ibm/.test(p) ? { n, verdict: 'SUPPORTED', quote: 'generated a state over all 27 qubits of the IBM Quantum Montreal processor' }
      : /16-qubit/.test(s) ? { n, verdict: 'SUPPORTED', quote: 'built a 16-qubit superconducting processor to study entanglement structure' }
      : /NIST/.test(s) || /described independently/.test(s) ? { n, verdict: 'SUPPORTED', quote: 'particles cannot be described independently of each other' }
      : { n, verdict: 'NO', missing: 'not on this page' }));
  }
  if (/states ONLY what the EVIDENCE supports/.test(p)) return [{ n: 1, fix: 'REMOVE' }];
  if (/senior subject-matter expert/.test(p)) return [
    { sentence: 'Short meta.', type: 'META', why: 'too short', fix: 'Learn how entanglement links qubits, how scientists measured it on real processors, and what it does and does not do for quantum computing today.' },
    { sentence: 'Researchers estimate that cracking RSA requires 4,000 logical qubits working together.', type: 'UNNAMED', why: 'who?', fix: 'A 2019 study by Craig Gidney and Martin Ekerå estimated that cracking RSA-2048 needs about 20 million noisy qubits.' },
  ];
  if (/An editor corrected these sentences/.test(p)) return [{ n: 1, verdict: 'OK' }];
  if (/coheren|sammenh|paragraph/i.test(p)) return [];
  return [];
};
const falskGemini = { getGenerativeModel: () => ({ generateContent: async (input) => {
  const p = Array.isArray(input) ? input.map((x) => x.text || '').join('\n') : String(input);
  const t = JSON.stringify(svarPaa(p));
  return { response: { text: () => t, usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 }, candidates: [{ finishReason: 'STOP' }] } };
} }) };
const logs = [];
const r = await kontrollerMarkdown(falskGemini, MD, (t) => logs.push(t));
const k = r.kontrol;
tjek('rapport: kildesætninger tjekket', k.kildeTjekket >= 4, JSON.stringify(k).slice(0, 200));
tjek('rapport: MIT-sætningen fjernet', !r.markdown.includes('Gottesman') && k.rettelser.some((x) => /Gottesman/.test(x.foer) && !x.efter));
tjek('rapport: meta rettet', r.markdown.includes('metaDescription: "Learn how entanglement links qubits') && k.rettelser.some((x) => x.type === 'META'));
tjek('rapport: navnløs rettet', r.markdown.includes('Craig Gidney') && !r.markdown.includes('Researchers estimate'));
tjek('IBM-sætningen urørt', r.markdown.includes('all 27 qubits of a processor in October 2021'));
tjek('kilder og video urørt', r.markdown.includes('## Sources') && r.markdown.includes('Some Channel explains'));
tjek('ingen "kunne ikke"', !k.kunneIkke.length, JSON.stringify(k.kunneIkke));
console.log(`test-kontrollant: ${ok} ok, ${fejl} fejl`);
if (fejl) process.exit(1);
