import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { open } from './helpers';

const PAGES = [
  '/', '/tools', '/apex-utilities', '/tools/json-to-apex', '/tools/soql-formatter', '/tools/salesforce-id-converter',
  '/tools/package-xml-builder', '/tools/apex-test-data-generator', '/guides', '/guides/salesforce-15-vs-18-character-ids',
  '/about', '/contact', '/privacy-policy', '/not-a-real-page', '/tools/jwt-decoder', '/tools/regex-tester',
  '/tools/timestamp-converter', '/tools/base64-encoder-decoder', '/tools/curl-to-apex', '/encoding-utilities',
];

/** Automated WCAG 2.1 AA checks (axe-core) on every kind of page, in both themes. */
for (const theme of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${theme} theme`, () => {
    test.use({ reducedMotion: 'reduce' });
    for (const path of PAGES) {
      test(path, async ({ page }) => {
        if (theme === 'dark') await page.addInitScript(() => localStorage.setItem('titrova-theme', 'dark'));
        await open(page, path);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(150);
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const report = violations.map(
          (v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.slice(0, 4).map((n) => `   ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1] ?? ''}`).join('\n')}`,
        );
        expect(report, report.join('\n')).toEqual([]);
      });
    }
  });
}
