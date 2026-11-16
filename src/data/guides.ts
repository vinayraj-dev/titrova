import type { Block } from './content';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  updated: string;
  toolSlug: string;
  blocks: Block[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'json-to-apex-wrapper-classes',
    title: 'How to turn a JSON response into Apex wrapper classes',
    description:
      'A practical guide to deserializing JSON in Apex: wrapper classes, type choices, reserved words, null values and how to test your parser.',
    minutes: 6,
    updated: '2026-11-15',
    toolSlug: 'json-to-apex',
    blocks: [
      { p: 'Almost every Salesforce integration ends the same way: an HTTP callout returns a JSON string, and Apex needs to read values out of it. You can walk the payload with `JSON.deserializeUntyped` and a chain of casts, but typed wrapper classes are easier to read, easier to test and fail earlier when the payload changes.' },
      { h: 'What a wrapper class is' },
      { p: 'A wrapper class is a plain Apex class whose properties mirror the keys of a JSON object. `JSON.deserialize` creates an instance and fills each property whose name matches a key.' },
      { code: `public class OrderResponse {\n    public String orderId;\n    public Decimal total;\n    public List<Line> lines;\n\n    public class Line {\n        public String sku;\n        public Integer quantity;\n    }\n}\n\nOrderResponse res = (OrderResponse) JSON.deserialize(body, OrderResponse.class);`, lang: 'apex' },
      { p: 'Nested objects become inner classes and arrays become `List<T>`. Apex allows only one level of inner classes, so every generated class sits directly inside the root class, however deep the JSON goes.' },
      { h: 'Choosing the right types' },
      { ul: [
        'Text becomes `String`. Dates usually arrive as text too; keep them as `String` unless you are sure of the format, then convert with `Date.valueOf` or `DateTime.valueOfGmt`.',
        'Whole numbers become `Integer` when they fit in 32 bits and `Long` when they do not. Record counters and timestamps in milliseconds often need `Long`.',
        'Numbers with a decimal point become `Decimal`. Use it for money; `Double` invites rounding surprises.',
        '`true` and `false` become `Boolean`.',
        'A `null` in the sample tells you nothing about the type. Look at the API documentation and replace the generated `Object` with the real type.',
      ] },
      { h: 'Keys that are not valid Apex names' },
      { p: 'JSON keys can be anything. Apex identifiers cannot: they must start with a letter, may not contain hyphens or double underscores, and may not be reserved words such as `class`, `limit`, `date` or `new`.' },
      { p: 'Because `JSON.deserialize` matches by name, a property called `class_x` will never receive the value of a key called `class`. The usual fix is to rename the key in the JSON text just before deserializing:' },
      { code: `jsonString = jsonString.replaceAll('"class"\\\\s*:', '"class_x":');`, lang: 'apex' },
      { p: 'The pattern only matches a quoted name followed by a colon, which is how keys appear in JSON, so string values that happen to contain the same word are left alone.' },
      { h: 'Extra and missing keys' },
      { p: 'By default, `JSON.deserialize` ignores keys that have no matching property and leaves properties without a matching key as `null`. That is forgiving, and usually what you want for third-party APIs that add fields over time. If you need the opposite, `JSON.deserializeStrict` throws when the payload contains a key your class does not declare.' },
      { h: 'Test the parser with a real payload' },
      { p: 'Save a representative response as a string in your test class, parse it, and assert on a few values from different depths. A test like this fails loudly when someone renames a property.' },
      { code: `@IsTest\nstatic void parsesOrderResponse() {\n    String body = '{"orderId":"A-1","total":19.5,"lines":[{"sku":"X","quantity":2}]}';\n    OrderResponse res = OrderResponse.parse(body);\n    Assert.areEqual('A-1', res.orderId);\n    Assert.areEqual(2, res.lines[0].quantity);\n}`, lang: 'apex' },
      { note: 'A generator infers types from the one sample you give it. If a field is sometimes a number and sometimes text, or an array is empty in your sample, check the API documentation before you deploy.' },
    ],
  },
  {
    slug: 'salesforce-15-vs-18-character-ids',
    title: '15 vs 18 character Salesforce IDs, and how the conversion works',
    description:
      'Why Salesforce has two ID lengths, when you need the 18-character form, and a worked example of the checksum algorithm.',
    minutes: 5,
    updated: '2026-11-15',
    toolSlug: 'salesforce-id-converter',
    blocks: [
      { p: 'Every Salesforce record has one ID that can be written two ways. The 15-character form is case-sensitive: `001A0000006Vm9r` and `001a0000006vm9r` are different records. The 18-character form adds three characters that encode the casing, so it stays unique even in systems that ignore case.' },
      { h: 'When the difference matters' },
      { ul: [
        'Spreadsheets. `VLOOKUP` and `XLOOKUP` compare text without regard to case, so two different 15-character IDs can match each other.',
        'External databases and integration tools that use case-insensitive comparisons or collations.',
        'Reports and list views in Salesforce Classic, and some URLs, show 15 characters, while every API returns 18.',
        'Comparing IDs as text in Apex. An `Id` variable treats both forms as equal, but two `String` variables holding the two forms are not equal.',
      ] },
      { h: 'What is inside an ID' },
      { p: 'The first three characters are the key prefix, which identifies the object type: `001` is Account, `003` is Contact, `005` is User, `006` is Opportunity, `00Q` is Lead and `500` is Case. Custom objects get a prefix that is assigned per org. The rest identifies the Salesforce instance and the record itself.' },
      { h: 'The algorithm, step by step' },
      { ol: [
        'Split the 15 characters into three groups of five.',
        'In each group, write 1 for an uppercase letter and 0 for anything else.',
        'Read each group’s five bits from right to left as a binary number between 0 and 31.',
        'Look that number up in the 32-character alphabet `ABCDEFGHIJKLMNOPQRSTUVWXYZ012345`.',
        'Append the three resulting characters to the original ID.',
      ] },
      { p: 'Take `001A0000006Vm9r`. The groups are `001A0`, `00000` and `6Vm9r`.' },
      { code: `001A0  →  bits 0 0 0 1 0  →  reversed 01000  →  8  →  I\n00000  →  bits 0 0 0 0 0  →  reversed 00000  →  0  →  A\n6Vm9r  →  bits 0 1 0 0 0  →  reversed 00010  →  2  →  C\n\n001A0000006Vm9r  +  IAC  =  001A0000006Vm9rIAC`, lang: 'text' },
      { h: 'The suffix can repair lost casing' },
      { p: 'Because the last three characters record exactly which letters are uppercase, an 18-character ID that has been forced to upper or lower case can be restored. That is useful when a spreadsheet or a legacy system has flattened a column of IDs.' },
      { h: 'Doing it inside Salesforce' },
      { ul: [
        'In a formula field, `CASESAFEID(Id)` returns the 18-character form.',
        'In Apex, assigning a 15-character string to an `Id` variable and converting it back with `String.valueOf` gives 18 characters.',
        'Data Loader and the APIs always export 18 characters.',
      ] },
      { note: 'The checksum describes letter casing only. A well-formed ID is not proof that a record with that ID exists in any org.' },
    ],
  },
  {
    slug: 'soql-formatting-style-guide',
    title: 'A SOQL style guide: writing queries your team can review',
    description:
      'Conventions for readable SOQL: one clause per line, field lists, subqueries, bind variables and the clause order Salesforce expects.',
    minutes: 5,
    updated: '2026-11-15',
    toolSlug: 'soql-formatter',
    blocks: [
      { p: 'SOQL tends to be written once and read many times: in code review, in a debug log at the end of a long day, in a pull request diff. A few layout conventions make queries far easier to scan, and make changes show up as small, obvious diffs.' },
      { h: 'One clause per line' },
      { p: 'Start `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `ORDER BY` and `LIMIT` on their own lines. When someone adds a filter, the diff shows one new line rather than a changed 300-character string.' },
      { code: `SELECT Id, Name, Industry\nFROM Account\nWHERE Industry = 'Technology'\n  AND AnnualRevenue > 1000000\nORDER BY Name\nLIMIT 50`, lang: 'soql' },
      { h: 'Upper-case keywords, API-case names' },
      { p: 'SOQL is not case-sensitive, so this is purely for the reader. Upper-case keywords separate the structure of the query from field and object names, which should keep the exact casing of their API names.' },
      { h: 'Long field lists: one field per line' },
      { p: 'Once a query selects more than three or four fields, put each on its own line. Adding or removing a field then touches exactly one line, and merge conflicts become rare.' },
      { h: 'Indent subqueries' },
      { p: 'Child relationship subqueries in the field list and semi-joins in the `WHERE` clause are queries in their own right. Indent them so their clauses line up with each other, not with the parent’s.' },
      { code: `SELECT\n  Id,\n  Name,\n  (\n    SELECT Id, LastName\n    FROM Contacts\n    WHERE Email != null\n  )\nFROM Account\nWHERE Id IN (\n    SELECT AccountId\n    FROM Opportunity\n    WHERE IsWon = true\n  )`, lang: 'soql' },
      { h: 'Put AND and OR at the start of the line' },
      { p: 'Leading operators make the logic visible down the left edge. Keep parentheses around any group that mixes `AND` with `OR`; SOQL requires them, and they stop readers from guessing.' },
      { h: 'Use bind variables instead of building strings' },
      { p: 'In Apex, reference variables with a colon rather than concatenating values into the query text. It is shorter, it is type-safe, and it removes the risk of SOQL injection.' },
      { code: `List<Contact> contacts = [\n    SELECT Id, Email\n    FROM Contact\n    WHERE AccountId IN :accountIds\n      AND LastName = :lastName\n];`, lang: 'apex' },
      { h: 'The order Salesforce expects' },
      { p: 'Clauses must appear in a fixed order. The common ones are:' },
      { ol: ['`SELECT`', '`FROM`', '`USING SCOPE`', '`WHERE`', '`WITH`', '`GROUP BY`', '`HAVING`', '`ORDER BY`', '`LIMIT`', '`OFFSET`', '`FOR VIEW`, `FOR REFERENCE` or `FOR UPDATE`'] },
      { note: 'Formatting changes how a query looks, not how it runs. To check field names, relationships and selectivity you still need to run the query against an org.' },
    ],
  },
  {
    slug: 'package-xml-explained',
    title: 'package.xml explained: structure, wildcards and common mistakes',
    description:
      'How a Salesforce package.xml manifest is structured, which metadata types accept a wildcard, and the mistakes that cause retrieves to come back empty.',
    minutes: 6,
    updated: '2026-11-15',
    toolSlug: 'package-xml-builder',
    blocks: [
      { p: 'A `package.xml` file, often called a manifest, is a list. It tells the Metadata API which components to retrieve from an org or which components a deployment contains. It does not hold any metadata itself.' },
      { h: 'The structure' },
      { code: `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n    <types>\n        <members>AccountService</members>\n        <members>AccountServiceTest</members>\n        <name>ApexClass</name>\n    </types>\n    <types>\n        <members>*</members>\n        <name>LightningComponentBundle</name>\n    </types>\n    <version>62.0</version>\n</Package>`, lang: 'xml' },
      { ul: [
        'Each `<types>` block names one metadata type in `<name>` and lists components in `<members>`.',
        '`<version>` is the Metadata API version used for the operation. It should not be higher than the version your org is on.',
        'The namespace on `<Package>` is required exactly as shown.',
      ] },
      { h: 'Wildcards' },
      { p: 'An asterisk in `<members>` means “every component of this type”. It works for many types, including `ApexClass`, `ApexTrigger`, `Flow`, `LightningComponentBundle` and `PermissionSet`, but not for all of them.' },
      { ul: [
        'Child types such as `CustomField`, `ValidationRule`, `RecordType` and `ListView` need each member named as `Object.Component`.',
        'Folder-based types such as `Report`, `Dashboard`, `Document` and `EmailTemplate` need `Folder/Component` names.',
        'For `CustomObject`, the wildcard returns custom objects only. Standard objects such as `Account` must be named explicitly.',
        '`StandardValueSet` members, such as `Industry`, must always be named.',
      ] },
      { h: 'Mistakes that waste an afternoon' },
      { ul: [
        'Using the label instead of the API name. `Invoice` will not match `Invoice__c`.',
        'Forgetting the object for child types. `Region__c` is not a valid `CustomField` member; `Account.Region__c` is.',
        'Layout names. They combine the object and the layout label: `Account-Account Layout`.',
        'Retrieving a profile on its own. A profile in a retrieve only contains permissions for the other components in the same manifest, so the result looks almost empty.',
        'Setting a version higher than the target org supports, which fails immediately.',
      ] },
      { h: 'Using the manifest with the Salesforce CLI' },
      { code: `# Retrieve what the manifest lists\nsf project retrieve start --manifest package.xml\n\n# Deploy what the manifest lists\nsf project deploy start --manifest package.xml`, lang: 'text' },
      { p: 'To delete components as part of a deployment, list them in a second file named `destructiveChanges.xml` with the same structure, alongside a `package.xml`.' },
      { note: 'Salesforce adds and changes metadata types in every release. The Metadata Coverage Report on the Salesforce developer site is the authoritative list.' },
    ],
  },
  {
    slug: 'apex-test-data-factory-and-testsetup',
    title: 'Apex test data: @TestSetup methods and test data factories',
    description:
      'How to create reliable test records in Apex using @TestSetup and a test data factory, with patterns for bulk tests, lookups and unique fields.',
    minutes: 6,
    updated: '2026-11-15',
    toolSlug: 'apex-test-data-generator',
    blocks: [
      { p: 'Apex tests do not see your org’s records by default. Each test has to create the data it needs, which is good for reliability and tedious to write. Two patterns keep that work small: a test data factory, and `@TestSetup` methods.' },
      { h: 'A test data factory' },
      { p: 'A factory is an `@IsTest` class with static methods that build records. Tests call it instead of repeating `new Account(...)` everywhere. When a new required field or validation rule appears, you fix one method and every test recovers.' },
      { code: `@IsTest\npublic class AccountTestDataFactory {\n    public static List<Account> createAccounts(Integer count, Boolean doInsert) {\n        List<Account> accounts = new List<Account>();\n        for (Integer i = 0; i < count; i++) {\n            accounts.add(new Account(\n                Name = 'Test Account ' + i,\n                Industry = 'Technology'\n            ));\n        }\n        if (doInsert) {\n            insert accounts;\n        }\n        return accounts;\n    }\n}`, lang: 'apex' },
      { p: 'The `doInsert` flag matters. Returning records without inserting them lets a test adjust a field first, or test a `before insert` trigger with exactly the values it needs.' },
      { h: '@TestSetup' },
      { p: 'A method annotated with `@TestSetup` runs once before the test methods in its class. The records it inserts are available to every test method, and changes made by one test are rolled back before the next one starts.' },
      { code: `@IsTest\nprivate class AccountServiceTest {\n    @TestSetup\n    static void setupTestData() {\n        AccountTestDataFactory.createAccounts(200, true);\n    }\n\n    @IsTest\n    static void updatesRatings() {\n        List<Account> accounts = [SELECT Id FROM Account];\n        Test.startTest();\n        AccountService.updateRatings(accounts);\n        Test.stopTest();\n        Assert.areEqual(200, [SELECT COUNT() FROM Account WHERE Rating = 'Hot']);\n    }\n}`, lang: 'apex' },
      { p: 'Test methods query the records they need. Static variables set inside the setup method are not carried over to test methods, so do not try to pass records that way.' },
      { h: 'Habits that prevent flaky tests' },
      { ul: [
        'Test with 200 records at least once. Triggers receive records in batches of up to 200, and bulk problems only show up at that size.',
        'Never hard-code record IDs. They differ in every org and sandbox. Create the parent record and use its `Id`.',
        'Make unique fields unique. Add the loop index to names, emails and usernames so duplicate rules and unique constraints do not fire.',
        'Wrap the code under test in `Test.startTest()` and `Test.stopTest()` to get a fresh set of governor limits and to force asynchronous work to finish.',
        'Assert on results, not just on the absence of errors.',
      ] },
      { h: 'Parent and child records' },
      { p: 'Insert parents first, then build children that reference them. In a factory this usually means a method that accepts the parent records as a parameter.' },
      { code: `List<Account> accounts = AccountTestDataFactory.createAccounts(2, true);\nList<Contact> contacts = new List<Contact>();\nfor (Account acc : accounts) {\n    contacts.add(new Contact(LastName = 'Test', AccountId = acc.Id));\n}\ninsert contacts;`, lang: 'apex' },
      { note: 'Generated test data is a starting point. Your org’s required fields, validation rules, duplicate rules and record types decide what a valid record looks like.' },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const guideForTool = (toolSlug: string) => GUIDES.find((g) => g.toolSlug === toolSlug);
