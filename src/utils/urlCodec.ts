import { ToolError } from './errors';

/** component: encodeURIComponent. uri: encodeURI (keeps :/?#&=). form: application/x-www-form-urlencoded, as Apex EncodingUtil.urlEncode. */
export type UrlMode = 'component' | 'uri' | 'form';

export function urlEncode(text: string, mode: UrlMode): string {
  if (mode === 'uri') return encodeURI(text);
  if (mode === 'form') return new URLSearchParams([['x', text]]).toString().slice(2);
  return encodeURIComponent(text);
}

export function urlDecode(text: string, mode: UrlMode): string {
  const src = mode === 'form' ? text.replace(/\+/g, ' ') : text;
  try {
    return mode === 'uri' ? decodeURI(src) : decodeURIComponent(src);
  } catch {
    const bad = /%(?![0-9a-fA-F]{2})|(?:%[0-9a-fA-F]{2})+/g;
    let m: RegExpExecArray | null;
    while ((m = bad.exec(src))) {
      try {
        decodeURIComponent(m[0]);
      } catch {
        throw new ToolError(`The sequence “${m[0].slice(0, 12)}” at character ${m.index + 1} is not valid percent-encoding. Each “%” must be followed by two hexadecimal digits that form valid UTF-8.`);
      }
    }
    throw new ToolError('This text contains invalid percent-encoding.');
  }
}

export interface ParsedUrl {
  parts: [string, string][];
  params: [string, string][];
}

export function parseUrl(text: string): ParsedUrl {
  let u: URL;
  try {
    u = new URL(text.trim());
  } catch {
    throw new ToolError('This is not a complete URL. It should start with a scheme such as https://.');
  }
  const parts: [string, string][] = [
    ['Scheme', u.protocol.replace(':', '')],
    ['Host', u.hostname],
    ...(u.port ? [['Port', u.port] as [string, string]] : []),
    ['Path', decodeURIComponent(u.pathname)],
    ...(u.hash ? [['Fragment', u.hash.slice(1)] as [string, string]] : []),
  ];
  return { parts, params: [...u.searchParams.entries()] };
}
