import type { APIRoute } from 'astro';
import { execSync } from 'node:child_process';

// /build.json — hvilken version af koden kører lige nu på det levende site?
//
// Hvorfor: indtil nu kunne vi kun se, at et push var GÅET IGENNEM på GitHub,
// ikke at Cloudflare faktisk havde bygget og lagt det ud. Filen her skrives ved
// hvert build med commit-hash og tidspunkt, så enhver (også Claude fra skyen,
// der ikke kan nå GitHub) kan sammenligne det levende site med det seneste push.
//
// Cloudflare Pages giver hashen i CF_PAGES_COMMIT_SHA. Lokalt og i GitHub
// Actions spørger vi git. Fejler begge, skrives null — filen må ALDRIG
// vælte buildet.
function git(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch {
    return null;
  }
}

export const GET: APIRoute = () => {
  const paaCloudflare = Boolean(process.env.CF_PAGES_COMMIT_SHA);
  const commit = process.env.CF_PAGES_COMMIT_SHA || git('git rev-parse HEAD');
  const branch = process.env.CF_PAGES_BRANCH || git('git rev-parse --abbrev-ref HEAD');

  const data = {
    schema: 1,
    commit,
    commitShort: commit ? commit.slice(0, 8) : null,
    branch,
    builtAt: new Date().toISOString(),
    builtBy: paaCloudflare ? 'cloudflare-pages' : 'local',
  };

  return new Response(JSON.stringify(data, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
