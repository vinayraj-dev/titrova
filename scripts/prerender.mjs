/**
 * Build step 3 of 3 (see "build" in package.json).
 *
 * Renders every route to static HTML so that search engines and link previews receive real content,
 * a unique <title>, description, canonical URL and structured data for each page — without a server.
 * The same React code then hydrates in the browser.
 *
 * Output layout matches Cloudflare Pages' clean URLs: /tools/soql-formatter is served from
 * dist/tools/soql-formatter.html with no trailing-slash redirect. dist/404.html is served
 * (with a 404 status) for anything else.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--app-head-->') || !template.includes('<div id="root"><!--app-html--></div>')) {
  throw new Error('index.html is missing the <!--app-head--> or <!--app-html--> placeholder.');
}

const { render, paths, siteUrl } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

// Preload the two text fonts so headings and body text paint in their final face sooner.
const fontLinks = fs
  .readdirSync(path.join(dist, 'assets'))
  .filter((f) => /^(bricolage|instrument-sans)-.*\.woff2$/.test(f))
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`)
  .join('\n    ');

const written = [];
for (const route of [...paths, '/404']) {
  const { html, head } = await render(route);
  const page = template
    .replace('<!--app-head-->', () => `${fontLinks}\n    ${head}`)
    .replace('<div id="root"><!--app-html--></div>', () => `<div id="root" data-page="${route}">${html}</div>`);
  const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page);
  written.push(file);
}

// Standalone tools that live in public/ (outside the React app). Their source files are written for
// https://titrovatools.com; the build swaps in the configured site address so they always match.
const STATIC_PAGES = ['/org-xray/'];
for (const p of STATIC_PAGES) {
  const file = path.join(dist, p, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Static page missing: ${file}`);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('https://titrovatools.com', siteUrl));
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((p) => `  <url><loc>${siteUrl}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`),
  ...STATIC_PAGES.map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`Prerendered ${written.length} pages, sitemap.xml and robots.txt for ${siteUrl}`);
