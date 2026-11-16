import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { HeadContext, renderHead, type SeoData } from './components/common/Seo';
import { site } from './data/site';
import { ROUTES } from './routes';

/** Every real page. Used to prerender static HTML and to write sitemap.xml. */
export const paths = ROUTES.filter((r) => r.path !== '*').map((r) => r.path);
export const siteUrl = site.url;

export async function render(url: string): Promise<{ html: string; head: string; noindex: boolean }> {
  await Promise.all(ROUTES.map((r) => r.preload()));
  const sink: { current: SeoData | null } = { current: null };
  const html = renderToString(
    <HeadContext.Provider value={sink}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HeadContext.Provider>,
  );
  if (!sink.current) throw new Error(`No <Seo> rendered for ${url}`);
  return { html, head: renderHead(sink.current), noindex: !!sink.current.noindex };
}
