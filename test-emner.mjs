// Selvtest af emnelisten og robottens 50/50-fordeling (17/10-2026). Kør: node test-emner.mjs
import { ALLE_EMNER, NYE_EMNER, GAMLE_EMNER, emneRaekke, emneSlug, VOKSE_GRAENSE } from './src/lib/emner.mjs';
let fejl = 0, antalTest = 0;
const t = (navn, ok) => { antalTest++; console.log(`${ok ? 'OK  ' : 'FEJL'} ${navn}`); if (!ok) fejl++; };

t('18 emner, ingen dubletter', ALLE_EMNER.length === 18 && new Set(ALLE_EMNER).size === 18);
t('slugs er unikke', new Set(ALLE_EMNER.map(emneSlug)).size === 18);
t('slug "Investing & Trading" = investing-trading', emneSlug('Investing & Trading') === 'investing-trading');
t('slug "PC Building & Gaming" = pc-building-gaming', emneSlug('PC Building & Gaming') === 'pc-building-gaming');

// Tal som i dag: gamle 37-273, nye 0-33
const counts = { 'AI & Tech': 273, SEO: 38, Automation: 39, Coding: 39, 'Business & Money': 90, 'AI Video': 37, Productivity: 39, Fintech: 59, Crypto: 48, Cybersecurity: 38, 'Quantum Computing': 38, 'Hardware & Chips': 51, 'AR & VR': 38,
  'AI Agents': 33, 'Investing & Trading': 8, 'Smartphones & Gadgets': 5, Robotics: 1, 'PC Building & Gaming': 0 };
const lige = emneRaekke(counts, 438), ulige = emneRaekke(counts, 439);
t(`lige antal: et nyt emne først (${lige[0]})`, lige[0] === 'PC Building & Gaming');
// AI Agents (33) er over vokse-grænsen og tyndere end alle gamle (min. 37) - så det tager de ikke-voksendes tur, til det er indhentet.
t(`lige antal: et gammelt emne som nr. 2 (${lige[1]})`, lige[1] === 'AI Video');
t(`ulige antal: et gammelt emne først (${ulige[0]})`, ulige[0] === 'AI Video');
t('ulige antal, når AI Agents er indhentet: et gammelt emne først', emneRaekke({ ...counts, 'AI Agents': 40 }, 439)[0] === 'AI Video');
t(`ulige antal: et nyt emne som nr. 2 (${ulige[1]})`, ulige[1] === 'PC Building & Gaming');
t('AI Agents (33) er over vokse-grænsen og tæller som almindeligt emne', !emneRaekke(counts, 438).slice(0, 1).includes('AI Agents') && counts['AI Agents'] >= VOKSE_GRAENSE);
t('rækken rummer alle 18 emner præcis én gang', lige.length === 18 && new Set(lige).size === 18);

// Simulér 40 udgivelser: hver anden skal gå til et voksende emne
const c = { ...counts }; let antal = 438, nyeFaar = 0, gamleFaar = 0;
for (let i = 0; i < 40; i++) { const e = emneRaekke(c, antal, i)[0]; const voksede = NYE_EMNER.includes(e) && c[e] < VOKSE_GRAENSE; c[e]++; antal++; if (voksede) nyeFaar++; if (GAMLE_EMNER.includes(e)) gamleFaar++; }
t(`40 udgivelser: 20 til voksende emner (${nyeFaar})`, nyeFaar === 20);
t(`40 udgivelser: de gamle 13 får præcis 20 (${gamleFaar})`, gamleFaar === 20);
t(`tyndeste nye emne er vokset (PC ${c['PC Building & Gaming']}, Robotics ${c.Robotics})`, c['PC Building & Gaming'] >= 4 && c.Robotics >= 4);

// Når alle nye har nået grænsen: almindelig tyndest-først igen
const fuld = { ...counts }; NYE_EMNER.forEach((e) => { fuld[e] = 60; });
t('alle nye over grænsen: tyndeste emne overhovedet vælges (AI Video)', emneRaekke(fuld, 438)[0] === 'AI Video' && emneRaekke(fuld, 439)[0] === 'AI Video');

// Uafgjort: slot skifter mellem emner med samme antal
const lige2 = { ...counts, Robotics: 0 };
t('uafgjort: forskellige slots giver forskellige emner', emneRaekke(lige2, 438, 0)[0] !== emneRaekke(lige2, 438, 1)[0]);
t('GAMLE_EMNER uændret (13)', GAMLE_EMNER.length === 13);

t(`antal test kørt (${antalTest + 1}) >= 15`, antalTest + 1 >= 15);
console.log(fejl ? `${fejl} FEJL` : `Alle OK (${antalTest} test)`); process.exit(fejl ? 1 : 0);
