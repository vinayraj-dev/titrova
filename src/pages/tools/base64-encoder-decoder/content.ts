import type { ToolContent } from '@/data/content';

export const content: ToolContent = {
  steps: [
    'Choose Encode or Decode.',
    'Type or paste text. To encode a file, select Encode a file instead; it is read on your device.',
    'For URLs, file names or JWTs, turn on URL-safe to use `-` and `_` instead of `+` and `/`.',
    'Copy or download the result. Decoded binary data, such as an image, can be downloaded as a file.',
  ],
  features: [
    'Full UTF-8 support, so accented letters, other alphabets and emoji survive the round trip.',
    'Standard and URL-safe Base64, with or without padding; decoding accepts either automatically.',
    'Accepts input with line breaks and `data:` URI prefixes.',
    'Detects binary results and shows a hexadecimal preview with a download button.',
    'Clear errors that name the invalid character and its position.',
  ],
  limitations: [
    'Files are limited to 10 MB to keep the page responsive.',
    'It does not encrypt anything. Base64 is an encoding that anyone can reverse.',
    'Decoded text is assumed to be UTF-8. Text in other character sets shows as binary.',
  ],
  article: [
    { h: 'What Base64 is for' },
    { p: 'Base64 represents any bytes using 64 safe characters: letters, digits, `+` and `/`. It lets binary data, such as a PDF or an image, travel through systems that only handle text, like JSON payloads, XML and email. The cost is size: the encoded text is about a third larger than the original.' },
    { h: 'Base64 is not encryption' },
    { p: 'Anyone can decode Base64, so it protects nothing. A password that is “only” Base64-encoded, such as in an HTTP Basic Authorization header, is effectively in plain text. That is why Basic authentication must only be used over HTTPS.' },
    { h: 'URL-safe Base64' },
    { p: 'The `+` and `/` characters have special meanings in URLs and file names. URL-safe Base64 (also called Base64URL) replaces them with `-` and `_`, and usually drops the `=` padding. JSON Web Tokens use it for each of their three parts.' },
    { h: 'Base64 in Apex' },
    { code: `// Text to Base64\nString encoded = EncodingUtil.base64Encode(Blob.valueOf('Hello'));\n\n// Base64 back to text\nString decoded = EncodingUtil.base64Decode(encoded).toString();\n\n// A file (ContentVersion) to Base64\nString fileData = EncodingUtil.base64Encode(contentVersion.VersionData);`, lang: 'apex' },
    { p: '`EncodingUtil.base64Encode` produces standard Base64 with padding, the same as this tool’s default. Apex has no built-in URL-safe variant; replace `+` with `-` and `/` with `_` yourself if you need it.' },
  ],
  faqs: [
    { q: 'Is my data uploaded?', a: 'No. Encoding and decoding, including files, happen in your browser. Nothing leaves your device.' },
    { q: 'Why does my decoded text look like random symbols?', a: 'The original data was probably binary, such as an image or a zip file, or text in a character set other than UTF-8. The tool shows binary data as hexadecimal and lets you download it.' },
    { q: 'Why does the encoded text end with “=”?', a: 'Base64 works in groups of three bytes. When the input is not a multiple of three, one or two “=” characters pad the end. URL-safe Base64 often leaves them out.' },
    { q: 'How do I put an image in HTML or CSS?', a: 'Encode the file with “As data URI” turned on. The result starts with `data:image/png;base64,` and can be used directly as an image source.' },
    { q: 'Does this match Apex EncodingUtil?', a: 'Yes. Standard mode with padding produces exactly what `EncodingUtil.base64Encode` returns for the same bytes.' },
  ],
};
