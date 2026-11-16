import type { ToolContent } from '@/data/content';
import type { FieldSpec } from '@/utils/testData';

export interface ObjectPreset {
  label: string;
  objectName: string;
  fields: FieldSpec[];
}

export const OBJECT_PRESETS: ObjectPreset[] = [
  {
    label: 'Account',
    objectName: 'Account',
    fields: [
      { name: 'Name', type: 'String', value: 'Test Account', unique: true },
      { name: 'Industry', type: 'Picklist', value: 'Technology' },
      { name: 'AnnualRevenue', type: 'Decimal', value: '250000' },
      { name: 'NumberOfEmployees', type: 'Integer', value: '50' },
      { name: 'Phone', type: 'Phone', value: '+1 415 555 0100' },
    ],
  },
  {
    label: 'Contact',
    objectName: 'Contact',
    fields: [
      { name: 'FirstName', type: 'String', value: 'Test' },
      { name: 'LastName', type: 'String', value: 'Contact', unique: true },
      { name: 'Email', type: 'Email', value: 'test.contact@example.com', unique: true },
      { name: 'AccountId', type: 'Lookup ID', value: 'parentAccount.Id' },
    ],
  },
  {
    label: 'Opportunity',
    objectName: 'Opportunity',
    fields: [
      { name: 'Name', type: 'String', value: 'Test Opportunity', unique: true },
      { name: 'StageName', type: 'Picklist', value: 'Prospecting' },
      { name: 'CloseDate', type: 'Date', value: 'today+30' },
      { name: 'Amount', type: 'Decimal', value: '15000' },
      { name: 'AccountId', type: 'Lookup ID', value: 'parentAccount.Id' },
    ],
  },
  {
    label: 'Lead',
    objectName: 'Lead',
    fields: [
      { name: 'LastName', type: 'String', value: 'Lead', unique: true },
      { name: 'Company', type: 'String', value: 'Test Company' },
      { name: 'Email', type: 'Email', value: 'test.lead@example.com', unique: true },
      { name: 'Status', type: 'Picklist', value: 'Open - Not Contacted' },
    ],
  },
  {
    label: 'Case',
    objectName: 'Case',
    fields: [
      { name: 'Subject', type: 'String', value: 'Test Case', unique: true },
      { name: 'Status', type: 'Picklist', value: 'New' },
      { name: 'Origin', type: 'Picklist', value: 'Web' },
      { name: 'Priority', type: 'Picklist', value: 'Medium' },
    ],
  },
  {
    label: 'Custom object',
    objectName: 'Invoice__c',
    fields: [
      { name: 'Name', type: 'String', value: 'INV', unique: true },
      { name: 'Amount__c', type: 'Decimal', value: '199.99' },
      { name: 'Due_Date__c', type: 'Date', value: 'today+14' },
      { name: 'Paid__c', type: 'Boolean', value: 'false' },
      { name: 'Sent_At__c', type: 'DateTime', value: 'now' },
    ],
  },
];

export const VALUE_HINTS: Record<FieldSpec['type'], string> = {
  String: 'Sample text',
  Integer: 'Whole number, such as 10',
  Decimal: 'Number, such as 99.50',
  Boolean: 'true or false',
  Date: 'YYYY-MM-DD, today or today+30',
  DateTime: 'YYYY-MM-DD HH:MM or now',
  Email: 'name@example.com',
  Phone: '+1 415 555 0100',
  Picklist: 'A picklist value',
  'Lookup ID': 'parentAccount.Id or a record ID',
};

