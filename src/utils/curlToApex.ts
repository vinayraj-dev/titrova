import { apexString, isReservedWord } from './apex';
import { ToolError } from './errors';

/** Splits a shell command the way bash would: quotes, escapes and line continuations. */
export function shellSplit(command: string): string[] {
  const src = command.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ');
  const out: string[] = [];
  let cur = '';
  let has = false;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = '';
      has = false;
      i++;
    } else if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw new ToolError('A single quote (\') is never closed.');
      cur += src.slice(i + 1, end);
      has = true;
      i = end + 1;
    } else if (c === '"') {
      let j = i + 1;
      for (;;) {
        if (j >= src.length) throw new ToolError('A double quote (") is never closed.');
        if (src[j] === '\\' && '"\\$`'.includes(src[j + 1] ?? '')) {
          cur += src[j + 1];
          j += 2;
        } else if (src[j] === '"') break;
        else cur += src[j++];
      }
      has = true;
      i = j + 1;
    } else if (c === '\\') {
      cur += src[i + 1] ?? '';
      has = true;
      i += 2;
    } else {
      cur += c;
      has = true;
      i++;
    }
  }
  if (has) out.push(cur);
  return out;
}

export interface CurlRequest {
  url: string;
  method: string;
  headers: [string, string][];
  body: string | null;
  timeoutMs: number | null;
  warnings: string[];
}

const VALUE_SHORT = new Set(['X', 'H', 'd', 'u', 'A', 'b', 'e', 'F', 'o', 'm', 'T', 'w', 'x', 'r']);
const VALUE_LONG = new Set([
  'request', 'header', 'data', 'data-raw', 'data-binary', 'data-ascii', 'data-urlencode', 'json', 'user', 'user-agent', 'cookie',
  'referer', 'form', 'form-string', 'url', 'max-time', 'connect-timeout', 'output', 'proxy', 'upload-file', 'write-out', 'cert',
  'key', 'cacert', 'oauth2-bearer', 'range', 'retry',
]);
const SHORT_TO_LONG: Record<string, string> = {
  X: 'request', H: 'header', d: 'data', u: 'user', A: 'user-agent', b: 'cookie', e: 'referer', F: 'form', m: 'max-time',
  I: 'head', G: 'get', k: 'insecure', L: 'location', s: 'silent', S: 'show-error', i: 'include', v: 'verbose', o: 'output', T: 'upload-file',
};
const MANAGED_HEADERS = new Set(['host', 'content-length', 'connection', 'accept-encoding', 'transfer-encoding']);

