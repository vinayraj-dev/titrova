import { expect, test } from '@playwright/test';
import { open } from './helpers';

const out = (page: import('@playwright/test').Page, name: string) => page.getByRole('region', { name, exact: true });

test('JSON formatter validates, formats and builds an Apex string', async ({ page }) => {
  await open(page, '/tools/json-formatter');
  await expect(out(page, 'Formatted JSON')).toContainText('"externalId": 9007199254740993');
  await page.getByRole('textbox', { name: 'JSON input' }).fill('{"a": 1,}');
  await expect(page.getByRole('alert')).toContainText('line 1, column 9');
  await page.getByRole('textbox', { name: 'JSON input' }).fill(`{"msg":"it's"}`);
  await page.getByText('Apex string', { exact: true }).click();
  await expect(out(page, 'Formatted JSON')).toContainText(`String jsonBody = '{"msg":"it\\'s"}';`);
});

test('JWT decoder decodes and verifies the signature', async ({ page }) => {
  await open(page, '/tools/jwt-decoder');
  await expect(out(page, 'Payload')).toContainText('"name": "John Doe"');
  await expect(page.getByRole('table')).toContainText('2018-01-18T01:30:22Z');
  await page.getByLabel('Secret for HS256').fill('wrong');
  await page.getByRole('button', { name: 'Verify signature' }).click();
  await expect(page.getByText('Invalid signature.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Use the sample secret' }).click();
  await page.getByRole('button', { name: 'Verify signature' }).click();
  await expect(page.getByText('Signature verified.', { exact: false })).toBeVisible();
});

test('Regex tester highlights matches and stops runaway patterns', async ({ page }) => {
  await open(page, '/tools/regex-tester');
  await page.getByLabel('Regular expression').fill('\\d+');
  await page.getByRole('textbox', { name: 'Test text' }).fill('a1 b22 c333');
  await expect(out(page, 'Matches')).toContainText('3 matches');
  await expect(out(page, 'Apex code')).toContainText("Pattern.compile('\\\\d+')");
  await page.getByLabel('Regular expression').fill('^(a+)+$');
  await page.getByRole('textbox', { name: 'Test text' }).fill('a'.repeat(34) + '!');
  await expect(page.getByRole('alert')).toContainText('took longer than', { timeout: 8000 });
  await page.getByLabel('Regular expression').fill('a');
  await expect(out(page, 'Matches')).toContainText('34 matches');
});

test('cURL to Apex builds callouts with a Named Credential', async ({ page }) => {
  await open(page, '/tools/curl-to-apex');
  const apex = out(page, 'Apex callout');
  await expect(apex).toContainText("req.setEndpoint('https://api.example.com/v1/orders');");
  await page.getByLabel('Named Credential (optional)').fill('Orders_API');
  await expect(apex).toContainText("req.setEndpoint('callout:Orders_API/v1/orders');");
  await expect(apex).toContainText('implements HttpCalloutMock');
  await page.getByRole('textbox', { name: 'cURL command' }).fill('wget https://a.io');
  await expect(page.getByRole('alert')).toContainText('starts with “curl”');
});

test('Base64, URL, SQL, XML and timestamp tools work end to end', async ({ page }) => {
  await open(page, '/tools/base64-encoder-decoder');
  await page.getByRole('textbox', { name: 'Text to encode' }).fill('Héllo ✓');
  await expect(out(page, 'Base64')).toContainText('SMOpbGxvIOKckw==');
  await page.getByText('Decode', { exact: true }).click();
  await expect(out(page, 'Decoded text')).toContainText('Héllo ✓');

  await open(page, '/tools/url-encoder-decoder');
  await expect(page.getByRole('region', { name: 'URL breakdown' })).toContainText('batch');
  await expect(out(page, 'Decoded')).toContainText("Name = 'Acme & Sons'");

  await open(page, '/tools/sql-formatter');
  await expect(out(page, 'Formatted SQL')).toContainText('LEFT JOIN order_lines');
  await page.getByRole('textbox', { name: 'SQL input' }).fill('select (a from t');
  await expect(page.getByRole('alert')).toContainText('Line 1');

  await open(page, '/tools/xml-formatter');
  await page.getByRole('textbox', { name: 'XML input' }).fill('<a>\n<b>\n</a>');
  await expect(page.getByRole('alert')).toContainText('line 3');

  await open(page, '/tools/timestamp-converter');
  await expect(page.getByText('2026-11-15T10:00:00Z', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/^Local time \(/)).toBeVisible();
  await page.getByRole('button', { name: 'Now', exact: true }).click();
  await expect(page.getByText('Relative to now')).toBeVisible();
  await expect(page.getByText('now', { exact: true })).toBeVisible();
});

test('dashboard filters, sorts and links to categories', async ({ page, isMobile }) => {
  await open(page, '/tools');
  await expect(page.getByText('Showing 14 of 14')).toBeVisible();
  await page.getByLabel('Filter tools').fill('token');
  await expect(page.getByRole('link', { name: /JWT Decoder/ }).first()).toBeVisible();
  await page.getByLabel('Filter tools').fill('');
  await page.getByText('⚡ Salesforce', { exact: true }).click();
  await expect(page.getByText('Showing 6 of 14')).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Tool categories' }).locator('visible=true');
  await nav.getByRole('link', { name: /Encoding/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Encoding & Security Utilities' })).toBeVisible();
  await expect(page.getByText('3 tools in this category')).toBeVisible();
  if (!isMobile) await expect(nav.getByRole('link', { name: /Encoding/ })).toHaveAttribute('aria-current', 'page');
});
