import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

const PAGES = [
  '/', '/tools', '/apex-utilities', '/soql-utilities', '/salesforce-admin-utilities', '/developer-utilities',
  '/tools/json-to-apex', '/tools/soql-formatter', '/tools/salesforce-id-converter', '/tools/package-xml-builder', '/tools/apex-test-data-generator',
  '/guides', '/guides/json-to-apex-wrapper-classes', '/about', '/contact', '/privacy-policy', '/terms', '/disclaimer',
  '/api-utilities', '/encoding-utilities', '/tools/curl-to-apex', '/tools/json-formatter', '/tools/jwt-decoder', '/tools/regex-tester',
  '/tools/base64-encoder-decoder', '/tools/sql-formatter', '/tools/xml-formatter', '/tools/url-encoder-decoder', '/tools/timestamp-converter',
];

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test.describe('every page', () => {
  for (const path of PAGES) {
    test(`${path} loads cleanly and fits the screen`, async ({ page }) => {
      const errors = watchConsole(page);
      await open(page, path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(errors, errors.join('\n')).toEqual([]);

      // No sideways scrolling at any size.
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      // Every form control has an accessible name.
      const unnamed = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('input, select, textarea, button')]
          .filter((el) => !el.closest('[aria-hidden="true"]'))
          .filter((el) => {
            const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent?.trim() || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label');
            return !labelled;
          })
          .map((el) => el.outerHTML.slice(0, 120)),
      );
      expect(unnamed, unnamed.join('\n')).toEqual([]);
    });
  }

  test('unknown addresses show the not-found page', async ({ page }) => {
    await open(page, '/this-page-does-not-exist');
    await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible();
  });
});

test.describe('search engines and no-JavaScript visitors', () => {
  test.use({ javaScriptEnabled: false });

  test('tool pages are prerendered with their own title, description, content and result', async ({ page }) => {
    await page.goto('/tools/json-to-apex');
    await expect(page).toHaveTitle(/JSON to Apex Class Generator/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Convert JSON to Apex wrapper classes/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/tools\/json-to-apex$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('JSON to Apex Class Generator');
    await expect(page.getByText('public class OrderResponse {')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why Salesforce developers need wrapper classes' })).toBeVisible();
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
  });

  test('sitemap and robots.txt are served', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/tools/soql-formatter</loc>');
    expect(sitemap.match(/<url>/g)!.length).toBeGreaterThanOrEqual(33);
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: ');
  });
});

test.describe('navigation and theme', () => {
  test('home → tool via a card, then breadcrumb back', async ({ page }) => {
    await open(page, '/');
    await page.getByRole('link', { name: /SOQL Formatter Format a SOQL query/ }).first().click();
    await expect(page).toHaveURL(/\/tools\/soql-formatter$/);
    await expect(page.getByRole('heading', { level: 1, name: 'SOQL Formatter' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Tools' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'All tools' })).toBeVisible();
  });

  test('search palette opens with the keyboard and navigates', async ({ page, isMobile }) => {
    await open(page, '/');
    if (isMobile) await page.getByRole('button', { name: 'Search tools' }).first().click();
    else await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').fill('package');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Package.xml Builder' })).toBeVisible();
  });

  test('mobile menu opens and navigates', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button only exists on small screens');
    await open(page, '/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Guides' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Guides and tutorials' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toHaveCount(0);
  });

  test('theme choice survives a reload', async ({ page }) => {
    await open(page, '/about');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.getByRole('button', { name: /light and dark theme/ }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('skip link moves focus to the content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard-only flow');
    await open(page, '/tools');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });
});
