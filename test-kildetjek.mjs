// Selvtest af src/lib/kildetjek.mjs og de rene dele af src/lib/soegning.mjs (12/10-2026).
// Kør: node test-kildetjek.mjs — alle linjer skal være OK, ellers exitkode 1.
import { videoAndel, talUdenKilde, harTalPaastand, videoAfsnit, brugteKilder, kildelisteMd, titelAfAdresse, noegleFakta, delFaktum } from './src/lib/kildetjek.mjs';
import { domaeneLed, erKildeTilladt, udgivernavne, parseSoegning, kilderTilLinje, daekning } from './src/lib/soegning.mjs';
import { tjekOutline, outlineBrugt, faqFraSoegninger } from './src/lib/artikelplan.mjs';

let fejl = 0;
const t = (navn, faktisk, forventet) => {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet);
  if (!ok) fejl++;
  console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}${ok ? '' : ` — fik ${JSON.stringify(faktisk)}, ventede ${JSON.stringify(forventet)}`}`);
};

// Domænenavne som kildenavne
t('ibm.com -> ibm', domaeneLed('ibm.com'), 'ibm');
t('legislation.gov.uk -> legislation', domaeneLed('legislation.gov.uk'), 'legislation');
t('research.google -> google', domaeneLed('research.google'), 'google');
t('csrc.nist.gov -> nist', domaeneLed('csrc.nist.gov'), 'nist');
t('scribd spærret', erKildeTilladt('www.scribd.com'), false);
t('nist tilladt', erKildeTilladt('csrc.nist.gov'), true);
t('udgivernavne', udgivernavne(["According to IBM's Cost of a Data Breach Report 2024, costs rose.", 'According to the National Institute of Standards and Technology (NIST), a breach is ...']).sort(), ['IBM', 'NIST', 'National Institute of Standards'].sort());

// Tal-påstande: årstal alene tæller ikke, store tal uden enhed gør
t('årstal er ikke en påstand', harTalPaastand('Sora launched in 2024.'), false);
t('procent er en påstand', harTalPaastand('Costs rose 10% last year.'), true);
t('stort tal uden enhed', harTalPaastand('It counted 10,626 breaches.'), true);
t('lille listetal er ikke', harTalPaastand('There are three steps and 2 options.'), false);

// Delspørgsmål og fakta fra søgesvaret + kobling til Googles henvisninger
const svar = 'SUBQUESTIONS:\n1. What is a breach?\n2. Why does it matter?\n3. What should you do?\nFACTS:\n- According to IBM, the average cost was USD 4.88 million in 2024.\n- According to Verizon, 68% of breaches involved a human element.';
const p = parseSoegning(svar);
t('3 delspørgsmål', p.delspoergsmaal.length, 3);
t('2 fakta', p.fakta.length, 2);
t('kobling med punkttegn og overskrift', kilderTilLinje(p.fakta[0], [{ segment: { text: 'FACTS:\n- According to IBM, the average cost was USD 4.88 million in 2024.' }, groundingChunkIndices: [3] }]), [3]);

// En artikel i den nye form: svar, et webafsnit, videoens afsnit
const kanal = 'Human Error';
const md = `A data breach means private records reached someone who should not have them.

## How common are breaches?

According to Verizon, 68% of breaches involved a human element. The average cost was USD 4.88 million.

Costs rose 10% in one year.

## What Human Error shows about breach letters

