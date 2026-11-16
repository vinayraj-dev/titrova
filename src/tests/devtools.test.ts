// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64, toHex } from '@/utils/base64';
import { curlToApex, parseCurl, shellSplit } from '@/utils/curlToApex';
import { formatJson } from '@/utils/jsonFormat';
import { decodeJwt, jwtTimeStatus, verifyHmac } from '@/utils/jwt';
import { runRegex, toApexPattern } from '@/utils/regex';
import { formatSql } from '@/utils/sqlFormat';
import { parseTimestamp, relativeTime } from '@/utils/timestamp';
import { parseUrl, urlDecode, urlEncode } from '@/utils/urlCodec';
import { formatXml } from '@/utils/xmlFormat';

describe('JSON formatter', () => {
  it('formats, minifies, sorts and keeps numbers exactly as written', () => {
    const src = '{"b":1.0,"a":[1,{"z":null,"y":true}],"big":12345678901234567890}';
    expect(formatJson(src).output).toBe('{\n  "b": 1.0,\n  "a": [\n    1,\n    {\n      "z": null,\n      "y": true\n    }\n  ],\n  "big": 12345678901234567890\n}');
    expect(formatJson(src, { mode: 'minify', sortKeys: true }).output).toBe('{"a":[1,{"y":true,"z":null}],"b":1.0,"big":12345678901234567890}');
    expect(formatJson('[]', { indent: 'tab' }).output).toBe('[]');
    expect(formatJson('{"a":[1]}', { indent: 'tab' }).output).toBe('{\n\t"a": [\n\t\t1\n\t]\n}');
    const r = formatJson(src);
    expect(r.stats).toMatchObject({ objects: 2, arrays: 1, keys: 5, depth: 3 });
    expect(r.warnings.join(' ')).toMatch(/larger than JavaScript can store exactly/);
  });
  it('warns about duplicate keys and builds an Apex string', () => {
    expect(formatJson('{"a":1,"a":2}').warnings[0]).toMatch(/appears more than once/);
    expect(formatJson(`{"msg":"it's"}`, { mode: 'apex' }).output).toBe(`String jsonBody = '{"msg":"it\\'s"}';`);
  });
  it('reports errors with a position', () => {
    expect(() => formatJson('{"a": tru}')).toThrow(/line 1, column 7/);
    expect(() => formatJson(' ')).toThrow('Please enter some input');
  });
});

describe('XML formatter', () => {
  const src = '<?xml version="1.0"?><Package xmlns="http://soap.sforce.com/2006/04/metadata"><types><members>*</members><name>ApexClass</name></types><!-- note --><empty></empty><br/><data><![CDATA[a < b]]></data><version>62.0</version></Package>';
  it('pretty-prints and minifies', () => {
    expect(formatXml(src).output).toBe(
      [
        '<?xml version="1.0"?>',
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
        '    <types>',
        '        <members>*</members>',
        '        <name>ApexClass</name>',
        '    </types>',
        '    <!-- note -->',
        '    <empty></empty>',
        '    <br />',
        '    <data><![CDATA[a < b]]></data>',
        '    <version>62.0</version>',
        '</Package>',
      ].join('\n'),
    );
    const pretty = formatXml(src, { indent: 2 }).output;
    expect(formatXml(pretty, { mode: 'minify' }).output).toBe(src.replace('<br/>', '<br/>'));
    expect(formatXml(src).stats).toMatchObject({ elements: 8, attributes: 1, depth: 3 });
  });
  it.each([
    ['<a><b></a>', /does not match <b>/],
    ['<a></a><b/>', /only have one root/],
    ['<a x=1/>', /must be in quotes/],
    ['<a x="1" x="2"/>', /attribute “x” twice/],
    ['<a>Tom & Jerry</a>', /must be written as &amp;/],
    ['<a>', /never closed/],
    ['hello', /outside the root/],
    ['<a/><?xml version="1.0"?>', /very first thing/],
    ['</a>', /no matching opening tag/],
    ['<!-- only a comment -->', /No root element/],
  ])('rejects %s', (input, pattern) => {
    expect(() => formatXml(input)).toThrow(pattern);
  });
  it('gives line and column for errors', () => {
    expect(() => formatXml('<a>\n  <b>\n</a>')).toThrow(/line 3, column 1.*opened on line 2/);
  });
});

