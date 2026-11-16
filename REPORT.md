# Completion report — Titrova v1.1

Updated 16 November 2026. Renamed from the working title "Apex Utility Lab"; see "The name" in the README.

## 1. Features implemented

- **14 working tools** in two families and six categories:
  - Salesforce: JSON to Apex, SOQL Formatter, Salesforce ID Converter, Package.xml Builder,
    Apex Test Data Generator, cURL to Apex Callout Converter.
  - Developer: JSON Formatter & Validator, JWT Decoder, Regex Tester, Base64 Encoder & Decoder,
    SQL Formatter, XML Formatter & Validator, URL Encoder & Decoder, Unix Timestamp Converter.
- **34 prerendered pages:** home, tool dashboard, 6 category pages, 14 tool pages, guides index and
  5 guides, About, Contact, Privacy Policy, Terms, Disclaimer, and a 404 page.
- **Every tool page** opens with a working example and has plain-language errors, copy and download,
  how-to steps, a written guide, features and limitations, related tools and FAQs.
- **Tool dashboard:** a sticky category sidebar on desktop and swipeable category chips on phones,
  live search, Salesforce/Developer filter, Popular/Newest/A–Z sort, emoji badges, automatic "New"
  stickers, and a "Missing a tool?" tile that fills any empty grid slot.
- **SEO:** unique title, description and canonical URL per page, Open Graph and Twitter tags, social image,
  JSON-LD (WebSite, BreadcrumbList, WebApplication, TechArticle), generated sitemap.xml and robots.txt.
- **Design and motion:** light and dark themes, live hero demo using the real tool code, reactive dot field,
  tilt-and-spotlight cards, scroll reveals, page transitions, a circular theme switch, wiggling stickers.
  All motion is switched off for visitors who prefer reduced motion.
- **Legal pages:** numbered clauses, effective date, key points, collapsible contents on phones,
  print or save as PDF, cookie and third-party tables, rights under GDPR, CCPA and India's DPDP Act 2023.
- **Privacy:** no accounts, no backend, no analytics by default; tool input is never stored or uploaded.
- **Advertising:** four placements, off by default, switched on with environment variables.
- **Installable:** web manifest with PNG and maskable icons, Apple touch icon.

## 2. Tools tested

Every tool has unit tests for its logic and browser tests for its page. Highlights:

| Tool | Checked against |
| --- | --- |
| JSON to Apex | Nested objects, arrays, nulls, reserved words, name collisions, top-level arrays, a 20,000-row payload |
| SOQL Formatter | Every clause type, subqueries, aggregates, TYPEOF, bind variables, token-for-token meaning preservation |
| Salesforce ID Converter | Hand-verified checksums, casing repair, invalid input, 50,000 IDs |
| Package.xml Builder | Exact XML output, browser XML parsing, escaping, wildcards, API version rules |
| Apex Test Data Generator | All field types, relative dates, unique values, all three output modes |
| cURL to Apex | Bash quoting, all common curl options, Named Credentials, mock and test generation |
| JSON Formatter | Exact big-number preservation, duplicate keys, sorted keys, Apex string escaping |
| JWT Decoder | The published jwt.io token and secret, HS512 tokens made independently with Node's crypto, malformed tokens |
| Regex Tester | Groups, zero-length matches, replacement, Apex conversion, and a deliberately catastrophic pattern stopped in a real browser |
| Base64 | UTF-8, URL-safe, binary data, invalid input, values compared with Node's Buffer |
| SQL Formatter | Several dialects and error reporting |
| XML Formatter | Ten kinds of well-formedness error with line and column |
| URL Encoder | Three modes, Apex `EncodingUtil.urlEncode` parity, malformed sequences, URL breakdown |
| Timestamp Converter | Seconds to nanoseconds, ISO with offsets, HTTP dates, impossible dates, SOQL and Apex outputs |

## 3. Remaining limitations

- Not deployed yet (see section 5).
- The tools never connect to Salesforce, so input is not checked against a real org.
- JWT Decoder verifies HMAC signatures only; RS256/ES256 are decoded but not verified.
- Regex Tester runs JavaScript regular expressions; Java (Apex) differences are flagged, not emulated.
- AI tools are not built, by design (paid API and privacy); they remain on the roadmap.
- Domain and trademark availability for "Titrova" could not be checked from here.
- Legal pages are a careful draft, not reviewed by a lawyer. Governing law is set to India.
- Firefox and Safari were not available in this environment.

## 4. Build and test results

| Check | Result |
| --- | --- |
| TypeScript, strict mode | No errors |
| Unit and component tests (Vitest) | 147 passed, 0 failed |
| Browser tests, desktop Chrome | 48 passed, 1 skipped by design (phone-only) |
| Browser tests, phone (Pixel 7 profile) | 47 passed, 2 skipped by design (keyboard-only) |
| Accessibility (axe-core, WCAG 2.1 AA): 20 page types × light and dark × desktop and phone | 80 of 80 clean |
| Every page | Unique title and description, one main heading, prerendered content, no hydration mismatch, no console errors, no sideways scrolling |
| Lighthouse, desktop (dashboard, tool pages) | Performance 99–100; Accessibility, Best Practices, SEO 100 |
| Lighthouse, phone (dashboard, tool pages) | Performance 91–97; Accessibility, Best Practices, SEO 100 |
| Lighthouse, phone (home page with animated hero) | Performance 73–88 between runs; Accessibility, Best Practices, SEO 100 |
| Production build | 34 pages prerendered; shared JavaScript about 75 kB gzip; each tool loads only its own code |

## 5. Deployment status

**Not deployed.** It needs your GitHub and Cloudflare accounts. The production build was served and
tested locally.

## 6. Steps you need to do

1. Create an empty GitHub repository named `titrova`, and either push the code yourself (README) or
   give me a 1-day fine-grained token for that repository only.
2. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → `titrova`.
   Build command `npm run build`, output `dist`, variable `NODE_VERSION` = `22`.
3. Set `VITE_SITE_URL` to your Cloudflare address, add `VITE_CONTACT_EMAIL`, and redeploy.
4. Verify the site in Google Search Console and submit `sitemap.xml`.
5. Check domain and trademark availability for "Titrova".
6. Review the Privacy Policy, Terms and Disclaimer.

## 7. Adding future tools

Logic in `src/utils/`, an entry in `src/data/tools.ts`, a page folder in `src/pages/tools/<slug>/`, and one
line in `src/routes.tsx`. Menus, dashboard, search, sitemap and "New" stickers update automatically.

## 8. Turning on advertising

See "Turning on advertising" in the README: add `public/ads.txt`, create four ad units, set up Google's
consent message, then set `VITE_ADS_ENABLED=true`, `VITE_ADSENSE_CLIENT` and the slot variables, and redeploy.
