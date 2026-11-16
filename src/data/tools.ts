import {
  Binary, Braces, Clock4, Code2, Database, FileCode2, Fingerprint, FlaskConical, KeyRound, Link2, PackageOpen, Plug, Regex,
  Settings2, ShieldCheck, Table2, Terminal, Webhook, type LucideIcon,
} from 'lucide-react';

export type CategoryId = 'apex' | 'soql' | 'admin' | 'api' | 'encoding' | 'developer';
export type Family = 'salesforce' | 'developer';

export interface Category {
  id: CategoryId;
  slug: string;
  name: string;
  short: string;
  emoji: string;
  blurb: string;
  /** Meta description, 120–160 characters. */
  seoDescription: string;
  intro: string[];
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  {
    id: 'apex',
    slug: 'apex-utilities',
    name: 'Apex Utilities',
    short: 'Apex',
    emoji: '🧬',
    blurb: 'Generate wrapper classes, callouts and test data without writing boilerplate by hand.',
    seoDescription: 'Free Apex tools: turn JSON into wrapper classes, cURL commands into HTTP callouts, and record definitions into test data factories.',
    icon: Code2,
    intro: [
      'Apex is strongly typed, which is great for safety and slow for boilerplate. Every integration needs wrapper classes and callout code, and every test class needs records that satisfy the code under test.',
      'These utilities write that repetitive code for you. Paste a payload, a cURL command or a record definition, and copy Apex that follows the language’s naming rules, including reserved words and the 40-character class name limit.',
    ],
  },
  {
    id: 'soql',
    slug: 'soql-utilities',
    name: 'SOQL & SQL Utilities',
    short: 'Queries',
    emoji: '🔎',
    blurb: 'Turn one-line queries into readable, reviewable SOQL and SQL.',
    seoDescription: 'Free query formatters: lay out Salesforce SOQL and SQL for PostgreSQL, MySQL, SQL Server, Oracle and SQLite in your browser.',
    icon: Database,
    intro: [
      'Queries copied from debug logs, consoles or strings in code usually arrive as one long line. That makes them hard to review, hard to diff and easy to get wrong.',
      'The SOQL formatter understands Salesforce’s own grammar — relationship subqueries, date literals, TYPEOF and bind variables. The SQL formatter covers the common database dialects you meet on the other side of an integration.',
    ],
  },
  {
    id: 'admin',
    slug: 'salesforce-admin-utilities',
    name: 'Salesforce Admin Utilities',
    short: 'Admin',
    emoji: '🛠️',
    blurb: 'Everyday helpers for data loads, record IDs, dates and deployments.',
    seoDescription: 'Free Salesforce admin tools: convert 15 to 18 character IDs, build package.xml files and convert timestamps to SOQL date literals.',
    icon: Settings2,
    intro: [
      'Admins move data between Salesforce, spreadsheets and other systems all day. Record IDs lose their letter casing, dates arrive in the wrong format, and deployment manifests have to be typed by hand.',
      'These utilities convert IDs in bulk, turn any timestamp into the exact literal SOQL expects, and build package.xml files from a searchable list of metadata types — with nothing to install and no org login.',
    ],
  },
  {
    id: 'api',
    slug: 'api-utilities',
    name: 'API & Integration Utilities',
    short: 'API',
    emoji: '🔌',
    blurb: 'Read tokens, shape payloads and turn API examples into working callouts.',
    seoDescription: 'Free API and integration tools: convert cURL to Apex callouts, decode JWTs, format JSON and encode URLs, all inside your browser.',
    icon: Plug,
    intro: [
      'Integration work is mostly translation: an API’s documentation shows a cURL command, the response is JSON, the login returns a JWT, and the query string has to be encoded exactly right.',
      'These tools handle each of those steps. They run entirely in your browser, so you can use them with real tokens and payloads from your project without sending anything to a server.',
    ],
  },
  {
    id: 'encoding',
    slug: 'encoding-utilities',
    name: 'Encoding & Security Utilities',
    short: 'Encoding',
    emoji: '🔐',
    blurb: 'Base64, URL encoding and JSON Web Tokens, decoded safely on your device.',
    seoDescription: 'Free encoding tools: Base64 and URL encode or decode, and inspect JSON Web Tokens with signature checks, privately in your browser.',
    icon: ShieldCheck,
    intro: [
      'Encoded text is everywhere in integrations: Base64 in attachments and Basic authentication, percent-encoding in URLs and form posts, and signed tokens in every OAuth flow.',
      'These tools decode and encode it precisely, explain what they find, and never upload it. That matters, because tokens and credentials are exactly the kind of text you should not paste into a website that sends it to a server.',
    ],
  },
  {
    id: 'developer',
    slug: 'developer-utilities',
    name: 'Developer Utilities',
    short: 'Developer',
    emoji: '🧰',
    blurb: 'Formatters, testers and converters for everyday development.',
    seoDescription: 'Free developer tools: JSON and XML formatters, a regex tester with Apex output, and a Unix timestamp converter. No sign-up, no uploads.',
    icon: Terminal,
    intro: [
      'Some jobs come up whatever platform you work on: tidying a JSON response, checking an XML file, testing a regular expression or working out what a Unix timestamp means.',
      'This category collects those everyday tools. Each one is built with Salesforce developers in mind — the regex tester writes Apex, the timestamp converter writes SOQL literals — and each one runs entirely in your browser.',
    ],
  },
];