export const content: ToolContent = {
  steps: [
    'Enter the object’s API name, such as `Account` or `Invoice__c`, or pick one of the presets.',
    'Add a row for each field: its API name, its type and a sample value. Mark text and email fields as unique to add the loop counter.',
    'Choose the number of records and the kind of code: a factory class, a `@TestSetup` test class or an inline snippet.',
    'Copy the Apex or download it, then adjust it for your org’s required fields and validation rules.',
  ],
  features: [
    'Three outputs: a reusable test data factory, a test class with `@TestSetup`, or a snippet to paste into an existing method.',
    'Ten field types, each written as the correct Apex literal or constructor, such as `Date.newInstance(2026, 2, 28)`.',
    'Relative dates: `today`, `today+30`, `today-7` and `now` become `Date.today().addDays(…)` and `DateTime.now()`.',
    'Unique values: the loop index is appended to text and inserted into email addresses.',
    'Bulk-friendly code: records are built in a list and inserted with one DML statement.',
    'Input checks for API names, numbers, dates, emails and lookups, with a specific message for each problem.',
  ],
  limitations: [
    'It does not know your org. Required fields, validation rules, duplicate rules, record types and triggers may need extra values.',
    'Lookup fields need a parent record. Reference a variable such as `parentAccount.Id` and create that record in your test.',
    'Picklist values are not checked against your org’s picklists.',
    'The `@TestSetup` output uses the `Assert` class, available from API version 56.0. On older versions, replace it with `System.assertEquals`.',
    'It writes test data, not test logic. The assertions for your own code are still yours to write.',
  ],
  article: [
    { h: 'Why tests need their own data' },
    { p: 'Apex tests run in isolation from the records in your org unless you opt out with `SeeAllData=true`, which is discouraged. Each test class therefore builds the accounts, contacts or custom records it needs. Typing `new Account(Name = …)` again and again is tedious, and scattered copies all break together when someone adds a required field.' },
    { h: 'Three ways to organise test data' },
    { h3: 'Test data factory' },
    { p: 'An `@IsTest` class with static methods such as `createAccounts(Integer count, Boolean doInsert)`. Every test class calls it. When the data model changes, you update one method. This is the most reusable option and the default output here.' },
    { h3: '@TestSetup method' },
    { p: 'A method that runs once before the test methods in a class. The records it inserts are visible to each test method, and each test starts from that same state. Use it when several tests in one class need the same records.' },
    { h3: 'Inline snippet' },
    { p: 'A list and a loop, or a single record, to paste into a method you already have. Handy for a quick test or for Anonymous Apex in a scratch org.' },
    { h: 'Example output' },
    { code: "@IsTest\npublic class ContactTestDataFactory {\n    public static List<Contact> createContacts(Integer count, Boolean doInsert) {\n        List<Contact> contacts = new List<Contact>();\n        for (Integer i = 0; i < count; i++) {\n            contacts.add(new Contact(\n                LastName = 'Contact ' + i,\n                Email = 'test.contact' + i + '@example.com'\n            ));\n        }\n        if (doInsert) {\n            insert contacts;\n        }\n        return contacts;\n    }\n}", lang: 'apex' },
    { h: 'How each field type is written' },
    { ul: [
      'String, Phone, Picklist and Email become quoted text with quotes and backslashes escaped.',
      'Integer and Decimal are written as plain numbers after checking they are valid.',
      'Boolean becomes `true` or `false`.',
      'Date becomes `Date.newInstance(year, month, day)` or an expression based on `Date.today()`.',
      'DateTime becomes `DateTime.newInstance(year, month, day, hour, minute, second)` or `DateTime.now()`.',
      'Lookup ID becomes a reference to an Apex variable, or a quoted ID if you enter one (with a warning, because IDs differ between orgs).',
    ] },
    { h: 'Adjusting the code for your org' },
    { p: 'Treat the output as a first draft. Run it, read the first error, and add what your org insists on: a required custom field, a record type, a value that satisfies a validation rule. Because the factory is one method, you only make each fix once.' },
  ],
  faqs: [
    { q: 'Will the generated code run in my org as is?', a: 'For standard objects with no extra required fields or validation rules, usually yes. Most orgs have customisations, so expect to add a field or two. The generator cannot see your org’s rules.' },
    { q: 'How do I use the factory in a test?', a: 'Call it from a test method or a `@TestSetup` method, for example `List<Account> accounts = AccountTestDataFactory.createAccounts(200, true);`. Pass `false` to get records you can change before inserting them.' },
    { q: 'Why add the loop index to names and emails?', a: 'Duplicate rules, unique fields and matching rules can reject identical records. A different value per record avoids that and makes failures easier to trace.' },
    { q: 'How should I fill a lookup field?', a: 'Create the parent record first and reference it, for example `AccountId = parentAccount.Id`. Do not paste a real record ID: it will not exist in other orgs or in a fresh scratch org.' },
    { q: 'How many records should a test create?', a: 'Create at least 200 in one of your tests. Triggers process records in batches of up to 200, and code that works for one record can fail at that size.' },
    { q: 'Is anything I enter stored or uploaded?', a: 'No. The code is generated in your browser from what you type. Object and field names never leave your device.' },
  ],
};
