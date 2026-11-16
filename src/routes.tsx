import { lazy, type ComponentType } from 'react';
import { GUIDES } from '@/data/guides';
import { CATEGORIES, TOOLS } from '@/data/tools';

type Loader = () => Promise<{ default: ComponentType<any> }>;

export interface PageDef {
  path: string;
  Component: ComponentType;
  /** Load the page's code ahead of rendering (used for prerendering and for flicker-free hydration). */
  preload: () => Promise<void>;
}

/**
 * Each page is its own chunk, loaded on demand. `preload` lets the server (and the first client render)
 * resolve the page up front so prerendered HTML and hydrated HTML match exactly.
 */
function page(path: string, loader: Loader, props: Record<string, unknown> = {}): PageDef {
  let Loaded: ComponentType<any> | null = null;
  const Lazy = lazy(loader);
  const Component = () => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  return {
    path,
    Component,
    preload: async () => {
      Loaded = (await loader()).default;
    },
  };
}

/**
 * To add a tool: create its page under src/pages/tools/<slug>/, add it to TOOLS in src/data/tools.ts,
 * and add one line here. The sitemap, navigation, search and related-tool links update themselves.
 */
const TOOL_PAGES: Record<string, Loader> = {
  'json-to-apex': () => import('@/pages/tools/json-to-apex/JsonToApexPage'),
  'soql-formatter': () => import('@/pages/tools/soql-formatter/SoqlFormatterPage'),
  'salesforce-id-converter': () => import('@/pages/tools/salesforce-id-converter/IdConverterPage'),
  'package-xml-builder': () => import('@/pages/tools/package-xml-builder/PackageXmlPage'),
  'apex-test-data-generator': () => import('@/pages/tools/apex-test-data-generator/TestDataPage'),
  'curl-to-apex': () => import('@/pages/tools/curl-to-apex/CurlToApexPage'),
  'json-formatter': () => import('@/pages/tools/json-formatter/JsonFormatterPage'),
  'jwt-decoder': () => import('@/pages/tools/jwt-decoder/JwtDecoderPage'),
  'regex-tester': () => import('@/pages/tools/regex-tester/RegexTesterPage'),
  'base64-encoder-decoder': () => import('@/pages/tools/base64-encoder-decoder/Base64Page'),
  'sql-formatter': () => import('@/pages/tools/sql-formatter/SqlFormatterPage'),
  'xml-formatter': () => import('@/pages/tools/xml-formatter/XmlFormatterPage'),
  'url-encoder-decoder': () => import('@/pages/tools/url-encoder-decoder/UrlCodecPage'),
  'timestamp-converter': () => import('@/pages/tools/timestamp-converter/TimestampPage'),
};

export const NOT_FOUND = page('*', () => import('@/pages/NotFound'));

export const ROUTES: PageDef[] = [
  page('/', () => import('@/pages/Home')),
  page('/tools', () => import('@/pages/Tools')),
  ...TOOLS.map((t) => page(t.path, TOOL_PAGES[t.slug])),
  ...CATEGORIES.map((c) => page(`/${c.slug}`, () => import('@/pages/Category'), { id: c.id })),
  page('/guides', () => import('@/pages/Guides')),
  ...GUIDES.map((g) => page(`/guides/${g.slug}`, () => import('@/pages/Guide'), { slug: g.slug })),
  page('/about', () => import('@/pages/About')),
  page('/contact', () => import('@/pages/Contact')),
  page('/privacy-policy', () => import('@/pages/Privacy')),
  page('/terms', () => import('@/pages/Terms')),
  page('/disclaimer', () => import('@/pages/Disclaimer')),
  NOT_FOUND,
];
