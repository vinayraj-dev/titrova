import type { ToolContent } from '@/data/content';

export const EXAMPLES: { label: string; cmd: string }[] = [
  {
    label: 'POST with JSON',
    cmd: `curl -X POST 'https://api.example.com/v1/orders' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -d '{"customerId": "C-1042", "items": [{"sku": "LAB-01", "qty": 2}]}' \\
  --max-time 20`,
  },
  { label: 'Simple GET', cmd: `curl 'https://api.example.com/v1/orders?status=open&limit=50' -H 'Accept: application/json'` },
  { label: 'Form post', cmd: `curl https://api.example.com/oauth/token -d grant_type=client_credentials -d scope=read` },
  { label: 'Basic auth', cmd: `curl -u apiuser:secret https://api.example.com/v1/me` },
];

export const content: ToolContent = {
  steps: [
    'Copy a cURL command from the API’s documentation, Postman (Code → cURL) or your browser’s developer tools (Copy as cURL).',
    'Paste it into the input. The Apex appears as you type.',
    'Optionally enter a Named Credential name, wrap the code in a class, and add an `HttpCalloutMock` with a test.',
    'Copy the code or download it as a `.cls` file.',
  ],
  features: [
    'Understands `-X`, `-H`, `-d`, `--data-raw`, `--data-urlencode`, `--json`, `-u`, `-G`, `-I`, `--max-time` and more.',
    'Reads shell quoting like bash does, including line continuations and escaped quotes.',
    'Named Credential mode rewrites the endpoint to `callout:Name/...` and removes the hard-coded Authorization header.',
    'Optional wrapper class with status-code checking, plus an `HttpCalloutMock` and a ready-to-run test.',
    'Warns about secrets in the command, Remote Site Settings, headers Salesforce manages and the 120-second timeout limit.',
  ],
  limitations: [
    'Multipart form uploads (`-F`) are not converted; Apex needs the multipart body built by hand.',
    'Options that only affect curl itself, such as `-k`, `-x` or `-o`, have no Apex equivalent and are reported.',
    'It does not run the callout or check the endpoint, and the mock returns a simple placeholder body.',
    'Bodies read from files (`-d @file.json`) become a placeholder you must replace.',
  ],
  article: [
    { h: 'Why convert cURL to Apex?' },
    { p: 'Almost every REST API documents its endpoints as cURL commands. Turning one into Apex means rewriting the URL, method, every header and the body as `HttpRequest` calls, escaping quotes for Apex strings along the way. It is tedious and easy to get subtly wrong, especially with JSON bodies full of quotes.' },
    { h: 'Example' },
    { code: `curl -X POST https://api.example.com/v1/orders \\\n  -H 'Content-Type: application/json' \\\n  -d '{"customerId":"C-1042"}'`, lang: 'text', label: 'cURL' },
    { code: `HttpRequest req = new HttpRequest();\nreq.setEndpoint('https://api.example.com/v1/orders');\nreq.setMethod('POST');\nreq.setHeader('Content-Type', 'application/json');\nreq.setBody('{"customerId":"C-1042"}');\n\nHttpResponse res = new Http().send(req);`, lang: 'apex' },
    { h: 'Use a Named Credential, not a hard-coded URL' },
    { p: 'A Named Credential stores the endpoint and the authentication in Setup, so no secret lives in your code and admins can point the same code at a sandbox or production API. Your endpoint becomes `callout:Orders_API/v1/orders`, and Salesforce adds the Authorization header for you. Enter the Named Credential’s API name in the tool to generate code in this style.' },
    { p: 'Without a Named Credential, Salesforce blocks the callout until the domain is added under Setup → Remote Site Settings.' },
    { h: 'Testing callouts' },
    { p: 'Apex tests cannot make real HTTP requests. Instead, you register a class that implements `HttpCalloutMock`, and Salesforce returns its response whenever your code calls `Http.send`. Turn on “Add mock and test” to generate both the mock and a test method that uses it.' },
    { h: 'Limits worth knowing' },
    { ul: [
      'A single transaction can make up to 100 callouts.',
      'The default timeout is 10 seconds; the maximum, per callout and in total for a transaction, is 120 seconds.',
      'You cannot make a callout after DML in the same transaction unless the DML happens in a separate transaction, for example in a Queueable.',
      'Callouts from triggers must run asynchronously, for example with `@future(callout=true)` or a Queueable that implements `Database.AllowsCallouts`.',
    ] },
  ],
  faqs: [
    { q: 'Is my command or token sent anywhere?', a: 'No. The command is parsed in your browser and nothing is uploaded. Still, treat generated code that contains a token as a secret, and prefer a Named Credential.' },
    { q: 'Where do I find a cURL command?', a: 'Most API documentation shows one. In Postman, open the Code panel and choose cURL. In Chrome or Edge developer tools, right-click a request in the Network tab and choose Copy → Copy as cURL (bash).' },
    { q: 'Why does it add a Remote Site Settings warning?', a: 'Salesforce blocks callouts to any domain that is not allowed by a Remote Site Setting or covered by a Named Credential. The warning reminds you to add one before testing.' },
    { q: 'Can it convert Windows cmd commands?', a: 'Commands copied for bash work best. Line continuations with `^` are understood, but Windows-style double quoting with doubled quotes may need adjusting.' },
    { q: 'Does the generated class handle errors?', a: 'When you wrap the code in a class, it throws a `CalloutException` for any status outside 200–299, so callers can catch failures in one place.' },
  ],
};
