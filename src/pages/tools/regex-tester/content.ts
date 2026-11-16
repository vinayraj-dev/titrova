import type { ToolContent } from '@/data/content';

export const content: ToolContent = {
  steps: [
    'Type a pattern, without the surrounding slashes, and choose its flags.',
    'Paste the text to test. Matches are highlighted as you type, and every match and capture group is listed.',
    'Turn on Replace to preview a replacement using `$1`, `$2` or `$<name>`.',
    'Copy the pattern as Apex `Pattern` and `Matcher` code when it works.',
  ],
  features: [
    'Live highlighting of every match, including zero-length matches, with positions and capture groups.',
    'Named groups, all JavaScript flags, and a replace preview.',
    'Runs patterns in a background worker with a time limit, so a runaway pattern cannot freeze the page.',
    'Converts the pattern to Apex with correct string escaping and inline flags such as `(?i)`.',
    'A library of common patterns, including Salesforce record IDs.',
  ],
  limitations: [
    'Patterns run with the JavaScript engine. Apex uses Java regular expressions, which differ in a few areas; the tool points these out.',
    'At most 1,000 matches are listed.',
    'It does not explain a pattern in plain language or generate one from examples.',
  ],
  article: [
    { h: 'Testing a regular expression' },
    { p: 'Regular expressions are compact and unforgiving: one missing escape and the pattern matches far more, or far less, than you meant. Testing against real sample text, with every match highlighted, is the quickest way to get one right.' },
    { h: 'Flags' },
    { ul: [
      '`g` (global): find every match, not just the first.',
      '`i` (ignore case): `a` also matches `A`.',
      '`m` (multiline): `^` and `$` match at the start and end of each line.',
      '`s` (dot all): `.` also matches line breaks.',
      '`u` (Unicode): treat the pattern and text as Unicode code points.',
      '`y` (sticky): match only at the current position.',
    ] },
    { h: 'Regular expressions in Apex' },
    { p: 'Apex uses Java’s regular expression engine through the `Pattern` and `Matcher` classes. Two things trip people up. First, every backslash must be doubled inside an Apex string, so `\\d` becomes `\'\\\\d\'`. Second, flags are written inside the pattern, such as `(?i)` for ignore case.' },
    { code: `Pattern p = Pattern.compile('(?i)\\\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\\\.[a-z]{2,}\\\\b');\nMatcher m = p.matcher(input);\nwhile (m.find()) {\n    System.debug(m.group());\n}`, lang: 'apex' },
    { p: 'For a simple yes-or-no check on the whole string, `Pattern.matches(regex, input)` is shorter. Note that it must match the entire input, unlike JavaScript’s `test`.' },
    { h: 'Avoiding catastrophic backtracking' },
    { p: 'Nested quantifiers such as `(a+)+` can take exponential time on text that almost matches. In Apex this burns CPU time until the transaction hits its limit. If the tester stops a pattern for taking too long, rewrite it to remove the nesting or make the inner part more specific.' },
  ],
  faqs: [
    { q: 'Which regex flavour does this use?', a: 'JavaScript’s, because it runs in your browser. For Apex, the tool converts the pattern and lists any features that behave differently in Java.' },
    { q: 'How do I match a Salesforce record ID?', a: 'Choose “Salesforce ID” from the common patterns. It matches 15- or 18-character alphanumeric IDs on word boundaries. To confirm an ID is valid, use the Salesforce ID Converter.' },
    { q: 'Why do I see empty matches?', a: 'Patterns that can match nothing, such as `x*`, produce zero-length matches between characters. Use `+` instead of `*` if you need at least one character.' },
    { q: 'Is my text sent anywhere?', a: 'No. Matching runs in a worker inside your browser tab. Nothing is uploaded or stored.' },
    { q: 'Why does a pattern work here but not in Apex?', a: 'Usually a missing double backslash in the Apex string, or a lookbehind with an unbounded quantifier, which Java does not allow. Use the generated Apex code to avoid the first problem.' },
  ],
};