describe('SQL formatter', () => {
  it('formats in several dialects', () => {
    expect(formatSql('select a, b from t where x = 1')).toBe('SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  x = 1');
    expect(formatSql('SELECT TOP 5 [Name] FROM dbo.Users', { dialect: 'transactsql', keywordCase: 'lower', indent: 4 })).toContain('top 5');
    expect(formatSql('select `a` from t limit 1', { dialect: 'mysql' })).toContain('`a`');
  });
  it('explains parse errors', () => {
    expect(() => formatSql('select (a from t')).toThrow(/Line 1, column \d+: the query ends too early/);
    expect(() => formatSql('')).toThrow('Please enter some input');
  });
});

describe('JWT decoder', () => {
  const JWT_IO = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  it('decodes header, payload and time claims', () => {
    const d = decodeJwt('Bearer ' + JWT_IO);
    expect(d.alg).toBe('HS256');
    expect(d.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    expect(d.claims.find((c) => c.key === 'iat')).toMatchObject({ label: 'Issued at', value: '2018-01-18T01:30:22Z (1516239022)' });
  });
  it('verifies HMAC signatures with the right secret only', async () => {
    expect(await verifyHmac(JWT_IO, 'your-256-bit-secret')).toBe(true);
    expect(await verifyHmac(JWT_IO, 'wrong-secret')).toBe(false);
    const h = Buffer.from('{"alg":"HS512"}').toString('base64url');
    const p = Buffer.from('{"exp":1}').toString('base64url');
    const sig = createHmac('sha512', 'k').update(`${h}.${p}`).digest('base64url');
    expect(await verifyHmac(`${h}.${p}.${sig}`, 'k')).toBe(true);
  });
  it('reports time status and malformed tokens', () => {
    expect(jwtTimeStatus({ exp: 100 }, 200_000).state).toBe('expired');
    expect(jwtTimeStatus({ exp: 300 }, 200_000).state).toBe('valid');
    expect(jwtTimeStatus({ nbf: 300 }, 200_000).state).toBe('not-yet');
    expect(jwtTimeStatus({}, 0).state).toBe('no-expiry');
    expect(() => decodeJwt('a.b')).toThrow(/three parts/);
    expect(() => decodeJwt('a.b.c.d.e')).toThrow(/encrypted JWT/);
    expect(() => decodeJwt('abc!.e30.x')).toThrow(/not valid Base64URL/);
    expect(() => decodeJwt('bm90IGpzb24.e30.x')).toThrow(/does not contain a JSON object/);
    expect(decodeJwt('eyJhbGciOiJub25lIn0.e30.').warnings[0]).toMatch(/not signed/);
  });
});

describe('Base64', () => {
  it('encodes and decodes UTF-8 text in both alphabets', () => {
    expect(encodeBase64('Héllo, Titrova ✓')).toBe('SMOpbGxvLCBUaXRyb3ZhIOKckw==');
    expect(decodeBase64('SMOpbGxvLCBUaXRyb3ZhIOKckw==').text).toBe('Héllo, Titrova ✓');
    expect(decodeBase64('SMOpbGxv\nLCBUaXRyb3ZhIOKckw').text).toBe('Héllo, Titrova ✓');
    expect(decodeBase64('data:text/plain;base64,SGk=').text).toBe('Hi');
    const bin = decodeBase64('-__-');
    expect([bin.variant, bin.text, toHex(bin.bytes)]).toEqual(['url-safe', null, 'fb ff fe']);
    expect(encodeBase64('\u00fb\u00ff')).not.toBe('');
  });
  it.each([
    ['SGk*', /“\*” at position 4/],
    ['ab+_', /mixes standard/],
    ['S=Gk', /only appear at the very end/],
    ['SGkxS', /length is not valid/],
  ])('rejects %s', (input, pattern) => {
    expect(() => decodeBase64(input)).toThrow(pattern);
  });
});

describe('URL encoder', () => {
  it('encodes in three modes, matching Apex EncodingUtil for form mode', () => {
    const s = 'a b&c=d/é*~';
    expect(urlEncode(s, 'component')).toBe('a%20b%26c%3Dd%2F%C3%A9*~');
    expect(urlEncode(s, 'form')).toBe('a+b%26c%3Dd%2F%C3%A9*%7E');
    expect(urlEncode('https://x.io/a b?q=1&r=é', 'uri')).toBe('https://x.io/a%20b?q=1&r=%C3%A9');
    expect(urlDecode('a+b%26c', 'form')).toBe('a b&c');
    expect(urlDecode('a+b%26c', 'component')).toBe('a+b&c');
    expect(() => urlDecode('100%', 'component')).toThrow(/“%” at character 4|sequence “%”/);
    expect(() => urlDecode('%E0%A4%A', 'component')).toThrow(/not valid percent-encoding/);
  });
  it('parses URLs into parts and parameters', () => {
    const p = parseUrl('https://example.com:8443/a%20b?x=1&y=%C3%A9&x=2#top');
    expect(p.parts).toContainEqual(['Port', '8443']);
    expect(p.parts).toContainEqual(['Path', '/a b']);
    expect(p.params).toEqual([['x', '1'], ['y', 'é'], ['x', '2']]);
    expect(() => parseUrl('example.com')).toThrow(/not a complete URL/);
  });
});

describe('Regex tester', () => {
  it('finds matches with numbered and named groups', () => {
    const r = runRegex('(?<y>\\d{4})-(\\d{2})', 'g', 'a 2026-11 b 2027-01', null, 100);
    expect(r.matches.map((m) => [m.index, m.text, m.groups, m.named])).toEqual([
      [2, '2026-11', ['2026', '11'], [['y', '2026']]],
      [12, '2027-01', ['2027', '01'], [['y', '2027']]],
    ]);
  });
  it('handles non-global, zero-length matches, limits, replacement and errors', () => {
    expect(runRegex('a', '', 'aaa', null, 10).matches).toHaveLength(1);
    expect(runRegex('x*', 'g', 'ab', null, 10).matches).toHaveLength(3);
    expect(runRegex('a', 'g', 'aaaa', null, 2)).toMatchObject({ truncated: true });
    expect(runRegex('(\\w+)@', 'g', 'me@x you@y', '[$1]', 10).replaced).toBe('[me]x [you]y');
    expect(runRegex('(', 'g', 'x', null, 10).error).toMatch(/Unterminated group/);
  });
  it('converts a pattern for Apex', () => {
    const { code, notes } = toApexPattern("\\d+'s", 'gi');
    expect(code).toContain("Pattern p = Pattern.compile('(?i)\\\\d+\\'s');");
    expect(notes).toEqual([]);
    expect(toApexPattern('(?<=a+)b', 'y').notes).toHaveLength(2);
  });
});

describe('cURL to Apex', () => {
  const cmd = `curl -X POST 'https://api.example.com/v1/orders?expand=lines' \\
  -H 'Content-Type: application/json' -H "Authorization: Bearer abc123" \\
  --data-raw '{"name":"O'\\''Brien"}' --compressed -m 30 -sL`;
  it('splits shell words like bash', () => {
    expect(shellSplit(`curl -H "a: \\"b\\"" 'c d' e\\ f`)).toEqual(['curl', '-H', 'a: "b"', 'c d', 'e f']);
    expect(() => shellSplit("curl 'oops")).toThrow(/never closed/);
  });
  it('parses methods, headers, bodies and options', () => {
    const r = parseCurl(cmd);
    expect(r).toMatchObject({ url: 'https://api.example.com/v1/orders?expand=lines', method: 'POST', body: `{"name":"O'Brien"}`, timeoutMs: 30000 });
    expect(r.headers).toEqual([['Content-Type', 'application/json'], ['Authorization', 'Bearer abc123']]);
    expect(parseCurl('curl -d a=1 -d b=2 example.com')).toMatchObject({ method: 'POST', body: 'a=1&b=2', url: 'https://example.com' });
    expect(parseCurl('curl -G -d q=x https://a.io/s').url).toBe('https://a.io/s?q=x');
    expect(parseCurl('curl -I https://a.io').method).toBe('HEAD');
    expect(parseCurl('curl -u me:pw https://a.io').headers[0]).toEqual(['Authorization', 'Basic bWU6cHc=']);
    expect(parseCurl(`curl --json '{"a":1}' https://a.io`)).toMatchObject({ method: 'POST', headers: [['Content-Type', 'application/json'], ['Accept', 'application/json']] });
    expect(() => parseCurl('wget https://a.io')).toThrow(/starts with “curl”/);
    expect(() => parseCurl('curl -F file=@a.png https://a.io')).toThrow(/Multipart/);
    expect(() => parseCurl('curl -X GET')).toThrow(/No URL/);
  });
  it('generates Apex, a Named Credential version, a class, a mock and a test', () => {
    const plain = curlToApex(cmd);
    expect(plain.code).toContain("req.setEndpoint('https://api.example.com/v1/orders?expand=lines');");
    expect(plain.code).toContain("req.setHeader('Authorization', 'Bearer abc123');");
    expect(plain.code).toContain(`req.setBody('{"name":"O\\'Brien"}');`);
    expect(plain.code).toContain('req.setTimeout(30000);');
    expect(plain.warnings.join(' ')).toMatch(/secret in the Authorization header[\s\S]*Remote Site Settings/);

    const full = curlToApex(cmd, { namedCredential: 'Orders_API', wrapInClass: true, includeMock: true });
    expect(full.className).toBe('ExampleCallout');
    expect(full.code).toContain("req.setEndpoint('callout:Orders_API/v1/orders?expand=lines');");
    expect(full.code).not.toContain('Authorization');
    expect(full.code).toContain('public with sharing class ExampleCallout {');
    expect(full.code).toContain('public class ExampleCalloutMock implements HttpCalloutMock {');
    expect(full.code).toContain('Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock());');
    expect(full.code.split('{').length).toBe(full.code.split('}').length);
    expect(() => curlToApex(cmd, { namedCredential: 'bad name' })).toThrow(/Named Credential/);
  });
});

describe('Timestamp converter', () => {
  const row = (r: ReturnType<typeof parseTimestamp>, label: string) => r.rows.find((x) => x.label === label)!.value;
  it('detects units and produces Salesforce formats', () => {
    for (const input of ['1794736800', '1794736800000', '1794736800000000', '2026-11-15T10:00:00Z', '2026-11-15T15:30:00+05:30', 'Sun, 15 Nov 2026 10:00:00 GMT']) {
      const r = parseTimestamp(input);
      expect(r.ms, input).toBe(1794736800000);
      expect(row(r, 'SOQL DateTime literal')).toBe('2026-11-15T10:00:00Z');
    }
    const r = parseTimestamp('1794736800');
    expect(r.detected).toBe('Unix time in seconds');
    expect(row(r, 'Apex DateTime (GMT)')).toBe('DateTime.newInstanceGmt(2026, 11, 15, 10, 0, 0)');
    expect(row(r, 'Apex from milliseconds')).toBe('DateTime.newInstance(1794736800000L)');
    expect(row(r, 'Day of the week (UTC)')).toBe('Sunday');
    expect(parseTimestamp('2026-11-15 10:00').warnings[0]).toMatch(/UTC was assumed/);
    expect(parseTimestamp('2026-11-15').detected).toMatch(/midnight UTC/);
    expect(parseTimestamp('-1').rows[0].value).toBe('1969-12-31T23:59:59.000Z');
  });
  it('rejects impossible dates and nonsense', () => {
    expect(() => parseTimestamp('2026-02-30')).toThrow(/not a real date/);
    expect(() => parseTimestamp('next tuesday')).toThrow(/Unix timestamp/);
    expect(() => parseTimestamp('12345678901234567890123')).toThrow(/too many digits/);
    expect(parseTimestamp('1600-01-01').warnings[0]).toMatch(/1700 and 4000/);
  });
  it('describes relative time', () => {
    expect(relativeTime(0, 3 * 86400_000)).toBe('3 days ago');
    expect(relativeTime(7200_000, 0)).toBe('in 2 hours');
    expect(relativeTime(1000, 1600)).toBe('now');
  });
});
