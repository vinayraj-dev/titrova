# Titrova

Free, browser-only tools for Salesforce developers. Five tools, written guides, and the legal pages an
ad-supported site needs. No backend, no database, no paid services.

> Titrova is an independent developer utility platform and is not affiliated with or endorsed by Salesforce, Inc.

**Salesforce tools**

| Tool | URL |
| --- | --- |
| 🩻 Org X-ray: Order of Execution Visualizer | `/org-xray/` (standalone page in `public/org-xray/`) |
| 🧩 JSON to Apex Class Generator | `/tools/json-to-apex` |
| ✨ SOQL Formatter | `/tools/soql-formatter` |
| 🪪 Salesforce ID Converter | `/tools/salesforce-id-converter` |
| 📦 Package.xml Builder | `/tools/package-xml-builder` |
| 🧪 Apex Test Data Generator | `/tools/apex-test-data-generator` |
| 📡 cURL to Apex Callout Converter | `/tools/curl-to-apex` |

**Developer tools** (each with Salesforce extras, such as Apex output)

| Tool | URL |
| --- | --- |
| 🧾 JSON Formatter & Validator | `/tools/json-formatter` |
| 🔑 JWT Decoder | `/tools/jwt-decoder` |
| 🎯 Regex Tester | `/tools/regex-tester` |
| 🔤 Base64 Encoder & Decoder | `/tools/base64-encoder-decoder` |
| 🗄️ SQL Formatter | `/tools/sql-formatter` |
| 🏷️ XML Formatter & Validator | `/tools/xml-formatter` |
| 🔗 URL Encoder & Decoder | `/tools/url-encoder-decoder` |
| ⏱️ Unix Timestamp Converter | `/tools/timestamp-converter` |

Six category pages (`/apex-utilities`, `/soql-utilities`, `/salesforce-admin-utilities`, `/api-utilities`,
`/encoding-utilities`, `/developer-utilities`), a tool dashboard at `/tools`, five guides, and the About,
Contact and legal pages: 34 prerendered pages in total.

## The name

*Titrova* comes from titration: adding one solution to another, drop by drop, until it changes colour.
The tools do the same with your input, and the palette runs from iodine amber to copper teal. The brand
deliberately avoids Salesforce trademarks such as "Apex" or "Salesforce".

**Check availability before you register anything.** Nobody can promise a name is unused without checking:

1. Domains: search `titrova.com`, `titrova.dev` and `titrova.app` at any registrar (Cloudflare Registrar sells at cost).
2. Trademarks: search "Titrova" in the WIPO Global Brand Database, the Indian Trade Marks Registry (ipindia.gov.in)
   and USPTO, especially in classes 9 and 42 (software and online services).
3. Handles: `github.com/titrova`, npm, and the social networks you plan to use.

To use a different name later, change `name` in `src/data/site.ts`, the `name`/`short_name` in
`public/manifest.webmanifest`, the fallback `<title>` in `vite.config.ts`, and replace `public/og-image.png`
(1200 × 630). Everything else reads the name from `site.ts`.

## Quick start

Requires Node 20 or newer (22 recommended; see `.nvmrc`).

```bash
npm ci               # install
npm run dev          # develop at http://localhost:5173
npm test             # unit + component tests (Vitest)
npm run build        # type-check, build, prerender every page into dist/
npm run preview      # serve dist/ at http://localhost:4173
npm run test:e2e     # end-to-end and accessibility tests against the build (Playwright + axe-core)
```

First time running the end-to-end tests: `npx playwright install chromium`.

## How it is built

- **React 18 + TypeScript + Vite + Tailwind CSS**, React Router for routing, Lucide for icons.
- **Every page is prerendered to static HTML** at build time (`scripts/prerender.mjs`). Search engines and
  link previews get real content, a unique title, description, canonical URL, Open Graph tags and JSON-LD
  per page; the same React code then hydrates in the browser. This matters because the site depends on
  search traffic to individual tool pages, and a plain single-page app would ship an empty `<div>`.
- **Business logic is separate from the UI.** Each tool's algorithm lives in `src/utils/` as plain,
  tested TypeScript with no React in it.
- **No backend.** Everything a tool does happens in the visitor's browser.

### Decisions worth knowing about