Northgate got a letter that ran to 400 words. Denise read it three times.`;
const fakta = [{ type: 'navn', key: 'Northgate', text: '' }, { type: 'tal', key: '400 words', text: '' }];
t('videoafsnit fundet', videoAfsnit(md, kanal), ['What Human Error shows about breach letters']);
const va = videoAndel(md, kanal, fakta, 'According to Verizon, 68% ...');
t('videoandel: kun videoafsnittet (9 + 5 ord)', [va.video, va.afsnitOrd], [14, 14]);
// "Costs rose 10%" har ingen kilde, men sætningen før nævner Verizon? Nej — den står i sit eget afsnit.
t('tal uden kilde', talUdenKilde(md, ['Verizon', 'ibm'], kanal), ['Costs rose 10% in one year.']);
// Et navn fra videoen uden for videoafsnittet tæller som video
const md2 = md.replace('Costs rose 10% in one year.', 'Firms like Northgate learn this the hard way.');
t('videonavn uden for afsnittet tæller', videoAndel(md2, kanal, fakta, '').video, 14 + 8);

// Kildeliste: kun sider, artiklen nævner
const soeg = { kilder: [{ nr: 1, domaene: 'verizon.com', url: 'https://www.verizon.com/dbir', titel: '2024 DBIR' }, { nr: 2, domaene: 'ibm.com', url: 'https://www.ibm.com/x', titel: 'Cost of a data breach [2024]' }], fakta: [{ nr: 1, tekst: 'According to Verizon, 68% ...', kilder: [1] }, { nr: 2, tekst: "According to IBM's report, USD 4.88 million", kilder: [2] }] };
t('brugte kilder', brugteKilder(md, soeg).map((k) => k.nr), [1]);
t('kildeliste', kildelisteMd(brugteKilder(md, soeg), { videoId: 'abc', videoTitel: 'Breach letters', kanal }),
  '## Sources\n\n- [2024 DBIR](https://www.verizon.com/dbir) — verizon.com\n- [Breach letters](https://www.youtube.com/watch?v=abc) — Human Error on YouTube');

// Titel af adressen, når siden ingen titel gav
t('PDF-titel af adressen', titelAfAdresse('https://www.verizon.com/business/resources/infographics/2024-dbir-infographic.pdf'), '2024 dbir infographic (PDF)');
t('talsti -> domæne + sti', titelAfAdresse('https://www.legislation.gov.uk/eur/2016/679/article/4'), 'legislation.gov.uk/eur/2016/679/article/4');

// Kilden i sætningen lige før, men i et afsnit for sig (afsnittet blev delt) — under samme overskrift
const delt = `## Paid ads\n\nAccording to Google Research, ads were paused in a study.\n\nThe authors found 89% of visits were not replaced.\n\n## Other\n\nThe share rose 12% that year.`;
t('kilde i afsnittet før, samme overskrift', talUdenKilde(delt, ['Google Research'], 'Kanal'), ['The share rose 12% that year.']);

// Tekniske enheder og tabeller
t('temperatur er en påstand', harTalPaastand('The hotspot reached 107°C under load.'), true);
t('GHz er en påstand', harTalPaastand('It boosts to 2.5 GHz.'), true);
const tabel = `## Ranges\n\nAccording to Nvidia, these deltas are normal:\n\n| State | Delta |\n|---|---|\n| Normal | 11°C to 14°C |\n| Bad | 30°C |\n\n## Other\n\n| State | Delta |\n|---|---|\n| Bad | 30°C |`;
t('tabel med kilde før / tabel uden kilde', talUdenKilde(tabel, ['Nvidia'], 'Kanal'), ['| Bad | 30°C |']);

// Artikelplan (outline + FAQ fra rigtige søgninger)
const dq = ['What is a breach?', 'Why does it matter?', 'What should you do?', 'Who must be told?'];
const godPlan = { sections: [{ h2: 'Why Breaches Cost So Much', covers: [2] }, { h2: 'Steps to Take After a Breach', covers: [3] }, { h2: 'Who Must Be Notified, and When?', covers: [4] }], video: 'What Human Error Shows About Breach Letters', closing: '' };
t('outline godkendt', tjekOutline(godPlan, dq, 'Human Error'), []);
t('outline: delspørgsmål mangler + skabelon', tjekOutline({ ...godPlan, sections: [{ h2: 'How It Works', covers: [2] }, { h2: 'Steps to Take', covers: [3] }, { h2: 'Costs', covers: [3] }] }, dq, 'Human Error'), ['delspørgsmål 4 ikke dækket', 'skabelon: "How It Works"', 'ingen overskrift er et spørgsmål']);
t('outline: video uden kanal', tjekOutline({ ...godPlan, video: 'What the Video Shows' }, dq, 'Human Error'), ['videooverskriften nævner ikke kanalen']);
t('outline brugt', outlineBrugt('## Why Breaches Cost So Much\n\ntext\n\n## Steps to Take After a Breach!\n', { sections: ['Why Breaches Cost So Much', 'Steps to Take After a Breach', 'Other'], video: 'V', closing: '' }), { brugt: 2, ialt: 4 });
t('FAQ fra rigtige søgninger', faqFraSoegninger([{ question: 'How long does a data breach investigation take?' }, { question: 'Is my bank safe?' }], ['how long does a data breach investigation take', 'what is a data breach']), 1);

