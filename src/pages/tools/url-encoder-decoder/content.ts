import type { ToolContent } from '@/data/content';

export const content: ToolContent = {
  steps: [
    'Choose Encode or Decode.',
    'Pick how to encode: a single value (component), a whole URL, or a form value with “+” for spaces.',
    'Type or paste text. The result updates as you type.',
    'When the text is a full URL, its scheme, host, path and every query parameter are listed below.',
  ],
  features: [
    'Three encodings: `encodeURIComponent`, `encodeURI` and `application/x-www-form-urlencoded`.',
    'Form mode produces exactly what Apex `EncodingUtil.urlEncode(value, \'UTF-8\')` returns.',
    'Decoding explains malformed percent-sequences and where they are.',
    'Breaks any URL into its parts and decodes every query parameter, including repeated ones.',
    'Full UTF-8 support for accented letters, other alphabets and emoji.',
  ],
  limitations: [
    'Encoding is not encryption; anyone can decode the result.',
    'It does not shorten URLs or check whether they work.',
    'Internationalised domain names are shown as the browser parses them, which may be in punycode.',
  ],
  article: [
    { h: 'Why URLs need encoding' },
    { p: 'A URL can only contain a limited set of characters, and some of them have jobs: `?` starts the query, `&` separates parameters and `=` separates a name from its value. To send a value that contains these characters, or spaces and non-English letters, each unsafe byte is written as `%` followed by two hexadecimal digits. A space becomes `%20`, and `é` becomes `%C3%A9`.' },
    { h: 'Which mode to use' },
    { ul: [
      'Component: for one value going into a URL, such as a search term or a record name. Encodes everything except letters, digits and `-_.!~*\'()`.',
      'Whole URL: for a complete address that may contain spaces. Leaves `:/?#&=` alone so the URL keeps its structure.',
      'Form: for `application/x-www-form-urlencoded` bodies and Apex. Spaces become `+`.',
    ] },
    { h: 'URL encoding in Apex' },
    { code: `String q = EncodingUtil.urlEncode('Acme & Sons', 'UTF-8');   // Acme+%26+Sons\nreq.setEndpoint('callout:Search_API/accounts?name=' + q);\n\nString original = EncodingUtil.urlDecode(q, 'UTF-8');         // Acme & Sons`, lang: 'apex' },
    { p: 'Encode each value separately, never the whole URL: encoding the whole URL would also encode the `?` and `&` that give it structure.' },
  ],
  faqs: [
    { q: 'Should spaces be %20 or +?', a: 'Inside a URL path, use %20. In query strings and form bodies, both are usually accepted; + is the form-encoding convention and what Apex produces.' },
    { q: 'Why did decoding fail?', a: 'A “%” must be followed by two hexadecimal digits, and the bytes must form valid UTF-8. A lone “%”, or text encoded with an old character set, causes this error.' },
    { q: 'Is my text sent anywhere?', a: 'No. Encoding, decoding and URL parsing run in your browser. URLs often contain tokens and IDs; they never leave your device.' },
    { q: 'Does this match JavaScript’s functions?', a: 'Yes. Component and whole-URL modes use encodeURIComponent and encodeURI directly.' },
    { q: 'Can I see the parameters of a long URL?', a: 'Yes. Paste the URL in either mode; when it is a complete URL, every query parameter is listed with its decoded value.' },
  ],
};