export interface ToolMeta {
  slug: string;
  path: string;
  name: string;
  /** Compact label for menus, tabs and the footer. */
  short: string;
  emoji: string;
  family: Family;
  /** One line that says what goes in and what comes out. */
  tagline: string;
  /** Meta description, 120–160 characters. */
  description: string;
  seoTitle: string;
  categories: CategoryId[];
  icon: LucideIcon;
  from: string;
  to: string;
  added: string;
  keywords: string[];
}

const t = (slug: string, rest: Omit<ToolMeta, 'slug' | 'path'>): ToolMeta => ({ slug, path: `/tools/${slug}`, ...rest });

/** The order of this list is the "Popular" order on the dashboard. */
export const TOOLS: ToolMeta[] = [
  t('json-to-apex', {
    name: 'JSON to Apex Class Generator', short: 'JSON to Apex', emoji: '🧩', family: 'salesforce',
    tagline: 'Paste a JSON payload and get typed Apex wrapper classes with a parse() method.',
    description: 'Convert JSON to Apex wrapper classes online. Handles nested objects, arrays, null values and reserved words, and runs entirely in your browser.',
    seoTitle: 'JSON to Apex Class Generator – Free Online', categories: ['apex', 'api'], icon: Braces,
    from: 'JSON', to: 'Apex class', added: '2026-11-15', keywords: ['json2apex', 'wrapper', 'deserialize', 'class', 'integration', 'rest', 'callout'],
  }),
  t('soql-formatter', {
    name: 'SOQL Formatter', short: 'SOQL Formatter', emoji: '✨', family: 'salesforce',
    tagline: 'Format a SOQL query into clean, readable lines without changing its meaning.',
    description: 'Format and beautify Salesforce SOQL queries online. Supports subqueries, aggregates, bind variables and TYPEOF. Free, no login, runs in your browser.',
    seoTitle: 'Salesforce SOQL Formatter – Free Online', categories: ['soql'], icon: Database,
    from: 'One-line query', to: 'Formatted SOQL', added: '2026-11-15', keywords: ['query', 'beautify', 'pretty', 'select', 'minify', 'beautifier'],
  }),
  t('salesforce-id-converter', {
    name: 'Salesforce ID Converter', short: 'ID Converter', emoji: '🪪', family: 'salesforce',
    tagline: 'Convert 15-character IDs to 18-character case-safe IDs, one at a time or in bulk.',
    description: 'Convert Salesforce 15-character IDs to 18-character case-safe IDs. Batch conversion, checksum validation and casing repair, all in your browser.',
    seoTitle: 'Salesforce ID Converter – 15 to 18 Characters', categories: ['admin'], icon: Fingerprint,
    from: '15 characters', to: '18 characters', added: '2026-11-15', keywords: ['15 to 18', 'case safe', 'casesafeid', 'record id', 'checksum', 'excel', 'bulk'],
  }),
  t('package-xml-builder', {
    name: 'Package.xml Builder', short: 'Package.xml Builder', emoji: '📦', family: 'salesforce',
    tagline: 'Pick metadata types and members, then copy a ready-to-use package.xml.',
    description: 'Build a Salesforce package.xml manifest online. Search metadata types, add members or wildcards, set the API version and download the file.',
    seoTitle: 'Salesforce Package.xml Builder – Free Online', categories: ['admin'], icon: PackageOpen,
    from: 'Metadata types', to: 'package.xml', added: '2026-11-15', keywords: ['manifest', 'metadata', 'deploy', 'retrieve', 'sfdx', 'sf cli', 'generator'],
  }),
  t('apex-test-data-generator', {
    name: 'Apex Test Data Generator', short: 'Test Data Generator', emoji: '🧪', family: 'salesforce',
    tagline: 'Describe a record and get a test data factory or @TestSetup method in Apex.',
    description: 'Generate Apex test data code online: test data factory classes, @TestSetup methods and record lists for any standard or custom object.',
    seoTitle: 'Apex Test Data Generator – Free Online', categories: ['apex'], icon: FlaskConical,
    from: 'Fields and values', to: 'Apex test code', added: '2026-11-15', keywords: ['test class', 'factory', 'testsetup', 'unit test', 'records', 'insert'],
  }),
  t('curl-to-apex', {
    name: 'cURL to Apex Callout Converter', short: 'cURL to Apex', emoji: '📡', family: 'salesforce',
    tagline: 'Paste a cURL command from any API’s docs and get a working Apex HTTP callout, mock and test.',
    description: 'Convert cURL commands to Apex HttpRequest callouts online, with Named Credential support, an HttpCalloutMock and a test class. Runs in your browser.',
    seoTitle: 'cURL to Apex Callout Converter – Free Online', categories: ['apex', 'api'], icon: Webhook,
    from: 'cURL command', to: 'Apex callout', added: '2026-11-16', keywords: ['httprequest', 'http callout', 'rest api', 'named credential', 'mock', 'integration', 'curl'],
  }),
  t('json-formatter', {
    name: 'JSON Formatter & Validator', short: 'JSON Formatter', emoji: '🧾', family: 'developer',
    tagline: 'Pretty-print, minify, sort and validate JSON, keeping every number exactly as written.',
    description: 'Format, validate and minify JSON online. Exact line and column errors, sorted keys, big-number safety and an Apex string option. Free and private.',
    seoTitle: 'JSON Formatter & Validator – Free Online', categories: ['developer', 'api'], icon: Braces,
    from: 'Messy JSON', to: 'Clean JSON', added: '2026-11-16', keywords: ['beautify', 'pretty print', 'lint', 'validate', 'minify', 'json viewer'],
  }),
  t('jwt-decoder', {
    name: 'JWT Decoder', short: 'JWT Decoder', emoji: '🔑', family: 'developer',
    tagline: 'Decode a JSON Web Token’s header and claims, check expiry and verify HMAC signatures.',
    description: 'Decode JSON Web Tokens online: read the header and claims, see expiry in plain dates and verify HS256 signatures. Tokens never leave your browser.',
    seoTitle: 'JWT Decoder & Verifier – Free and Private', categories: ['encoding', 'api'], icon: KeyRound,
    from: 'JWT', to: 'Header and claims', added: '2026-11-16', keywords: ['json web token', 'bearer', 'oauth', 'claims', 'hs256', 'jwt bearer flow'],
  }),
  t('regex-tester', {
    name: 'Regex Tester', short: 'Regex Tester', emoji: '🎯', family: 'developer',
    tagline: 'Test a regular expression live, see every match and group, and copy it as Apex.',
    description: 'Test regular expressions online with live match highlighting, capture groups and replace preview, then copy the pattern as Apex Pattern code.',
    seoTitle: 'Regex Tester with Apex Output – Free Online', categories: ['developer'], icon: Regex,
    from: 'Pattern and text', to: 'Matches', added: '2026-11-16', keywords: ['regular expression', 'regexp', 'pattern', 'matcher', 'validation', 'replace'],
  }),
  t('base64-encoder-decoder', {
    name: 'Base64 Encoder & Decoder', short: 'Base64', emoji: '🔤', family: 'developer',
    tagline: 'Encode text or files to Base64 and decode it back, including URL-safe Base64.',
    description: 'Encode and decode Base64 online with full UTF-8 support, URL-safe Base64, files and clear errors. Matches Apex EncodingUtil. Nothing is uploaded.',
    seoTitle: 'Base64 Encoder & Decoder – Free Online', categories: ['encoding'], icon: Binary,
    from: 'Text or file', to: 'Base64', added: '2026-11-16', keywords: ['base64url', 'encode', 'decode', 'encodingutil', 'blob', 'data uri'],
  }),
  t('sql-formatter', {
    name: 'SQL Formatter', short: 'SQL Formatter', emoji: '🗄️', family: 'developer',
    tagline: 'Format SQL for PostgreSQL, MySQL, SQL Server, Oracle and SQLite into readable queries.',
    description: 'Format and beautify SQL online for PostgreSQL, MySQL, SQL Server, Oracle and SQLite. Keyword case, indentation and clear errors. Free and private.',
    seoTitle: 'SQL Formatter – Beautify SQL Online for Free', categories: ['soql', 'developer'], icon: Table2,
    from: 'One-line SQL', to: 'Formatted SQL', added: '2026-11-16', keywords: ['beautify', 'pretty print', 'postgres', 'mysql', 'tsql', 'oracle', 'sqlite'],
  }),
  t('xml-formatter', {
    name: 'XML Formatter & Validator', short: 'XML Formatter', emoji: '🏷️', family: 'developer',
    tagline: 'Pretty-print or minify XML and find well-formedness errors with exact positions.',
    description: 'Format, validate and minify XML online, including Salesforce metadata files. Finds unclosed tags and bad entities with exact line numbers.',
    seoTitle: 'XML Formatter & Validator – Free Online', categories: ['developer'], icon: FileCode2,
    from: 'Messy XML', to: 'Clean XML', added: '2026-11-16', keywords: ['beautify', 'pretty print', 'lint', 'well-formed', 'metadata', 'minify'],
  }),
  t('url-encoder-decoder', {
    name: 'URL Encoder & Decoder', short: 'URL Encoder', emoji: '🔗', family: 'developer',
    tagline: 'Percent-encode or decode text and URLs, and break any URL into its parts and parameters.',
    description: 'URL encode and decode online in component, full-URL or form mode (like Apex EncodingUtil.urlEncode), and inspect query parameters. Free and private.',
    seoTitle: 'URL Encoder & Decoder – Free Online', categories: ['encoding', 'api'], icon: Link2,
    from: 'Text or URL', to: 'Encoded text', added: '2026-11-16', keywords: ['percent encoding', 'urlencode', 'query string', 'encodeuricomponent', 'parameters'],
  }),
  t('timestamp-converter', {
    name: 'Unix Timestamp Converter', short: 'Timestamp Converter', emoji: '⏱️', family: 'developer',
    tagline: 'Turn Unix timestamps and ISO dates into readable dates, SOQL literals and Apex code.',
    description: 'Convert Unix timestamps to dates and back, with SOQL DateTime literals and Apex DateTime code. Seconds, milliseconds and ISO 8601 supported.',
    seoTitle: 'Unix Timestamp Converter with SOQL & Apex', categories: ['developer', 'admin'], icon: Clock4,
    from: 'Timestamp', to: 'Readable date', added: '2026-11-16', keywords: ['epoch', 'unix time', 'datetime', 'iso 8601', 'soql date', 'milliseconds'],
  }),
];

