import { createContext, useContext, useEffect } from 'react';
import { isSingleFile, site } from '@/data/site';

export interface SeoData {
  title: string;
  description: string;
  /** Path beginning with "/". Used for the canonical URL. */
  path: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown>[];
  noindex?: boolean;
}

/** During prerendering, the page's <Seo> writes into this sink so the build can emit real <head> tags. */
export const HeadContext = createContext<{ current: SeoData | null } | null>(null);

export const fullTitle = (title: string) => (title.includes(site.name) ? title : `${title} | ${site.name}`);
export const absoluteUrl = (path: string) => site.url + (path === '/' ? '/' : path);

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Static <head> markup for one page. Used by scripts/prerender.mjs. */
export function renderHead(d: SeoData): string {
  const title = fullTitle(d.title);
  const url = absoluteUrl(d.path);
  const image = `${site.url}/og-image.png`;
  const tags = [
    `<title>${escAttr(title)}</title>`,
    `<meta name="description" content="${escAttr(d.description)}" />`,
    d.noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${escAttr(url)}" />`,
    `<meta property="og:site_name" content="${escAttr(site.name)}" />`,
    `<meta property="og:type" content="${d.type ?? 'website'}" />`,
    `<meta property="og:title" content="${escAttr(title)}" />`,
    `<meta property="og:description" content="${escAttr(d.description)}" />`,
    `<meta property="og:url" content="${escAttr(url)}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escAttr(title)}" />`,
    `<meta name="twitter:description" content="${escAttr(d.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    ...(d.jsonLd ?? []).map(
      (obj) => `<script type="application/ld+json" data-seo>${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`,
    ),
  ];
  return tags.join('\n    ');
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

export function Seo(props: SeoData) {
  const sink = useContext(HeadContext);
  if (sink) sink.current = props;

  const ld = JSON.stringify(props.jsonLd ?? []);
  useEffect(() => {
    const title = fullTitle(props.title);
    document.title = title;
    if (isSingleFile) return;
    const url = absoluteUrl(props.path);
    upsertMeta('meta[name="description"]', { name: 'description', content: props.description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: props.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: props.description });
    if (!props.noindex) upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: url });
    document.head.querySelectorAll('script[data-seo]').forEach((n) => n.remove());
    for (const obj of JSON.parse(ld) as unknown[]) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-seo', '');
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    }
  }, [props.title, props.description, props.path, props.noindex, ld]);

  return null;
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
