import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAt } from './render';

const output = (name: RegExp) => screen.getByRole('region', { name });

beforeEach(() => {
  document.documentElement.className = '';
  localStorage.clear();
});

describe('JSON to Apex page', () => {
  it('opens with a working example and regenerates on demand', async () => {
    await renderAt('/tools/json-to-apex');
    expect(screen.getByRole('heading', { level: 1, name: 'JSON to Apex Class Generator' })).toBeInTheDocument();
    expect(output(/Apex output/).textContent).toContain('public class OrderResponse {');

    fireEvent.change(screen.getByRole('textbox', { name: 'JSON input' }), { target: { value: '{"id": 7, "tags": ["a"]}' } });
    fireEvent.change(screen.getByLabelText('Root class name'), { target: { value: 'Thing' } });
    await userEvent.click(screen.getByRole('button', { name: /Generate Apex/ }));
    const text = output(/Apex output/).textContent!;
    expect(text).toContain('public class Thing {');
    expect(text).toContain('public List<String> tags;');
  });

  it('shows a helpful, announced error for invalid JSON and never a stack trace', async () => {
    await renderAt('/tools/json-to-apex');
    fireEvent.change(screen.getByRole('textbox', { name: 'JSON input' }), { target: { value: '{"a": 1,}' } });
    await userEvent.click(screen.getByRole('button', { name: /Generate Apex/ }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid JSON input');
    expect(alert).toHaveTextContent('Please check your brackets, quotation marks and commas.');
    expect(alert.textContent).not.toMatch(/at \w+ \(|Error:/);
    expect(screen.getByRole('textbox', { name: 'JSON input' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('asks for input when empty, and applies option switches', async () => {
    await renderAt('/tools/json-to-apex');
    await userEvent.click(screen.getByRole('button', { name: /Clear/ }));
    expect(output(/Apex output/).textContent).toContain('Paste JSON on the left');
    await userEvent.click(screen.getByRole('button', { name: /Generate Apex/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter some input before generating output.');

    await userEvent.click(screen.getByRole('button', { name: 'Simple object' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '@AuraEnabled' }));
    expect(output(/Apex output/).textContent).toContain('@AuraEnabled public Integer id;');
  });

  it('copies and downloads the generated class', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const createObjectURL = vi.fn(() => 'blob:test');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await renderAt('/tools/json-to-apex');
    const pane = output(/Apex output/);
    await user.click(within(pane).getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('public class OrderResponse {'));
    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument();

    await user.click(within(pane).getByRole('button', { name: 'Download' }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Downloaded OrderResponse.cls')).toBeInTheDocument();
    click.mockRestore();
  });
});

describe('SOQL formatter page', () => {
  it('formats, minifies and reports structural errors', async () => {
    await renderAt('/tools/soql-formatter');
    fireEvent.change(screen.getByRole('textbox', { name: 'SOQL input' }), { target: { value: 'select Id, Name from Account where Name != null' } });
    await userEvent.click(screen.getByRole('button', { name: /Format query/ }));
    expect(output(/Formatted query/).querySelector('pre')!.textContent).toBe('SELECT Id, Name\nFROM Account\nWHERE Name != null');

    await userEvent.click(screen.getByRole('button', { name: /Minify/ }));
    expect(output(/Minified query/).querySelector('pre')!.textContent).toBe('SELECT Id, Name FROM Account WHERE Name != null');

    fireEvent.change(screen.getByRole('textbox', { name: 'SOQL input' }), { target: { value: 'select Id from' } });
    await userEvent.click(screen.getByRole('button', { name: /Format query/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('FROM must be followed by an object name');
  });
});

describe('Salesforce ID converter page', () => {
  it('converts as you type, validates, and handles batches', async () => {
    await renderAt('/tools/salesforce-id-converter');
    expect(screen.getByTestId('id18')).toHaveTextContent('001A0000006Vm9rIAC');

    const input = screen.getByRole('textbox', { name: /Salesforce IDs/ });
    fireEvent.change(input, { target: { value: '0015g00000ABCDE' } });
    expect(screen.getByTestId('id18')).toHaveTextContent('0015g00000ABCDEAA5');
    expect(screen.getByText(/standard prefix for Account/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid 15-character or 18-character Salesforce ID.');

    fireEvent.change(input, { target: { value: '001A0000006Vm9r\nnope\n001A0000006VM9RIAC' } });
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText('Casing restored')).toBeInTheDocument();
    expect(within(table).getByText('Invalid')).toBeInTheDocument();
    expect(screen.getByText(/2 of 3 converted/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Clear/ }));
    expect(screen.getByText(/The converted ID appears here/)).toBeInTheDocument();
  });
});

describe('package.xml builder page', () => {
  it('builds XML from the selection and validates the API version', async () => {
    await renderAt('/tools/package-xml-builder');
    const xml = () => output(/^package\.xml$/).textContent!;
    expect(xml()).toContain('<name>ApexClass</name>');

    await userEvent.click(screen.getByRole('button', { name: /CustomField/ }));
    const members = screen.getByLabelText('Member names for CustomField');
    await userEvent.type(members, 'Account.Region__c, Invoice__c.Status__c{Enter}');
    expect(xml()).toContain('<members>Account.Region__c</members>');
    expect(xml()).toContain('<members>Invoice__c.Status__c</members>');
    expect(xml()).toContain('<name>CustomField</name>');

    fireEvent.change(screen.getByLabelText('API version'), { target: { value: '62' } });
    expect(screen.getByRole('alert')).toHaveTextContent('must look like 62.0');
    fireEvent.change(screen.getByLabelText('API version'), { target: { value: '62.0' } });
    expect(xml()).toContain('<version>62.0</version>');

    await userEvent.click(screen.getByRole('button', { name: /Clear selection/ }));
    expect(xml()).toContain('Select a preset or a metadata type');

    await userEvent.click(screen.getByRole('button', { name: 'Lightning UI' }));
    expect(xml()).toContain('<name>LightningComponentBundle</name>');
  });

  it('lets you add a metadata type that is not in the catalogue', async () => {
    await renderAt('/tools/package-xml-builder');
    await userEvent.type(screen.getByLabelText('Search metadata types'), 'BrandingSet');
    await userEvent.click(screen.getByRole('button', { name: /Add “BrandingSet” as a metadata type/ }));
    expect(output(/^package\.xml$/).textContent).toContain('<name>BrandingSet</name>');
  });
});

describe('Apex test data generator page', () => {
  it('generates code from the record definition in each mode', async () => {
    await renderAt('/tools/apex-test-data-generator');
    const code = () => output(/Apex test data/).textContent!;
    expect(code()).toContain('public class AccountTestDataFactory {');

    await userEvent.click(screen.getByRole('button', { name: 'Contact' }));
    expect(code()).toContain('createContacts(Integer count, Boolean doInsert)');
    expect(code()).toContain("Email = 'test.contact' + i + '@example.com'");

    await userEvent.click(screen.getByRole('radio', { name: '@TestSetup class' }));
    expect(code()).toContain('@TestSetup');

    fireEvent.change(screen.getByLabelText('Records'), { target: { value: '0' } });
    expect(screen.getByRole('alert')).toHaveTextContent('between 1 and 10,000');

    fireEvent.change(screen.getByLabelText('Records'), { target: { value: '200' } });
    await userEvent.click(screen.getByRole('button', { name: /Add field/ }));
    fireEvent.change(screen.getByLabelText('Field 5 API name'), { target: { value: 'Birthdate' } });
    fireEvent.change(screen.getByLabelText('Field 5 type'), { target: { value: 'Date' } });
    fireEvent.change(screen.getByLabelText('Field 5 sample value'), { target: { value: '1990-02-30' } });
    expect(screen.getByRole('alert')).toHaveTextContent('YYYY-MM-DD');
    fireEvent.change(screen.getByLabelText('Field 5 sample value'), { target: { value: '1990-02-28' } });
    expect(code()).toContain('Birthdate = Date.newInstance(1990, 2, 28)');
  });
});

describe('site chrome', () => {
  it('navigates between pages and marks the current one', async () => {
    await renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Free Salesforce Developer Tools' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    await userEvent.click(within(nav).getByRole('link', { name: 'Tools' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'All tools' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Tools' })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toContain('All Free Salesforce & Developer Tools');
  });

  it('filters the tool list', async () => {
    await renderAt('/tools');
    await userEvent.type(screen.getByLabelText('Filter tools'), 'deploy');
    expect(screen.getByText('Showing 1 of 15')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Filter tools'));
    await userEvent.type(screen.getByLabelText('Filter tools'), 'zzz');
    expect(screen.getByText('No tool matches that yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all tools' }));
    expect(screen.getByText('Showing 15 of 15')).toBeInTheDocument();
  });

  it('opens search with Ctrl+K, filters, and goes to the chosen tool with Enter', async () => {
    await renderAt('/');
    await userEvent.keyboard('{Control>}k{/Control}');
    const dialog = screen.getByRole('dialog', { name: /Search tools/ });
    await userEvent.type(within(dialog).getByRole('combobox'), 'soql');
    expect(within(dialog).getAllByRole('option')[0]).toHaveTextContent('SOQL Formatter');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'SOQL Formatter' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches theme and remembers only the theme name', async () => {
    await renderAt('/about');
    const toggle = screen.getByRole('button', { name: /light and dark theme/ });
    await userEvent.click(toggle);
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('titrova-theme')).toBe('dark');
    await userEvent.click(toggle);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(Object.keys(localStorage)).toEqual(['titrova-theme']);
  });

  it('never stores tool input in the browser', async () => {
    await renderAt('/tools/json-to-apex');
    fireEvent.change(screen.getByRole('textbox', { name: 'JSON input' }), { target: { value: '{"secret": "do-not-store"}' } });
    await userEvent.click(screen.getByRole('button', { name: /Generate Apex/ }));
    expect(JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })).not.toContain('secret');
    expect(document.cookie).toBe('');
  });

  it('opens and closes FAQ answers with correct ARIA state', async () => {
    await renderAt('/');
    const q = screen.getByRole('button', { name: 'Do I need to log in to Salesforce?' });
    expect(q).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(q);
    expect(q).toHaveAttribute('aria-expanded', 'true');
  });
});