export function parseCurl(command: string): CurlRequest {
  if (!command.trim()) throw new ToolError('Please enter some input before generating output.');
  const tokens = shellSplit(command.trim());
  if (!/^curl(\.exe)?$/i.test(tokens[0] ?? '')) throw new ToolError('Paste a command that starts with “curl”, for example copied from API documentation or your browser’s developer tools.');
  const opts: [string, string | true][] = [];
  const urls: string[] = [];
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.startsWith('--') && tok.length > 2) {
      const eq = tok.indexOf('=');
      const name = (eq > 0 ? tok.slice(2, eq) : tok.slice(2)).toLowerCase();
      if (VALUE_LONG.has(name)) {
        const value = eq > 0 ? tok.slice(eq + 1) : tokens[++i];
        if (value === undefined) throw new ToolError(`The option --${name} needs a value after it.`);
        opts.push([name, value]);
      } else opts.push([name, true]);
    } else if (tok.startsWith('-') && tok.length > 1) {
      for (let k = 1; k < tok.length; k++) {
        const f = tok[k];
        if (VALUE_SHORT.has(f)) {
          const rest = tok.slice(k + 1);
          const value = rest || tokens[++i];
          if (value === undefined) throw new ToolError(`The option -${f} needs a value after it.`);
          opts.push([SHORT_TO_LONG[f] ?? f, value]);
          break;
        }
        opts.push([SHORT_TO_LONG[f] ?? f, true]);
      }
    } else urls.push(tok);
  }

  const warnings = new Set<string>();
  const headers: [string, string][] = [];
  const data: string[] = [];
  let method: string | null = null;
  let head = false;
  let get = false;
  let timeoutMs: number | null = null;
  const ignored = new Set<string>();

  for (const [name, value] of opts) {
    const v = typeof value === 'string' ? value : '';
    switch (name) {
      case 'url': urls.push(v); break;
      case 'request': method = v.toUpperCase(); break;
      case 'header': {
        const c = v.indexOf(':');
        if (c <= 0) { warnings.add(`The header “${v}” has no “name: value” form and was skipped.`); break; }
        const hn = v.slice(0, c).trim();
        const hv = v.slice(c + 1).trim();
        if (MANAGED_HEADERS.has(hn.toLowerCase())) warnings.add(`The ${hn} header was left out because Salesforce sets it for you.`);
        else headers.push([hn, hv]);
        break;
      }
      case 'data': case 'data-raw': case 'data-binary': case 'data-ascii':
        if (v.startsWith('@') && name !== 'data-raw') warnings.add(`The body is read from the file “${v.slice(1)}”. Replace the placeholder with that file’s content.`);
        data.push(v.startsWith('@') && name !== 'data-raw' ? `<contents of ${v.slice(1)}>` : v);
        break;
      case 'data-urlencode': {
        const eq = v.indexOf('=');
        data.push(eq > 0 ? `${v.slice(0, eq)}=${encodeURIComponent(v.slice(eq + 1))}` : encodeURIComponent(v.replace(/^=/, '')));
        break;
      }
      case 'json':
        data.push(v);
        if (!headers.some(([h]) => h.toLowerCase() === 'content-type')) headers.push(['Content-Type', 'application/json']);
        if (!headers.some(([h]) => h.toLowerCase() === 'accept')) headers.push(['Accept', 'application/json']);
        break;
      case 'user':
        headers.push(['Authorization', `Basic ${btoa(v)}`]);
        warnings.add('The command contains a username and password (-u). They were turned into a Basic Authorization header. Move them into a Named Credential instead of keeping them in code.');
        break;
      case 'oauth2-bearer': headers.push(['Authorization', `Bearer ${v}`]); break;
      case 'user-agent': headers.push(['User-Agent', v]); break;
      case 'cookie': headers.push(['Cookie', v]); break;
      case 'referer': headers.push(['Referer', v]); break;
      case 'max-time': {
        const s = Number(v);
        if (Number.isFinite(s) && s > 0) {
          timeoutMs = Math.min(Math.round(s * 1000), 120000);
          if (s > 120) warnings.add('Apex callouts can wait at most 120 seconds, so the timeout was capped at 120000 ms.');
        }
        break;
      }
      case 'head': head = true; break;
      case 'get': get = true; break;
      case 'form': case 'form-string':
        throw new ToolError('Multipart form uploads (-F) cannot be converted automatically. Apex needs the multipart body built by hand as a Blob.');
      case 'upload-file': warnings.add('-T uploads a file. Apex has no file system; build the body from a Blob or ContentVersion instead.'); break;
      case 'insecure': warnings.add('-k (skip certificate checks) has no Apex equivalent. Salesforce always validates certificates.'); break;
      case 'proxy': warnings.add('Proxies (-x) cannot be set from Apex and were ignored.'); break;
      default: ignored.add(name);
    }
  }
  if (!urls.length) throw new ToolError('No URL was found in the command.');
  if (urls.length > 1) warnings.add(`The command has ${urls.length} URLs. Only the first one, ${urls[0]}, was used.`);
  let url = urls[0];
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    url = 'https://' + url;
    warnings.add('The URL had no scheme, so https:// was added.');
  }
  try {
    new URL(url);
  } catch {
    throw new ToolError(`“${urls[0]}” is not a valid URL.`);
  }
  let body: string | null = data.length ? data.join('&') : null;
  if (get && body) {
    url += (url.includes('?') ? '&' : '?') + body;
    body = null;
  }
  const finalMethod = head ? 'HEAD' : method ?? (body ? 'POST' : 'GET');
  if (body && !headers.some(([h]) => h.toLowerCase() === 'content-type') && !data.some((d) => /^\s*[[{]/.test(d)))
    headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
  const shown = [...ignored].filter((x) => !['silent', 'show-error', 'compressed', 'location', 'include', 'verbose', 'fail'].includes(x));
  if (shown.length) warnings.add(`These options do not apply to Apex and were ignored: ${shown.map((x) => (x.length === 1 ? '-' : '--') + x).join(', ')}.`);
  return { url, method: finalMethod, headers, body, timeoutMs, warnings: [...warnings] };
}

export interface CurlToApexOptions {
  namedCredential?: string;
  wrapInClass?: boolean;
  className?: string;
  includeMock?: boolean;
}

export function defaultClassName(url: string): string {
  const host = new URL(url).hostname.split('.').filter((p) => !/^(www|api|com|net|org|io|dev|co|app|in|uk)$/i.test(p));
  const base = (host[host.length - 1] ?? 'Api').replace(/[^A-Za-z0-9]/g, '');
  let name = base.charAt(0).toUpperCase() + base.slice(1) + 'Callout';
  if (!/^[A-Za-z]/.test(name)) name = 'Api' + name;
  return name.slice(0, 40);
}

export function curlToApex(command: string, options: CurlToApexOptions = {}): { code: string; className: string; warnings: string[] } {
  const req = parseCurl(command);
  const warnings = [...req.warnings];
  const nc = options.namedCredential?.trim();
  if (nc && !/^[A-Za-z][A-Za-z0-9_]*$/.test(nc)) throw new ToolError('A Named Credential name can contain only letters, numbers and underscores.');
  const className = (options.className?.trim() || defaultClassName(req.url)).slice(0, 40);
  if (options.wrapInClass && (!/^[A-Za-z][A-Za-z0-9_]*$/.test(className) || isReservedWord(className)))
    throw new ToolError('The class name must start with a letter and contain only letters, numbers and underscores.');

  const u = new URL(req.url);
  let endpoint = req.url;
  let headers = req.headers;
  if (nc) {
    endpoint = `callout:${nc}${u.pathname === '/' ? '' : u.pathname}${u.search}`;
    if (headers.some(([h]) => h.toLowerCase() === 'authorization')) {
      headers = headers.filter(([h]) => h.toLowerCase() !== 'authorization');
      warnings.unshift('The Authorization header was removed because the Named Credential will add it.');
    }
  } else {
    warnings.push(`Before this runs, allow ${u.origin} in Setup → Remote Site Settings, or use a Named Credential (recommended).`);
    if (headers.some(([h]) => h.toLowerCase() === 'authorization')) warnings.unshift('The generated code contains a secret in the Authorization header. Do not commit it; use a Named Credential instead.');
  }

  const I = options.wrapInClass ? '        ' : '';
  const lines: string[] = [
    `${I}HttpRequest req = new HttpRequest();`,
    `${I}req.setEndpoint(${apexString(endpoint)});`,
    `${I}req.setMethod(${apexString(req.method)});`,
    ...headers.map(([h, v]) => `${I}req.setHeader(${apexString(h)}, ${apexString(v)});`),
    ...(req.body !== null ? [`${I}req.setBody(${apexString(req.body)});`] : []),
    ...(req.timeoutMs ? [`${I}req.setTimeout(${req.timeoutMs});`] : []),
    '',
    `${I}HttpResponse res = new Http().send(req);`,
  ];
  let code: string;
  if (options.wrapInClass) {
    code = [
      `public with sharing class ${className} {`,
      '    public static HttpResponse send() {',
      ...lines,
      '        if (res.getStatusCode() < 200 || res.getStatusCode() > 299) {',
      "            throw new CalloutException('Callout failed: ' + res.getStatusCode() + ' ' + res.getStatus());",
      '        }',
      '        return res;',
      '    }',
      '}',
    ].join('\n');
  } else {
    code = [
      ...lines,
      'if (res.getStatusCode() >= 200 && res.getStatusCode() < 300) {',
      '    System.debug(res.getBody());',
      '} else {',
      "    System.debug('Callout failed: ' + res.getStatusCode() + ' ' + res.getStatus());",
      '}',
    ].join('\n');
  }
  if (options.includeMock) {
    const json = headers.some(([h, v]) => /^(accept|content-type)$/i.test(h) && /json/i.test(v));
    code += [
      '',
      '',
      '@IsTest',
      `public class ${className}Mock implements HttpCalloutMock {`,
      '    public HttpResponse respond(HttpRequest req) {',
      '        HttpResponse res = new HttpResponse();',
      `        res.setHeader('Content-Type', ${apexString(json ? 'application/json' : 'text/plain')});`,
      `        res.setBody(${apexString(json ? '{"success":true}' : 'OK')});`,
      '        res.setStatusCode(200);',
      '        return res;',
      '    }',
      '}',
      ...(options.wrapInClass
        ? [
            '',
            '@IsTest',
            `private class ${className}Test {`,
            '    @IsTest',
            '    static void returnsSuccess() {',
            `        Test.setMock(HttpCalloutMock.class, new ${className}Mock());`,
            '        Test.startTest();',
            `        HttpResponse res = ${className}.send();`,
            '        Test.stopTest();',
            '        Assert.areEqual(200, res.getStatusCode());',
            '    }',
            '}',
          ]
        : []),
    ].join('\n');
  }
  return { code: code + '\n', className, warnings };
}
