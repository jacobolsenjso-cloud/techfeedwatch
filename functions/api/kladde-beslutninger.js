// Offentlig LÆSNING af Jacobs beslutninger (19/11-2026, valg A: ingen ny GitHub-nøgle). kladder.mjs henter dem
// her hver time. Kun læsning - at gemme kræver Access-billetten (functions/api/godkend.js). Der står kun kladdens
// tilfældige id, version, handling og tidspunkt; Jacobs note er krypteret med KLADDE_NOEGLE, så intet om
// artiklen eller hans tekst kan læses her.
import { alleBeslutninger, svar } from './godkend.js';

export async function onRequestGet({ env }) {
  if (!env.GODKEND) return svar({ fejl: 'KV-bindingen GODKEND mangler' }, 500);
  return svar(Object.values(await alleBeslutninger(env)));
}