// Dækningstjek (A, 16/10): delspørgsmål uden et eneste ord i fakta droppes; nr. 1 bliver altid
const dk = daekning(
  ['What does a data breach mean?', 'What are the most common causes of a data breach?', 'How much does a data breach cost?', 'What leadership changes did Nike make?'],
  [{ tekst: 'According to IBM, the average cost of a data breach reached $4.88 million in 2024.' }, { tekst: 'Verizon found that stolen credentials caused 31% of breaches.' }],
  'what does a data breach mean');
t('dækning: behold', dk.behold, ['What does a data breach mean?', 'What are the most common causes of a data breach?', 'How much does a data breach cost?']);
t('dækning: drop', dk.droppet.map((x) => x.q), ['What leadership changes did Nike make?']);
t('dækning: kun emneord = behold', daekning(['What is a data breach?', 'What is a data breach, really?'], [], 'what is a data breach').behold.length, 2);

// Faktaboks (trin 4, 16/10)
t('delFaktum: kilde ud, tekst stort', delFaktum("According to IBM's Cost of a Data Breach Report 2024, the global average cost of a data breach reached USD 4.88 million."), { kilde: "IBM's Cost of a Data Breach Report 2024", tekst: 'The global average cost of a data breach reached USD 4.88 million.' });
t('delFaktum: dato med komma bliver i kilden', delFaktum("According to Tom's Hardware on February 16, 2021, standard GPU temperature is an average across the die's sensors.").kilde, "Tom's Hardware on February 16, 2021");
t('delFaktum: "which ..." kan ikke stå alene', delFaktum('According to Verizon, which analyzed over 22,000 incidents, stolen credentials led.').kilde, '');
const nfSoeg = { fakta: [
  { nr: 1, kilder: [1], tekst: "According to IBM's 2024 report, the average cost of a data breach reached USD 4.88 million worldwide." },
  { nr: 2, kilder: [2], tekst: "According to IBM's 2025 report, the average breach lifecycle was 241 days from detection to containment." },
  { nr: 3, kilder: [3], tekst: "According to Verizon's 2025 DBIR, ransomware was present in 44% of all confirmed breaches that year." },
  { nr: 4, kilder: [4], tekst: 'According to NIST, a data breach is an incident where protected information is viewed or stolen by an unauthorized person.' },
] };
const nfSider = [{ nr: 1, domaene: 'ibm.com', url: 'https://ibm.com/r' }, { nr: 2, domaene: 'statisticsfundamentals.com', url: 'https://statisticsfundamentals.com/x' }, { nr: 3, domaene: 'verizon.com', url: 'https://verizon.com/d' }, { nr: 4, domaene: 'csrc.nist.gov', url: 'https://csrc.nist.gov/g' }];
t('nøglefakta: link skal være udgiverens eget (IBM via statisticsfundamentals droppes)', noegleFakta(nfSoeg, nfSider).map((f) => f.url), ['https://ibm.com/r', 'https://verizon.com/d', 'https://csrc.nist.gov/g']);
t('nøglefakta: under 3 = ingen boks', noegleFakta(nfSoeg, nfSider.slice(0, 2)), []);

console.log(fejl ? `\n${fejl} FEJL` : '\nAlle OK');
process.exit(fejl ? 1 : 0);
