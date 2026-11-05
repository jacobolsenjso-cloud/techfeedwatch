// Hvem sitet er — ÉT sted (5/11-2026, Jacobs ja 19:24: samme opbygning som techmediaarchs src/lib/entitet.mjs).
// Google og AI-tjenester skal kunne se, at TechFeedWatch er én bestemt ting, og at personen bag alle
// artikler er den samme. Organisationen og personen har hver sit faste @id, beskrives fuldt i MainLayout
// på ALLE sider, og alle andre steder peger kun på dem.
// Faste rammer: navnet skrives "TechFeedWatch" (Jacob 5/11 19:35: samlet, som domæne, profiler og hashtags),
// personen hedder kun "Jacob S. Olsen" (aldrig det fulde navn), ingen LinkedIn i sameAs, opfind aldrig fakta.
import { PERSON_ID, PERSON_NAVN, PERSON_URL, PERSON_SAMEAS } from './person.mjs';
import { ALLE_EMNER } from './emner.mjs';

export { PERSON_ID, PERSON_NAVN, PERSON_URL };
export const SITE = 'https://techfeedwatch.com';
export const BRAND = 'TechFeedWatch';
export const ORG_ID = `${SITE}/#organization`;
// Titlen (Jacob 5/11-2026: samme som på techmediaarch) — ens i schema, forfatterboks, about og llms.txt
export const PERSON_TITEL = 'Founder & Editor';
// Startet juni 2026 (Jacob 5/11-2026; den ældste artikel i arkivet er fra 11. juni 2026)
export const STARTET = '2026-06';
export const STARTET_TEKST = 'June 2026';
// Biografien (Jacob 5/11-2026: samme som techmediaarchs, med TechFeedWatch). Kun det, Jacob har sagt er sandt.
// Vises i forfatterboksen, på forfattersiden og som Person.description.
export const PERSON_BIO = 'Jacob builds and runs three websites himself, including TechFeedWatch, and set up the AI robots that research and draft their articles. Over the years he has done affiliate marketing, SEO, image and video editing and YouTube channel setup, and he has used Bitcoin and crypto wallets since 2011, so security questions are personal to him. He lives in Denmark.';
// Sitets EGNE profiler (en TechFeedWatch-side på YouTube, Pinterest, Facebook …). TOM indtil Jacob har
// oprettet dem, og de linker tilbage til sitet. Jacobs personlige profiler står på personen (person.mjs).
// Én linje pr. profil, fx 'https://www.pinterest.com/techfeedwatch/'.
export const PROFILER = [];
// Står ordret som første afsnit på about-siden (src/content/pages/about.md).
// src/pages/[slug].astro stopper bygget, hvis de to ikke står ens — så schema og side ikke glider fra hinanden.
export const BESKRIVELSE = 'TechFeedWatch gives straight answers to the questions people search for about AI, tech, fintech and crypto, in plain language. Every article credits the creator whose video it draws on and links to it.';

// NewsMediaOrganization (20/9-2026): de fire politik-felter findes kun på denne type, og de peger på sider,
// der findes og er sande.
export const organisation = () => ({
  '@type': 'NewsMediaOrganization', '@id': ORG_ID, name: BRAND, alternateName: ['techfeedwatch.com', 'Tech Feed Watch'],
  url: SITE + '/', logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png`, width: 512, height: 512 },
  description: BESKRIVELSE, email: 'info@techfeedwatch.com', foundingDate: STARTET,
  address: { '@type': 'PostalAddress', addressCountry: 'DK' },
  founder: { '@id': PERSON_ID }, knowsAbout: ALLE_EMNER,
  publishingPrinciples: `${SITE}/about`, ownershipFundingInfo: `${SITE}/about`,
  correctionsPolicy: `${SITE}/corrections`, actionableFeedbackPolicy: `${SITE}/contact`,
  ...(PROFILER.length ? { sameAs: PROFILER } : {}),
});
export const person = () => ({
  '@type': 'Person', '@id': PERSON_ID, name: PERSON_NAVN, jobTitle: PERSON_TITEL, description: PERSON_BIO,
  url: PERSON_URL, image: `${SITE}/jacob-olsen.png`, sameAs: PERSON_SAMEAS,
  worksFor: { '@id': ORG_ID }, knowsAbout: ALLE_EMNER,
});
// Korte henvisninger i artikler og guides (navn med, så de også giver mening alene).
export const forfatterRef = () => ({ '@type': 'Person', '@id': PERSON_ID, name: PERSON_NAVN, url: PERSON_URL });
export const udgiverRef = () => ({ '@type': 'NewsMediaOrganization', '@id': ORG_ID, name: BRAND });
// Sitets "jeg"-afsnit er Jacobs egne holdninger fra hans noter (src/lib/hjerne.mjs). Findes der et i
// teksten, siger forfatterboksen det (Jacob 5/11: som på techmediaarch) - ellers står "I" uden afsender.
export const harJegAfsnit = (tekst) => /(^|[.!?]\s+)(I|My)\s|\b(myself|In my view|my own)\b/m.test(String(tekst || '').replace(/^>.*$/gm, ''));
