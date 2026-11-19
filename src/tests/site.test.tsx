import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { HeadContext, fullTitle, type SeoData } from '@/components/common/Seo';
import { TOOLS } from '@/data/tools';
import { ROUTES } from '@/routes';

const paths = ROUTES.filter((r) => r.path !== '*').map((r) => r.path);

async function serverRender(path: string) {
  await Promise.all(ROUTES.map((r) => r.preload()));
  const sink: { current: SeoData | null } = { current: null };
  const html = renderToString(
    <HeadContext.Provider value={sink}>
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    </HeadContext.Provider>,
  );
  return { html, seo: sink.current! };
}

describe('every page', () => {
  afterEach(() => vi.restoreAllMocks());

  it('covers the pages required by the specification', () => {
    for (const required of [
      '/', '/tools', '/apex-utilities', '/soql-utilities', '/salesforce-admin-utilities', '/developer-utilities', '/guides',
      '/about', '/contact', '/privacy-policy', '/terms', '/disclaimer',
      '/tools/json-to-apex', '/tools/soql-formatter', '/tools/salesforce-id-converter', '/tools/package-xml-builder', '/tools/apex-test-data-generator',
    ])
      expect(paths).toContain(required);
  });

  it('prerenders with a unique title and description, one h1 and real content', async () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const path of paths) {
      const { html, seo } = await serverRender(path);
      expect(seo, path).toBeTruthy();
      expect(seo.path, path).toBe(path);
      const title = fullTitle(seo.title);
      expect(title.length, `${path} title`).toBeGreaterThan(15);
      expect(seo.description.length, `${path} description: ${seo.description.length}`).toBeGreaterThanOrEqual(70);
      expect(seo.description.length, `${path} description: ${seo.description.length}`).toBeLessThanOrEqual(160);
      titles.add(title);
      descriptions.add(seo.description);
      expect(html.match(/<h1[\s>]/g), `${path} h1 count`).toHaveLength(1);
      expect(html.length, `${path} content`).toBeGreaterThan(4000);
      expect(html, path).toContain('not affiliated with or endorsed by Salesforce, Inc.');
      expect(html, `${path} must not ship ad markup while ads are disabled`).not.toContain('adsbygoogle');
    }
    expect(titles.size).toBe(paths.length);
    expect(descriptions.size).toBe(paths.length);
  });

  it('renders tool output on the server so the tool is visible before JavaScript loads', async () => {
    expect((await serverRender('/tools/json-to-apex')).html).toContain('OrderResponse');
    expect((await serverRender('/tools/salesforce-id-converter')).html).toContain('IAC');
    expect((await serverRender('/tools/package-xml-builder')).html).toContain('&lt;Package');
    expect((await serverRender('/tools/apex-test-data-generator')).html).toContain('AccountTestDataFactory');
    expect((await serverRender('/tools/soql-formatter')).html).toContain('FROM');
  });

  it('gives every tool page documentation, limitations, related tools and FAQs', async () => {
    for (const tool of TOOLS.filter((t) => !t.staticPage)) {
      const { html } = await serverRender(tool.path);
      for (const heading of ['How to use', 'Features and limitations', 'What it does not do', 'Related tools', 'Questions about'])
        expect(html, `${tool.slug}: ${heading}`).toContain(heading);
      expect(html).toContain('aria-label="Breadcrumb"');
    }
  });

  it('hydrates without a mismatch', async () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => void errors.push(args.map(String).join(' ')));
    for (const path of paths) {
      const { html } = await serverRender(path);
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      let root: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(
          container,
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>,
        );
      });
      await act(async () => root.unmount());
      container.remove();
      const mismatch = errors.filter((e) => /hydrat|did not match|does not match/i.test(e));
      expect(mismatch, `${path}\n${mismatch.join('\n')}`).toHaveLength(0);
    }
  });

  it('serves a not-found page for unknown addresses', async () => {
    const { html, seo } = await serverRender('/definitely-not-a-page');
    expect(html).toContain('This page does not exist');
    expect(seo.noindex).toBe(true);
  });
});
