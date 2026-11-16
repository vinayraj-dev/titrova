import type { ToolContent } from '@/data/content';

export const EXAMPLE_SINGLE = '001A0000006Vm9r';
export const EXAMPLE_BATCH = ['001A0000006Vm9r', '0035g00000XyZaB', '5005g00000AbCdE', '001A0000006VM9RIAC', '006A000000QwErTIAV', '00Q5g0000-oops'].join('\n');

export const content: ToolContent = {
  steps: [
    'Paste one Salesforce ID, or a whole column of IDs, into the input. Separate IDs with new lines, commas or spaces.',
    'Read the result. It updates as you type and shows the 18-character and 15-character form of every ID.',
    'Copy a single ID, copy the full list of 18-character IDs, or download the results as a CSV file.',
  ],
  features: [
    'Converts 15-character IDs to 18-character case-safe IDs using Salesforce’s checksum algorithm.',
    'Detects the format automatically: 15 characters are converted, 18 characters are verified.',
    'Shows the 15-character form of any 18-character ID.',
    'Restores letter casing from the suffix when an 18-character ID was upper-cased or lower-cased.',
    'Batch mode: paste thousands of IDs at once, then copy or download the results.',
    'Names the object for well-known key prefixes, such as `001` for Account.',
  ],
  limitations: [
    'It cannot tell you whether a record exists. A correctly formed ID is only a correctly formed ID.',
    'It does not connect to Salesforce, so it cannot look up record names, owners or the org an ID belongs to.',
    'Key prefixes of custom objects differ in every org and are not identified.',
    'A 15-character ID whose casing has already been lost cannot be repaired, because the casing is the missing information.',
  ],
  article: [
    { h: 'Why Salesforce IDs come in two lengths' },
    { p: 'A Salesforce record ID is case-sensitive in its 15-character form: `001A0000006Vm9r` and `001a0000006vm9r` identify different records. Many tools, including spreadsheets and some databases, compare text without regard to case, which makes distinct IDs look identical. The 18-character form solves this by adding three characters that record which letters are uppercase. It is safe to use anywhere.' },
    { h: 'How the 15 to 18 character conversion works' },
    { ol: [
      'Split the 15 characters into three groups of five.',
      'For each group, note which positions hold an uppercase letter.',
      'Treat those positions as a 5-bit number, with the first character as the lowest bit.',
      'Map the number (0 to 31) to one character of `ABCDEFGHIJKLMNOPQRSTUVWXYZ012345`.',
      'Append the three characters to the ID.',
    ] },
    { p: 'For `001A0000006Vm9r`, the groups `001A0`, `00000` and `6Vm9r` give 8, 0 and 2, which map to `I`, `A` and `C`. The 18-character ID is `001A0000006Vm9rIAC`. Enter a single ID above to see this breakdown for your own ID.' },
    { h: 'When you need 18 characters' },
    { ul: [
      'Matching records in Excel or Google Sheets with `VLOOKUP`, `XLOOKUP` or `MATCH`.',
      'Loading data with tools that compare IDs case-insensitively.',
      'Storing Salesforce IDs in an external database or data warehouse.',
      'Comparing an ID from a report or URL (often 15 characters) with one from the API (always 18).',
    ] },
    { h: 'Example' },
    { code: 'Input (15)    001A0000006Vm9r\nOutput (18)   001A0000006Vm9rIAC\n\nInput (18, casing lost)   001A0000006VM9RIAC\nRestored                  001A0000006Vm9rIAC', lang: 'text' },
    { h: 'Getting 18-character IDs inside Salesforce' },
    { p: 'In a formula field, `CASESAFEID(Id)` returns the 18-character ID, which is useful in reports. In Apex, an `Id` value converted with `String.valueOf` is 18 characters long. Data Loader and the REST and SOAP APIs always return 18 characters.' },
  ],
  faqs: [
    { q: 'Is the 18-character ID a different record?', a: 'No. It is the same record ID with a three-character checksum added. Salesforce accepts either form anywhere an ID is expected.' },
    { q: 'Can I convert 18 characters back to 15?', a: 'Yes. The 15-character ID is simply the first 15 characters of the 18-character ID. The converter shows both.' },
    { q: 'What does “casing restored” mean?', a: 'The last three characters of an 18-character ID describe which letters are uppercase. If a spreadsheet or another system changed the casing, the converter uses the suffix to put it back.' },
    { q: 'Does a valid result mean the record exists?', a: 'No. The checksum only describes letter casing. Whether a record with that ID exists, and in which org, can only be checked in Salesforce.' },
    { q: 'How many IDs can I convert at once?', a: 'There is no fixed limit. Conversion happens on your device, and tens of thousands of IDs take well under a second on a typical laptop. The on-screen table shows the first 300 rows; copy and download include every row.' },
    { q: 'Are my IDs sent anywhere?', a: 'No. The conversion is a small calculation that runs in your browser. Nothing you paste leaves your device.' },
  ],
};
