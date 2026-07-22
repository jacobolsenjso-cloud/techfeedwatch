import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.join(__dirname, 'src/content/videos');

// Bygger et sæt af Short-slugs (isShort: true), så deres noindex'ede /video/{slug}-URL'er
// kan udelukkes fra XML-sitemappet. Læses direkte fra frontmatter, da sitemap-integrationen
// kun ser den færdige URL, ikke video-collectionens data.
const shortSlugs = new Set(
  fs.readdirSync(videosDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => /isShort:\s*true/.test(fs.readFileSync(path.join(videosDir, file), 'utf-8')))
    .map((file) => file.replace(/\.md$/, ''))
);

export default defineConfig({
  site: 'https://techfeedwatch.com',
  integrations: [
    sitemap({
      filter: (page) => {
        const match = new URL(page).pathname.match(/^\/video\/([^/]+)\/?$/);
        return match ? !shortSlugs.has(match[1]) : true;
      },
    }),
  ],
});