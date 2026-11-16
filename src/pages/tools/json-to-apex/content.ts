import type { ToolContent } from '@/data/content';

export const EXAMPLES: { label: string; root: string; json: string }[] = [
  {
    label: 'Nested order',
    root: 'OrderResponse',
    json: `{
  "orderId": "A-1042",
  "status": "SHIPPED",
  "total": 249.5,
  "paid": true,
  "customer": {
    "id": 88213,
    "name": "Acme Labs",
    "email": "orders@acme.example"
  },
  "lines": [
    { "sku": "LAB-01", "quantity": 2, "unitPrice": 99.75 },
    { "sku": "LAB-07", "quantity": 1, "unitPrice": 50 }
  ],
  "tags": ["priority", "wholesale"],
  "coupon": null
}`,
  },
  {
    label: 'Simple object',
    root: 'Profile',
    json: `{
  "id": 501,
  "username": "jdoe",
  "active": true,
  "score": 97.5
}`,
  },
  {
    label: 'Array at the top',
    root: 'Account',
    json: `[
  { "id": "001", "name": "Acme", "employees": 120 },
  { "id": "002", "name": "Globex", "employees": 4000000000, "website": "https://globex.example" }
]`,
  },
  {
    label: 'Reserved words',
    root: 'EventPayload',
    json: `{
  "class": "premium",
  "limit": 50,
  "date": "2026-11-15",
  "first-name": "Ada",
  "object": { "type": "invoice", "new": true }
}`,
  },
];

export const content: ToolContent = {
  steps: [
    'Paste a sample of the JSON you receive into the input, or drop a `.json` file onto it.',
    'Set the root class name. This becomes the outer Apex class, for example `OrderResponse`.',
    'Choose options: a `parse()` helper, `@AuraEnabled` for Lightning components, or `{ get; set; }` properties.',
    'Select Generate Apex, then copy the code or download it as a `.cls` file.',
  ],
  features: [
    'Nested objects become inner classes; arrays become `List<T>`, including arrays of arrays.',
    'Numbers are typed as `Integer`, `Long` or `Decimal` from how they are written, so `1` and `1.0` differ.',
    'Objects in an array are merged, so a key that appears in only some items is still included.',
    'Reserved words and invalid names are renamed, and the generated `parse()` method maps them back.',
    'Identical shapes share one class; different shapes with the same key get distinct names.',
    'Clear error messages with the line and column of the first JSON syntax problem.',
  ],
  limitations: [
    'Types come from one sample. A `null` value or an empty array has no type to infer and becomes `Object`.',
    'Dates are left as `String`. JSON has no date type and formats vary between APIs.',
    'It does not create an Apex test class or deploy anything to your org.',
    'Keys that depend on data, such as a map keyed by record ID, are generated as fixed properties. Use `Map<String, Object>` for those.',
    'Generated code is checked against Apex naming rules, not compiled. Review it before deploying.',
  ],
  article: [
    { h: 'What JSON to Apex conversion means' },
    { p: 'Apex is strongly typed. To read a JSON payload comfortably you need classes whose properties match the payload’s keys, so that `JSON.deserialize` can fill them in. Writing those classes by hand is slow and error-prone for anything beyond a few fields. A JSON to Apex converter reads a sample payload and writes the classes for you.' },
    { h: 'Why Salesforce developers need wrapper classes' },
    { ul: [
      'REST callouts: parse the response of an external API into typed objects.',
      'Apex REST services: deserialize a request body sent to your `@RestResource` class.',
      'Lightning components: pass structured data between Apex and LWC with `@AuraEnabled` properties.',
      'Platform events and webhooks: read JSON stored in a long text field.',
    ] },
    { h: 'Example' },
    { p: 'This JSON:' },
    { code: `{\n  "name": "Acme",\n  "contacts": [\n    { "email": "a@acme.example", "primary": true }\n  ]\n}`, lang: 'json' },
    { p: 'becomes this Apex:' },
    { code: `public class AccountPayload {\n    public String name;\n    public List<Contact> contacts;\n\n    public class Contact {\n        public String email;\n        public Boolean primary;\n    }\n\n    public static AccountPayload parse(String jsonString) {\n        return (AccountPayload) JSON.deserialize(jsonString, AccountPayload.class);\n    }\n}`, lang: 'apex' },
    { h: 'Common conversion problems' },
    { h3: 'Reserved words' },
    { p: 'Keys such as `class`, `limit`, `date`, `new` and `object` cannot be Apex property names. The generator appends `_x` and, when the `parse()` option is on, adds one line per renamed key that rewrites the key in the JSON text before deserializing. The rewrite only matches a quoted name followed by a colon, so values are never touched.' },
    { h3: 'Keys with hyphens, spaces or leading digits' },
    { p: '`first-name` becomes `first_name` and `2fa` becomes `x2fa`. Double underscores are collapsed because Apex reserves them. These are mapped by `parse()` in the same way.' },
    { h3: 'Numbers that are too large for Integer' },
    { p: 'An Apex `Integer` holds 32 bits. Values above 2,147,483,647, such as timestamps in milliseconds, are generated as `Long`. If one array item has a decimal point, the whole property becomes `Decimal`.' },
    { h3: 'Null and empty values' },
    { p: 'When the sample contains `null` or `[]`, the real type is unknown, so the property is generated as `Object` or `List<Object>` and listed under “things to check”. Paste a sample where the value is filled in, or correct the type by hand.' },
    { h3: 'Names that collide' },
    { p: 'Apex is case-insensitive, so `Name` and `name` in the same object would clash. The second one gets a numeric suffix and is mapped by `parse()`.' },
  ],
  faqs: [
    { q: 'Is my JSON uploaded anywhere?', a: 'No. Parsing and code generation run in your browser. The JSON you paste is not sent to a server, logged or stored.' },
    { q: 'How do I use the generated class?', a: 'Deploy the class to your org, then call `YourClass.parse(response.getBody())` after a callout. If you turned the `parse()` option off, call `JSON.deserialize(body, YourClass.class)` and cast the result.' },
    { q: 'Why are all the classes nested inside one class?', a: 'It keeps a payload’s types together in one file, and it avoids name clashes with other classes in your org. Apex allows one level of inner classes, so every generated class sits directly inside the root class.' },
    { q: 'Can it handle a JSON array at the top level?', a: 'Yes. The root class describes one item, and `parse()` returns a `List` of the root class.' },
    { q: 'Does the output work with LWC and Aura?', a: 'Turn on `@AuraEnabled`. Each property is annotated so the framework can serialize it when your Apex method returns the wrapper.' },
    { q: 'What happens to keys my class does not declare?', a: '`JSON.deserialize` ignores them, so an API that adds new fields will not break your code. Properties that are missing from the payload are left as `null`.' },
  ],
};