| Decision | Why |
| --- | --- |
| Lightweight editor instead of Monaco | Monaco adds several megabytes for features these tools do not need. The editor here is a real `<textarea>` over a highlighted `<pre>`: native keyboard, undo, screen-reader and mobile behaviour, a few kilobytes. |
| No Prettier | Prettier has no SOQL parser and its Apex plugin needs a Java/WASM parser that would dominate the bundle. The SOQL formatter is purpose-built and verifies its own output. |
| `sql-formatter` library for SQL | General SQL has many dialects; a mature open-source formatter (MIT) is safer than a hand-written one. It is loaded only on the SQL Formatter page (34 kB gzip). |
| Regex runs in a Web Worker | A pattern with catastrophic backtracking would otherwise freeze the tab. The worker is stopped after 1.5 s and the user is told why. |
| No AI tools yet | AI features would need a paid API and would send visitors' code to a third party, breaking the privacy promise. They stay on the roadmap until they can run fully in the browser. |
| Own JSON parser (`src/utils/jsonParser.ts`) | `JSON.parse` cannot tell `1` from `1.0` (Integer vs Decimal in Apex) and gives poor error positions. |
| No animation library | All motion is CSS plus a few small hooks, and it is switched off for visitors who prefer reduced motion. |
| Self-hosted fonts | No third-party requests, in keeping with the privacy promise. Bricolage Grotesque, Instrument Sans and JetBrains Mono are under the SIL Open Font License. |
| FAQ structured data omitted | Google only shows FAQ rich results for a small set of government and health sites, so marking them up would not be "eligible and accurate". Breadcrumb, WebSite, WebApplication and TechArticle data are included. |

## Project structure

```
src/
  utils/            tool algorithms (pure TypeScript, unit-tested)
  data/             site config, tool registry, guides, metadata catalogue, FAQs
  components/
    common/         editor, panes, buttons, SEO, reveal, FAQ, content blocks
    layout/         header, footer, page shell
    navigation/     breadcrumbs, search palette
    tools/          tool page frame and tool cards
    home/           hero demo, dot field, data-path diagram
    ads/            AdSlot (off by default)
  pages/            one file per page; tools/<slug>/ holds each tool's UI and its documentation
  hooks/  styles/  assets/fonts/  tests/
  routes.tsx        the route table (also drives prerendering and the sitemap)
  main.tsx          browser entry        entry-server.tsx   prerender entry
scripts/prerender.mjs   writes dist/**/*.html, sitemap.xml, robots.txt
e2e/                    Playwright tests
public/                 favicons, app icons, social image, web manifest, Cloudflare _headers
```

`sitemap.xml` and `robots.txt` are generated into `dist/` on every build from the route table and
`VITE_SITE_URL`, so they can never drift out of date.

## Configuration

Copy `.env.example` to `.env` for local use, or set these in Cloudflare Pages
(Settings → Environment variables). They are read at build time, so redeploy after changing one.

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_SITE_URL` | Public URL, no trailing slash. Used in canonical links, Open Graph, sitemap and robots.txt. **Set this to your real address.** | `https://titrova.pages.dev` |
| `VITE_CONTACT_EMAIL` | Shown on the Contact page. Empty shows GitHub links only. | empty |
| `VITE_REPO_URL` | Repository used for "report a bug" links. | `https://github.com/vinayraj-dev/titrova` |
| `VITE_AUTHOR_NAME` | Maintainer name on About and guides. Set to an empty value to hide it. | `Kappa Vinay` |
| `VITE_ADS_ENABLED`, `VITE_ADSENSE_CLIENT`, `VITE_AD_SLOT_*` | Advertising, see below. | off |
| `VITE_CF_ANALYTICS_TOKEN` | Optional Cloudflare Web Analytics (cookieless). Empty loads no analytics. | empty |

## Deploying to Cloudflare Pages (free)

1. **Put the code on GitHub.**
   ```bash
   git init && git add . && git commit -m "Titrova v1"
   git branch -M main
   git remote add origin https://github.com/<your-username>/titrova.git
   git push -u origin main
   ```
2. **Create the Pages project.** Cloudflare dashboard → Workers & Pages → Create → Pages →
   Connect to Git → choose the repository.
3. **Build settings.**
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. **Deploy**, then note the address Cloudflare gives you (for example `https://titrova.pages.dev`;
   it will differ if that name is taken).
5. **Set `VITE_SITE_URL`** to that exact address (plus `VITE_CONTACT_EMAIL` if you want one), then
   Deployments → Retry deployment. Until you do this, canonical links and the sitemap point at the default address.
6. **Check it.** Open `/tools/json-to-apex` directly, view source and confirm the title, canonical link and
   content are in the HTML. Open `/sitemap.xml` and `/robots.txt`. Open a made-up address and confirm the 404 page.

Routing: every page exists as a static file (`dist/tools/soql-formatter.html` is served at
`/tools/soql-formatter`), and `dist/404.html` is served with a 404 status for anything else, so no
`_redirects` fallback is needed. Every later push to `main` redeploys automatically.

### Custom domain (later)

Pages project → Custom domains → Set up a domain, and follow the DNS instructions. Then change
`VITE_SITE_URL` to the new domain and redeploy. Check trademark and domain availability for the name first.

### Google Search Console

