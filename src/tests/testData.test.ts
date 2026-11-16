import { describe, expect, it } from 'vitest';
import { fieldExpression, generateTestData, type FieldSpec, type TestDataOptions } from '@/utils/testData';

const fields: FieldSpec[] = [
  { name: 'Name', type: 'String', value: 'Test Account', unique: true },
  { name: 'NumberOfEmployees', type: 'Integer', value: '50' },
  { name: 'AnnualRevenue', type: 'Decimal', value: '125000.50' },
  { name: 'Active__c', type: 'Boolean', value: 'TRUE' },
  { name: 'Industry', type: 'Picklist', value: 'Technology' },
];
const base: TestDataOptions = { objectName: 'Account', fields, count: 5, mode: 'factory', doInsert: true };

describe('fieldExpression', () => {
  const ex = (type: FieldSpec['type'], value: string, unique = false, i: string | null = 'i') =>
    fieldExpression({ name: 'F__c', type, value, unique }, i).expr;

  it('formats every field type', () => {
    expect(ex('String', "O'Brien")).toBe("'O\\'Brien'");
    expect(ex('String', 'Acme', true)).toBe("'Acme ' + i");
    expect(ex('String', 'Acme', true, null)).toBe("'Acme'");
    expect(ex('Integer', '-12')).toBe('-12');
    expect(ex('Decimal', '9.99')).toBe('9.99');
    expect(ex('Boolean', 'False')).toBe('false');
    expect(ex('Date', '2026-02-28')).toBe('Date.newInstance(2026, 2, 28)');
    expect(ex('Date', '')).toBe('Date.today()');
    expect(ex('Date', 'today+30')).toBe('Date.today().addDays(30)');
    expect(ex('Date', 'today - 7')).toBe('Date.today().addDays(-7)');
    expect(ex('DateTime', '2026-03-01 09:30')).toBe('DateTime.newInstance(2026, 3, 1, 9, 30, 0)');
    expect(ex('DateTime', '2026-03-01T09:30:15')).toBe('DateTime.newInstance(2026, 3, 1, 9, 30, 15)');
    expect(ex('DateTime', 'now')).toBe('DateTime.now()');
    expect(ex('Email', 'qa@example.com', true)).toBe("'qa' + i + '@example.com'");
    expect(ex('Email', '')).toBe("'test.user@example.com'");
    expect(ex('Phone', '+1 415 555 0100')).toBe("'+1 415 555 0100'");
    expect(ex('Picklist', 'Hot')).toBe("'Hot'");
    expect(ex('Lookup ID', 'parentAccount.Id')).toBe('parentAccount.Id');
    expect(ex('Lookup ID', 'accounts[0].Id')).toBe('accounts[0].Id');
    expect(ex('Lookup ID', '001A0000006Vm9rIAC')).toBe("'001A0000006Vm9rIAC'");
  });

  it.each([
    ['Integer', '1.5', /whole number/],
    ['Integer', '99999999999', /range of an Apex Integer/],
    ['Decimal', 'abc', /needs a number/],
    ['Boolean', 'yes', /true or false/],
    ['Date', '2026-02-30', /YYYY-MM-DD/],
    ['Date', '02/03/2026', /YYYY-MM-DD/],
    ['DateTime', '2026-01-01 25:00', /YYYY-MM-DD HH:MM/],
    ['Email', 'not-an-email', /email address/],
    ['Picklist', '', /Enter a sample value/],
    ['Lookup ID', '', /record ID or an Apex variable/],
    ['Lookup ID', "x'; delete y;", /record ID, or an Apex variable/],
  ] as [FieldSpec['type'], string, RegExp][])('rejects %s value %j', (type, value, pattern) => {
    expect(() => fieldExpression({ name: 'F__c', type, value }, 'i')).toThrow(pattern);
  });
});

describe('generateTestData', () => {
  it('generates a reusable factory class', () => {
    const { code, fileName } = generateTestData(base);
    expect(fileName).toBe('AccountTestDataFactory.cls');
    expect(code).toContain('@IsTest\npublic class AccountTestDataFactory {');
    expect(code).toContain('public static List<Account> createAccounts(Integer count, Boolean doInsert) {');
    expect(code).toContain('for (Integer i = 0; i < count; i++) {');
    expect(code).toContain("Name = 'Test Account ' + i,");
    expect(code).toContain('Active__c = true,');
    expect(code).toContain("Industry = 'Technology'\n");
    expect(code).toContain('insert accounts;');
    expect(code).toContain('return accounts;');
    expect(code.split('{').length).toBe(code.split('}').length);
    expect(code.split('(').length).toBe(code.split(')').length);
  });

  it('generates a @TestSetup test class', () => {
    const { code, fileName } = generateTestData({ ...base, mode: 'testSetup', count: 3 });
    expect(fileName).toBe('AccountTest.cls');
    expect(code).toContain('@TestSetup\n    static void setupTestData() {');
    expect(code).toContain('for (Integer i = 0; i < 3; i++) {');
    expect(code).toContain("Assert.areEqual(3, accounts.size(), 'Expected 3 Account records from test setup.');");
  });

  it('generates a single record or a list as a snippet', () => {
    const one = generateTestData({ ...base, mode: 'snippet', count: 1 }).code;
    expect(one).toContain('Account accountRecord = new Account(');
    expect(one).toContain("Name = 'Test Account',");
    expect(one).toContain('insert accountRecord;');
    const many = generateTestData({ ...base, mode: 'snippet', count: 20, doInsert: false }).code;
    expect(many).toContain('List<Account> accounts = new List<Account>();');
    expect(many).not.toContain('insert ');
  });

  it('names things sensibly for custom and namespaced objects', () => {
    const custom = generateTestData({ ...base, objectName: 'Delivery_Company__c' });
    expect(custom.code).toContain('public class DeliveryCompanyTestDataFactory {');
    expect(custom.code).toContain('List<Delivery_Company__c> deliveryCompanies = new List<Delivery_Company__c>();');
    expect(custom.code).toContain('createDeliveryCompanies(');
    expect(generateTestData({ ...base, objectName: 'ns__Invoice__c' }).fileName).toBe('InvoiceTestDataFactory.cls');
    expect(generateTestData({ ...base, objectName: 'Case' }).code).toContain('List<Case> cases');
  });

  it('warns about lookups', () => {
    const { warnings } = generateTestData({
      ...base,
      objectName: 'Contact',
      fields: [
        { name: 'LastName', type: 'String', value: 'Doe' },
        { name: 'AccountId', type: 'Lookup ID', value: 'parentAccount.Id' },
      ],
    });
    expect(warnings[0]).toMatch(/Make sure that variable exists/);
  });

  it('validates the configuration', () => {
    expect(() => generateTestData({ ...base, objectName: '' })).toThrow(/Enter the API name/);
    expect(() => generateTestData({ ...base, objectName: 'My Object' })).toThrow(/object API name/);
    expect(() => generateTestData({ ...base, fields: [] })).toThrow(/Add at least one field/);
    expect(() => generateTestData({ ...base, fields: [{ name: 'Bad Name', type: 'String', value: 'x' }] })).toThrow(/not a valid field API name/);
    expect(() => generateTestData({ ...base, fields: [fields[0], { ...fields[0], name: 'name' }] })).toThrow(/more than once/);
    expect(() => generateTestData({ ...base, count: 0 })).toThrow(/between 1 and 10,000/);
  });
});
