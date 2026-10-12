// Selvtest af src/lib/kildetjek.mjs og de rene dele af src/lib/soegning.mjs (12/10-2026).
// Kør: node test-kildetjek.mjs — alle linjer skal være OK, ellers exitkode 1.
import { videoAndel, talUdenKilde, harTalPaastand, videoAfsnit, brugteKilder, kildelisteMd, titelAfAdresse } from './src/lib/kildetjek.mjs';
import { domaeneLed, erKildeTilladt, udgivernavne, parseSoegning, kilderTilLinje } from './src/lib/soegning.mjs';

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

console.log(fejl ? `\n${fejl} FEJL` : '\nAlle OK');
process.exit(fejl ? 1 : 0);
