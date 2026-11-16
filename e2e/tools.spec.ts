import { expect, test } from '@playwright/test';
import { open } from './helpers';

test.describe('JSON to Apex', () => {
  test('generates classes, reports bad JSON, downloads a .cls file', async ({ page }) => {
    await open(page, '/tools/json-to-apex');
    const input = page.getByRole('textbox', { name: 'JSON input' });
    const output = page.getByRole('region', { name: 'Apex output', exact: true });
    await expect(output).toContainText('public class OrderResponse {');

    await input.fill('{"invoice": {"id": 12, "lines": [{"sku": "A", "qty": 2}], "class": "gold"}}');
    await page.getByLabel('Root class name', { exact: true }).fill('InvoiceEnvelope');
    await page.getByRole('button', { name: 'Generate Apex' }).click();
    await expect(output).toContainText('public class InvoiceEnvelope {');
    await expect(output).toContainText('public List<Line> lines;');
    await expect(output).toContainText('public String class_x;');
    await expect(page.getByRole('status').filter({ hasText: 'renamed to valid Apex identifiers' })).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), output.getByRole('button', { name: 'Download' }).click()]);
    expect(download.suggestedFilename()).toBe('InvoiceEnvelope.cls');

    await input.fill('{"a": 1,}');
    await page.getByRole('button', { name: 'Generate Apex' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid JSON input');
    await expect(page.getByRole('alert')).toContainText('line 1, column 9');
  });

  test('Ctrl+Enter runs the tool from the editor', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard shortcut');
    await open(page, '/tools/json-to-apex');
    const input = page.getByRole('textbox', { name: 'JSON input' });
    await input.fill('{"shortcut": true}');
    await input.press('Control+Enter');
    await expect(page.getByRole('region', { name: 'Apex output', exact: true })).toContainText('public Boolean shortcut;');
  });
});

test.describe('SOQL formatter', () => {
  test('formats, minifies and copies', async ({ page, context, browserName }) => {
    await open(page, '/tools/soql-formatter');
    await page.getByRole('textbox', { name: 'SOQL input' }).fill("select Id, (select Id from Contacts) from Account where Name like 'A%' and Id in :ids");
    await page.getByRole('button', { name: 'Format query' }).click();
    const pre = page.getByRole('region', { name: 'Formatted query', exact: true }).locator('pre');
    await expect(pre).toHaveText(
      ['SELECT', '  Id,', '  (', '    SELECT Id', '    FROM Contacts', '  )', 'FROM Account', "WHERE Name LIKE 'A%'", '  AND Id IN :ids'].join('\n'),
    );

    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.getByRole('region', { name: 'Formatted query', exact: true }).getByRole('button', { name: 'Copy' }).click();
      await expect(page.getByText('Copied to clipboard')).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('FROM Account');
    }

    await page.getByRole('button', { name: 'Minify' }).click();
    await expect(page.getByRole('region', { name: 'Minified query', exact: true }).locator('pre')).toHaveText(
      "SELECT Id, (SELECT Id FROM Contacts) FROM Account WHERE Name LIKE 'A%' AND Id IN :ids",
    );

    await page.getByRole('textbox', { name: 'SOQL input' }).fill('select Id from Account where (Name = 1');
    await page.getByRole('button', { name: 'Format query' }).click();
    await expect(page.getByRole('alert')).toContainText('never closed');
  });
});

test.describe('Salesforce ID converter', () => {
  test('converts one ID and a batch', async ({ page }) => {
    await open(page, '/tools/salesforce-id-converter');
    const input = page.getByRole('textbox', { name: /Salesforce IDs/ });
    await input.fill('a0B5g00000XyZaB');
    await expect(page.getByTestId('id18')).toHaveText('a0B5g00000XyZaBEAV');

    await input.fill('001A0000006Vm9r\n0015g00000ABCDE\nbad-id\n001A0000006VM9RIAC');
    await expect(page.getByText('3 of 4 converted')).toBeVisible();
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(5);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download CSV' }).click()]);
    expect(download.suggestedFilename()).toBe('salesforce-ids.csv');

    await input.fill('12345');
    await expect(page.getByRole('alert')).toContainText('Please enter a valid 15-character or 18-character Salesforce ID.');
  });
});

test.describe('package.xml builder', () => {
  test('builds, validates and downloads package.xml', async ({ page }) => {
    await open(page, '/tools/package-xml-builder');
    const output = page.getByRole('region', { name: 'package.xml', exact: true });
    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect(output).toContainText('Select a preset or a metadata type');

    await page.getByLabel('Search metadata types', { exact: true }).fill('validation');
    await page.getByRole('button', { name: /ValidationRule/ }).click();
    await page.getByLabel('Member names for ValidationRule', { exact: true }).fill('Account.Require_Industry');
    await page.getByRole('button', { name: 'Add member to ValidationRule' }).click();
    await page.getByLabel('API version', { exact: true }).fill('61.0');
    await expect(output).toContainText('<members>Account.Require_Industry</members>');
    await expect(output).toContainText('<version>61.0</version>');

    const [download] = await Promise.all([page.waitForEvent('download'), output.getByRole('button', { name: 'Download' }).click()]);
    expect(download.suggestedFilename()).toBe('package.xml');

    await page.getByLabel('API version', { exact: true }).fill('sixty');
    await expect(page.getByRole('alert')).toContainText('must look like 62.0');
  });
});

test.describe('Apex test data generator', () => {
  test('generates each kind of output', async ({ page }) => {
    await open(page, '/tools/apex-test-data-generator');
    const output = page.getByRole('region', { name: 'Apex test data', exact: true });
    await page.getByRole('button', { name: 'Opportunity', exact: true }).click();
    await expect(output).toContainText('public class OpportunityTestDataFactory {');
    await expect(output).toContainText('CloseDate = Date.today().addDays(30)');

    await page.getByText('@TestSetup class', { exact: true }).click();
    await expect(output).toContainText('static void setupTestData() {');

    await page.getByText('Snippet', { exact: true }).click();
    await page.getByLabel('Records', { exact: true }).fill('1');
    await expect(output).toContainText('Opportunity opportunityRecord = new Opportunity(');

    await page.getByLabel('Object API name', { exact: true }).fill('Not Valid!');
    await expect(page.getByRole('alert')).toContainText('object API name');
  });
});
