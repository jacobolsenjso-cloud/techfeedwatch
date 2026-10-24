// Én kilde til, hvem Jacob er i de strukturerede data (schema.org).
// Hvorfor ét sted: før 24/10-2026 stod personen fire steder (forfattersiden,
// fælles-schemaet i MainLayout, artiklerne og guiderne) med hver sin kopi, og
// kun X var med. Nu rettes navn og profilliste her, og alle sider følger med.
//
// sameAs = Jacobs egne profiler andre steder. Google og AI-søgning bruger dem
// til at se, at det er samme menneske. Hver adresse er tjekket live 24/10-2026.
// LinkedIn er bevidst IKKE med endnu: adressen indeholder Jacobs fulde navn,
// som han ikke vil have på nettet (24/10). Tilføjes, når han har skiftet
// LinkedIn-adressen til en uden det fulde navn - og den er tjekket live.
// En død adresse her er værre end ingen: ret listen, når en profil flytter.
export const PERSON_ID = 'https://techfeedwatch.com/author/jacob-olsen#person';
export const PERSON_NAVN = 'Jacob S. Olsen';
export const PERSON_URL = 'https://techfeedwatch.com/author/jacob-olsen/';
export const PERSON_SAMEAS = [
  'https://x.com/JacobStubbeJS',
  'https://github.com/jacobolsenjso-cloud',
  'https://bsky.app/profile/jacob-dk.bsky.social',
  'https://gravatar.com/jacobolsenjso',
];

// Kort henvisning til personen inde i andre blokke (founder, author).
// @id peger på den fulde beskrivelse på forfattersiden, så Google ser ÉN person
// i stedet for flere med samme navn. ekstra lægger felter til (fx jobTitle).
export const personRef = (ekstra = {}) => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: PERSON_NAVN,
  url: PERSON_URL,
  sameAs: PERSON_SAMEAS,
  ...ekstra,
});
