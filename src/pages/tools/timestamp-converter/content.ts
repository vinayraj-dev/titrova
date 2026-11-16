import type { ToolContent } from '@/data/content';

export const EXAMPLE = '1794736800';
export const EXAMPLES = ['1794736800', '1794736800000', '2026-11-15T15:30:00+05:30', '2026-11-15', 'Sun, 15 Nov 2026 10:00:00 GMT'];

export const content: ToolContent = {
  steps: [
    'Type or paste a Unix timestamp, an ISO 8601 date or an HTTP date. Select Now for the current time.',
    'The tool detects whether a number is in seconds, milliseconds, microseconds or nanoseconds.',
    'Copy any format: ISO 8601, SOQL literals, Apex code, your local time and more.',
  ],
  features: [
    'Detects seconds, milliseconds, microseconds and nanoseconds from the number of digits.',
    'Accepts ISO 8601 with or without a time and offset, and HTTP / RFC 2822 dates.',
    'Produces SOQL DateTime and Date literals in exactly the format SOQL requires.',
    'Writes Apex `DateTime.newInstanceGmt(...)` and `DateTime.newInstance(milliseconds)` code.',
    'Shows your local time, your time zone and how long ago or ahead the moment is.',
  ],
  limitations: [
    'Dates without a time zone are treated as UTC, and the tool says so.',
    'Natural-language input such as “next Tuesday” is not understood.',
    'Salesforce stores dates from the years 1700 to 4000; dates outside that range are flagged.',
  ],
  article: [
    { h: 'What a Unix timestamp is' },
    { p: 'A Unix timestamp counts the seconds since midnight UTC on 1 January 1970. It is how most systems store time internally, because it is a single number with no time zone attached. JavaScript and Java use milliseconds instead of seconds, which is why some timestamps have 13 digits instead of 10.' },
    { h: 'Dates in SOQL' },
    { p: 'SOQL compares DateTime fields with literals in a strict format: the date and time in UTC, with a `Z` or an explicit offset, and no quotes.' },
    { code: `SELECT Id, Subject\nFROM Case\nWHERE CreatedDate >= 2026-11-15T10:00:00Z\n  AND ClosedDate = 2026-11-20`, lang: 'soql' },
    { p: 'Date fields such as `CloseDate` take a plain `YYYY-MM-DD` date. For rolling ranges, SOQL date literals such as `LAST_N_DAYS:30` or `THIS_MONTH` are often better than fixed dates.' },
    { h: 'Dates in Apex' },
    { code: `// A specific moment, in GMT\nDateTime dt = DateTime.newInstanceGmt(2026, 11, 15, 10, 0, 0);\n\n// From a Unix timestamp in milliseconds\nDateTime fromEpoch = DateTime.newInstance(1794736800000L);\n\n// Back to a Unix timestamp\nLong epochMs = dt.getTime();`, lang: 'apex' },
    { p: 'Apex DateTime values are always stored in GMT. Methods such as `format()` and `hour()` convert to the running user’s time zone, while their `Gmt` versions do not. Mixing the two is the most common source of “off by a few hours” bugs.' },
  ],
  faqs: [
    { q: 'How do I know if my number is seconds or milliseconds?', a: 'Current timestamps in seconds have 10 digits; in milliseconds they have 13. The tool detects this automatically and tells you what it assumed.' },
    { q: 'Why is the SOQL literal different from my local time?', a: 'SOQL DateTime literals are written in UTC. The moment is the same; only the clock time differs by your time zone offset.' },
    { q: 'What time zone does “Local time” use?', a: 'Your device’s time zone, which the page shows next to the result. Everything else on the page is in UTC so it is the same for everyone.' },
    { q: 'Is my input sent anywhere?', a: 'No. Every conversion happens in your browser.' },
    { q: 'Why does a date without a time show midnight UTC?', a: 'A date alone has no time or zone, so the tool uses the start of that day in UTC, as ISO 8601 recommends. Add a time and offset for a specific moment.' },
  ],
};
