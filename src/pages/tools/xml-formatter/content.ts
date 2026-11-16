import type { ToolContent } from '@/data/content';

export const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?><CustomObject xmlns="http://soap.sforce.com/2006/04/metadata"><label>Invoice</label><pluralLabel>Invoices</pluralLabel><nameField><label>Invoice Number</label><type>AutoNumber</type><displayFormat>INV-{0000}</displayFormat></nameField><!-- Sharing and deployment --><sharingModel>ReadWrite</sharingModel><deploymentStatus>Deployed</deploymentStatus><fields><fullName>Amount__c</fullName><type>Currency</type><precision>16</precision><scale>2</scale></fields><description><![CDATA[Invoices synced from the billing system & ERP.]]></description></CustomObject>`;

export const content: ToolContent = {
  steps: [
    'Paste XML into the input, or drop an `.xml` file onto it.',
    'Choose Format or Minify, and the indentation.',
    'If the XML is not well-formed, the error names the exact line, column and the tag involved.',
    'Copy the result or download it as an `.xml` file.',
  ],
  features: [
    'Checks well-formedness: matching tags, a single root, quoted attributes, no duplicate attributes and valid entities.',
    'Keeps short text-only elements on one line, such as `<label>Invoice</label>`.',
    'Preserves comments, CDATA sections, processing instructions and the XML declaration.',
    'Minify removes whitespace between tags for compact payloads.',
    'Works well with Salesforce metadata files such as `package.xml`, objects, flows and layouts.',
  ],
  limitations: [
    'It checks that XML is well-formed, not that it is valid against a schema (XSD) or DTD.',
    'Whitespace inside mixed content (text and elements together) may be adjusted when formatting.',
    'Entities defined in a DOCTYPE are not expanded.',
  ],
  article: [
    { h: 'Well-formed XML' },
    { p: 'An XML document is well-formed when it follows XML’s basic rules. Every opening tag has a matching closing tag in the right order, there is exactly one root element, attribute values are quoted, and special characters in text are written as entities: `&lt;` for `<` and `&amp;` for `&`. Any XML parser, including the one Salesforce uses for metadata deployments, rejects documents that break these rules.' },
    { h: 'Example error' },
    { code: '<types>\n    <members>*</members>\n    <name>ApexClass</name>\n</type>', lang: 'xml' },
    { p: 'This reports: the closing tag `</type>` does not match `<types>`, which was opened on line 1.' },
    { h: 'XML in Salesforce' },
    { p: 'Every piece of Salesforce metadata is XML: object definitions, fields, layouts, flows, permission sets and the `package.xml` that lists them. When a deployment fails with a parse error, formatting the file usually makes the problem obvious. Integrations with SOAP APIs and older enterprise systems also exchange XML.' },
    { p: 'In Apex, `Dom.Document` reads and writes XML, and `XmlStreamReader` handles large documents efficiently.' },
    { code: `Dom.Document doc = new Dom.Document();\ndoc.load(xmlString);\nDom.XmlNode root = doc.getRootElement();\nString label = root.getChildElement('label', root.getNamespace()).getText();`, lang: 'apex' },
  ],
  faqs: [
    { q: 'Is my XML uploaded?', a: 'No. Parsing and formatting happen in your browser. Nothing is sent anywhere.' },
    { q: 'Does formatting change my data?', a: 'Element names, attributes, comments and CDATA are kept. Whitespace between tags is changed, and leading or trailing spaces in text are trimmed, which matters only for mixed content.' },
    { q: 'Why does “&” cause an error?', a: 'In XML, “&” starts an entity such as &amp;amp;. A bare “&” in text must be written as &amp;amp;, or the text must be wrapped in a CDATA section.' },
    { q: 'Can it validate against a schema?', a: 'No. It checks the rules every XML document must follow. Schema validation needs the XSD and is best done by the receiving system.' },
    { q: 'Can I format package.xml here?', a: 'Yes. To build one from scratch, the Package.xml Builder is quicker.' },
  ],
};
