// Gamle artikler ud af Google, indtil de er omskrevet (Jacobs ja 13/11-2026 kl. 21:35).
//
// Hvorfor: Google bedømmer hele sitet. Målt 13/11: 40 sider indekseret, 937 ikke; af de 11 rigtige artikler i
// "Crawlet - endnu ikke indekseret" var 8 allerede omskrevet, og mindst 2 blev crawlet EFTER omskrivningen og stadig
// valgt fra. Ca. 330 artikler er stadig skrevet efter den gamle opskrift (uden kildeliste, ofte tynde). Med noindex
// ser Google kun de nye; læserne kan stadig læse alt.
//
// Automatisk: når robotten omskriver en artikel (recipe: 3), forsvinder noindex ved næste byg, og artiklen kommer i
// sitemap og video-sitemap igen. Ingen liste at vedligeholde.
// Undtaget: artikler Google allerede har VIST i søgeresultaterne (src/data/omskriv-prioritet.json, "slugs") - de giver
// sitets visninger og skal ikke risikeres. Shorts har deres egen noindex.
//
// Bruges ét sted pr. opgave, så de aldrig kan blive uenige: artikelsiden (noindex-tag), sitemap-filteret
// (astro.config.mjs) og video-sitemappet (src/pages/video-sitemap.xml.ts).
import fs from 'node:fs';
import path from 'node:path';

// Projektmappen (process.cwd()), ikke modulets egen sti: Astro flytter modulet under bygget, og en forkert sti ville
// give en tom liste - så fik også de Google-viste artikler noindex. Mangler filen, STOPPER bygget i stedet.
const PRIO = path.join(process.cwd(), 'src/data/omskriv-prioritet.json');
let vist = null;
function vistAfGoogle() {
  if (!vist) {
    const slugs = JSON.parse(fs.readFileSync(PRIO, 'utf8')).slugs;
    if (!Array.isArray(slugs) || !slugs.length) throw new Error(`noindex-gamle: ingen Google-viste artikler i ${PRIO}`);
    vist = new Set(slugs);
  }
  return vist;
}

// fm = artiklens frontmatter, slug = filnavnet uden .md. true = siden skal have noindex og ud af sitemaps.
export function venterPaaOmskrivning(fm, slug) {
  if (!fm || fm.isShort === true) return false;          // Shorts styres for sig
  if (Number(fm.recipe) === 3) return false;              // ny opskrift = må indekseres
  return !vistAfGoogle().has(slug);                       // gammel opskrift og aldrig vist af Google
}

// Læser frontmatter-felterne direkte fra en .md-fil (til astro.config.mjs, der ikke har collections)
export function venterPaaOmskrivningFil(fil) {
  const raw = fs.readFileSync(fil, 'utf8');
  const fm = { isShort: /^isShort:\s*true/m.test(raw), recipe: raw.match(/^recipe:\s*(\d+)/m)?.[1] };
  return venterPaaOmskrivning(fm, path.basename(fil).replace(/\.md$/, ''));
}
