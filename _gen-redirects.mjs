import fs from 'fs';

const dir = './src/content/videos';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

const lines = [];
let count = 0;
for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const content = fs.readFileSync(`${dir}/${f}`, 'utf-8');
  const m = content.match(/youtubeId:\s*["']?([A-Za-z0-9_-]{6,})["']?/);
  if (!m) continue;
  const id = m[1];
  // Kun redirect hvis den gamle URL (video-ID) adskiller sig fra den nye titel-slug
  if (id === slug) continue;
  lines.push(`/video/${id} /video/${slug}/ 301`);
  count++;
}

const header = `# Auto-genererede 301-redirects: gamle /video/{video-ID} -> nye titel-slugs.\n# Genereret ${new Date().toISOString().slice(0,10)}. Ret ikke i hånden - kør _gen-redirects.mjs.\n`;
fs.writeFileSync('./public/_redirects', header + lines.join('\n') + '\n');
console.log(`OK: skrev ${count} redirects til public/_redirects`);
