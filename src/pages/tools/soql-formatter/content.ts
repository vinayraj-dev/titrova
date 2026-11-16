import type { ToolContent } from '@/data/content';

export const EXAMPLES: { label: string; query: string }[] = [
  {
    label: 'Relationship query',
    query:
      "select Id, Name, Owner.Name, (select Id, LastName, Email from Contacts where Email != null order by LastName) from Account where Industry = 'Technology' and (Rating = 'Hot' or AnnualRevenue > 5000000) order by Name asc nulls last limit 50",
  },
  { label: 'Basic', query: "select Id, Name from Account where Name like 'Acme%' limit 10" },
  {
    label: 'Aggregate',
    query:
      'select StageName, count(Id) deals, sum(Amount) total from Opportunity where CloseDate = THIS_YEAR group by StageName having sum(Amount) > 100000 order by sum(Amount) desc',
  },
  {
    label: 'Semi-join',
    query:
      "select Id, Name from Account where Id in (select AccountId from Opportunity where StageName = 'Closed Won' and CloseDate = LAST_N_DAYS:90) and Id not in (select AccountId from Case where IsClosed = false)",
  },
  {
    label: 'Bind variables',
    query:
      'select Id, Subject, Status from Case where OwnerId = :UserInfo.getUserId() and AccountId in :accountIds and CreatedDate >= :startDate with USER_MODE order by CreatedDate desc limit :pageSize offset :offset',
  },
];

export const content: ToolContent = {
  steps: [
    'Paste a SOQL query into the input. Paste only the query, without the square brackets Apex puts around it.',
    'Choose how keywords and field lists should be laid out.',
    'Select Format query, or press Ctrl+Enter (⌘+Enter on a Mac).',
    'Copy the formatted query or download it. Use Minify to get it back on one line.',
  ],
  features: [
    'Each clause starts on its own line: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`, `OFFSET`.',
    'Child relationship subqueries and semi-joins are indented as queries of their own.',
    'Conditions break at `AND` and `OR`; long parenthesised groups are expanded.',
    'Aggregate functions, date literals such as `LAST_N_DAYS:30`, `TYPEOF` and bind variables such as `:accountIds` are understood.',
    'Object names that look like keywords, such as `Order`, `Group` and `Case`, are left alone.',
    'A safety check compares the query before and after; if anything but spacing and keyword case changed, the result is not shown.',
  ],
  limitations: [
    'It checks the shape of a query, not its meaning. It cannot know whether a field, object or relationship exists in your org.',
    'It does not run queries, estimate selectivity or check governor limits.',
    'SOSL (`FIND … RETURNING`) is not supported.',
    'Complex Apex expressions after a colon, such as `:map.get(key)`, may be rejected. Assign them to a variable first.',
    'Comments are not part of SOQL and are reported as unexpected characters.',
  ],
  article: [
    { h: 'What a SOQL formatter does' },
    { p: 'SOQL from a debug log, a trace flag or a string in Apex is usually one long line. A formatter rewrites the same query across several lines with consistent indentation, so the fields, filters and ordering can be read at a glance. The query itself does not change: only spaces, line breaks and, if you choose, the letter case of keywords.' },
    { h: 'Example' },
    { p: 'Before:' },
    { code: "select Id, Name, (select LastName from Contacts) from Account where Industry = 'Technology' and AnnualRevenue > 1000000 order by Name limit 20", lang: 'soql' },
    { p: 'After:' },
    { code: "SELECT\n  Id,\n  Name,\n  (\n    SELECT LastName\n    FROM Contacts\n  )\nFROM Account\nWHERE Industry = 'Technology'\n  AND AnnualRevenue > 1000000\nORDER BY Name\nLIMIT 20", lang: 'soql' },
    { h: 'How the layout is decided' },
    { ul: [
      'Up to three fields stay on the `SELECT` line. More than three, or any subquery, puts one field per line. You can force either layout.',
      'The first condition stays on the `WHERE` line; each following `AND` or `OR` starts an indented line.',
      'A parenthesised group stays on one line when it is short, and is expanded when it is long or contains a subquery.',
      '`TYPEOF` expressions put each `WHEN` and `ELSE` on its own line.',
    ] },
    { h: 'What the validation messages mean' },
    { p: 'The formatter reports problems it can see in the text itself: a missing `FROM`, a text value without a closing quote, parentheses that do not match, an extra comma in the field list, or clauses in an order Salesforce does not accept. These are structural checks. A query that formats cleanly can still fail in Salesforce if a field name is wrong, because only your org knows its schema.' },
    { h: 'Why meaning is preserved' },
    { p: 'The query is split into tokens: names, text values, numbers, operators and punctuation. Text inside quotes is treated as a single token and is never altered. After formatting, the output is split into tokens again and compared with the original list. Formatting is only accepted when the two lists match.' },
  ],
  faqs: [
    { q: 'Does formatting change what my query returns?', a: 'No. Only whitespace and, optionally, the case of keywords change. SOQL ignores both. Text values inside quotes are never modified.' },
    { q: 'Can it tell me if my query is valid?', a: 'It can tell you if the structure is wrong, for example a missing `FROM` or unbalanced parentheses. It cannot confirm that fields and objects exist, because that requires a connection to your org, and this tool does not connect to Salesforce.' },
    { q: 'Does it support Apex bind variables?', a: 'Yes. Expressions such as `:accountIds`, `:acc.Id` and `:UserInfo.getUserId()` are kept exactly as written.' },
    { q: 'How do I put the query back on one line?', a: 'Select Minify. It collapses the query to a single line with single spaces, which is handy for dynamic SOQL strings and for query parameters in REST API URLs.' },
    { q: 'Is my query sent to a server?', a: 'No. Formatting runs in your browser. Queries often contain object and field names you would rather keep private, and they never leave your device.' },
    { q: 'Should SOQL keywords be upper case?', a: 'SOQL is not case-sensitive, so it is a style choice. Upper-case keywords are the most common convention because they separate the structure of the query from API names. You can turn the option off to keep your own casing.' },
  ],
};