1. Add a property for your site address (URL-prefix type).
2. Choose the **HTML file** verification method, download the file, put it in `public/`, commit and push.
3. After the deploy, press Verify.
4. Sitemaps → submit `sitemap.xml`.

## Standalone tools (Org X-ray)

`public/org-xray/` is a self-contained page (HTML, font, zip reader and share image) outside the React app.
Its source uses `https://titrovatools.com`; `scripts/prerender.mjs` swaps in `VITE_SITE_URL` at build time and
adds it to `sitemap.xml`. In `src/data/tools.ts` it has `staticPage: true`, so menus, cards and search link to
it with a full page load. To add another standalone tool, put it in `public/<slug>/`, add its path to
`STATIC_PAGES` in `scripts/prerender.mjs`, and register it in `TOOLS` with `staticPage: true` and its path.

## Adding a tool

1. **Logic:** add `src/utils/<name>.ts` with pure functions that throw `ToolError` for user-facing
   problems, and tests in `src/tests/<name>.test.ts`.
2. **Registry:** add an entry to `TOOLS` in `src/data/tools.ts`: slug, name, `short` label, `emoji`,
   `family` (`salesforce` or `developer`), tagline, description (120–160 characters), SEO title, categories,
   icon, from/to labels, `added` date (YYYY-MM-DD) and keywords. Tools with the newest `added` date get a
   "New" sticker automatically. The order of the list is the "Popular" order on the dashboard.
3. **Page:** create `src/pages/tools/<slug>/` with a page component wrapped in `<ToolShell>` and a
   `content.ts` (steps, features, limitations, article, FAQs). Copy an existing tool as a starting point.
4. **Route:** add one line to `TOOL_PAGES` in `src/routes.tsx`.

Navigation, search, category pages, related tools, the sitemap and prerendering pick it up automatically.
Optionally add a guide to `src/data/guides.ts` with `toolSlug` set to the new tool.

## Turning on advertising (after AdSense approval)

Ads are off by default: no ad script loads and no placeholder is rendered. The four placements already
exist (`header`, `sidebar`, `content`, `footer`) through `<AdSlot>`; none sits over a tool's input or output.

1. Apply to AdSense with the live site. During review you may be asked to add a snippet or an `ads.txt` file.
2. Create `public/ads.txt` containing `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
3. In AdSense, create one display ad unit per placement and note each slot id.
4. In AdSense → Privacy & messaging, create the European regulations (GDPR) consent message. Google
   requires a certified consent platform for visitors in the EEA, UK and Switzerland; this is the free one.
5. Set the environment variables and redeploy:
   ```
   VITE_ADS_ENABLED=true
   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   VITE_AD_SLOT_HEADER=...   VITE_AD_SLOT_SIDEBAR=...
   VITE_AD_SLOT_CONTENT=...  VITE_AD_SLOT_FOOTER=...
   ```
   A placement without a slot id stays hidden. The privacy policy switches to its advertising wording
   automatically when ads are enabled; update the "last updated" date in `src/data/site.ts`.

## Maintenance notes

- **Metadata types:** `src/data/metadataTypes.ts` is a curated list, not full Metadata API coverage. Add rows as needed.
- **Default API version** for the package.xml builder: `DEFAULT_VERSION` in `PackageXmlPage.tsx`. Raise it once or twice a year.
- **Apex reserved words:** `src/utils/apex.ts`.
- **Key prefixes:** `src/data/keyPrefixes.ts`.
- **Legal pages** are a careful starting point, not legal advice. Have them reviewed. The Terms name India as the
  governing law; change clause 14 in `src/pages/Terms.tsx` if that is wrong for you. When you change a legal page,
  update `legalUpdated` and `legalUpdatedIso` in `src/data/site.ts` (the effective date shown on all three).
- **Keywords:** validate search demand in Search Console or a keyword tool before writing more content.
  Nothing in this project claims search volumes.

## Known limitations

- The tools never connect to a Salesforce org, so they cannot check input against a real schema.
- JSON to Apex infers types from one sample; `null` and empty arrays become `Object`.
- The SOQL formatter does not support SOSL or complex Apex expressions after `:`.
- The first visit to a page downloads that page's script; there is no offline service worker.
- On slow phones the animated home page hero costs some main-thread time (Lighthouse mobile 73–88 for the home page;
  94–100 for every other page tested). Everything animated is skipped for visitors who prefer reduced motion.
- The on-screen ID table shows the first 300 rows (copy and download include all rows).
- The JWT Decoder verifies HMAC signatures (HS256/384/512) only; RS256 and ES256 tokens are decoded but not verified.
- The Regex Tester uses the JavaScript engine; Apex uses Java's. Differences are flagged, not emulated.
- The XML Formatter checks well-formedness, not schema validity.