export const toolBySlug = (slug: string) => TOOLS.find((x) => x.slug === slug)!;
export const toolsInCategory = (id: CategoryId) => TOOLS.filter((x) => x.categories.includes(id));
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
export const toolsInFamily = (f: Family) => TOOLS.filter((x) => x.family === f);

/** The newest release date; tools added on it are shown with a "New" sticker. */
export const LATEST_ADDED = TOOLS.reduce((max, x) => (x.added > max ? x.added : max), '');
export const isNew = (tool: ToolMeta) => tool.added === LATEST_ADDED;

export const FAMILIES: Record<Family, { name: string; emoji: string; blurb: string }> = {
  salesforce: { name: 'Salesforce tools', emoji: '⚡', blurb: 'Built for Apex, SOQL, metadata and record IDs.' },
  developer: { name: 'Developer tools', emoji: '🧰', blurb: 'Everyday formatters, decoders and testers — with Salesforce extras.' },
};

/** Ideas being considered. Shown as "planned" — none of these exist yet. */
export const PLANNED_TOOLS = [
  'Apex code formatter',
  'Salesforce cron expression builder',
  'Formula builder',
  'Flow formula helper',
  'Permission set analyzer',
  'LWC helpers',
  'Metadata comparison',
  'In-browser AI code explainer',
];
