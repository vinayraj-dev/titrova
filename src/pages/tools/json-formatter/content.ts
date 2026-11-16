import type { ToolContent } from '@/data/content';

export const SAMPLE = `{"account":{"id":"001A0000006Vm9rIAC","name":"Acme Labs","annualRevenue":1250000.00,"active":true,"tags":["priority","wholesale"],"owner":{"name":"Ada Rao","email":"ada@acme.example"},"externalId":9007199254740993,"contacts":[]}}`;

export const content: ToolContent = {
  steps: [
    'Paste JSON into the input, or drop a `.json` file onto it.',
    'Choose Format, Minify or Apex string, and the indentation you prefer.',
    'Turn on “Sort keys” to order every object’s keys alphabetically, which makes two payloads easy to compare.',
    'Copy the result or download it as a file.',
  ],
  features: [
    'Validates as you type and points to the exact line and column of the first error, with a plain explanation.',
    'Keeps numbers exactly as written: `1.0` stays `1.0` and integers too large for JavaScript are not rounded.',
    'Warns about duplicate keys, which most parsers silently overwrite.',
    'Apex string mode produces `String jsonBody = \'...\';` with every quote escaped, ready for a test or a callout.',
    'Shows size, depth and how many objects, arrays and keys the document has.',
  ],
  limitations: [
    'Strict JSON only: comments, trailing commas and single-quoted strings are reported as errors, as Apex would.',
    'It does not validate against a JSON Schema.',
    'Escapes inside strings may be normalised, for example `\\u00e9` becomes `é`. The value is unchanged.',
  ],
  article: [
    { h: 'What a JSON formatter does' },
    { p: 'APIs usually return JSON on a single line to save bytes. A formatter adds line breaks and indentation so you can see the structure: which objects are nested, what each array holds and where a value is missing. Minifying does the opposite, for when you need the smallest possible payload.' },
    { h: 'Why number precision matters' },
    { p: 'Many online formatters use JavaScript’s `JSON.parse`, which turns every number into a 64-bit floating point value. Integers above 9,007,199,254,740,991 are silently rounded, and `1.0` becomes `1`. This formatter never converts numbers, so record numbers, external IDs and money values come out exactly as they went in.' },
    { h: 'Common JSON errors' },
    { ul: [
      'A trailing comma after the last item: `[1, 2,]`.',
      'Single quotes instead of double quotes: `{\'name\': \'Acme\'}`.',
      'Keys without quotes: `{name: "Acme"}`.',
      'Comments, which JSON does not allow.',
      'A missing comma between two properties.',
    ] },
    { h: 'JSON in Apex' },
    { p: 'To put JSON in Apex, for example as a test fixture, use Apex string mode. It escapes the single quotes and backslashes for you.' },
    { code: `String jsonBody = '{"name":"O\\'Brien","active":true}';\nMap<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(jsonBody);`, lang: 'apex' },
    { p: 'To turn the same JSON into typed wrapper classes, use the JSON to Apex Class Generator.' },
  ],
  faqs: [
    { q: 'Is my JSON uploaded?', a: 'No. Parsing and formatting happen in your browser. Nothing you paste is sent anywhere or stored.' },
    { q: 'Why does it reject my JSON when another site accepts it?', a: 'Some formatters accept JavaScript-style input such as comments or trailing commas. Apex’s JSON parser and most APIs do not, so this tool reports them as errors.' },
    { q: 'What does “Sort keys” change?', a: 'Only the order of keys inside objects. Arrays keep their order, because array order has meaning.' },
    { q: 'How large a file can it handle?', a: 'Files of several megabytes format in well under a second on a typical laptop. Very large files may make the highlighted view slower to scroll.' },
    { q: 'Can I compare two JSON documents?', a: 'Format both with “Sort keys” on and the same indentation, then compare them with any text diff tool. The output is stable, so only real differences show up.' },
  ],
};
