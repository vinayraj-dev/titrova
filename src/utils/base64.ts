import { ToolError } from './errors';

export interface Base64Options {
  urlSafe?: boolean;
  padding?: boolean;
}

export function bytesToBase64(bytes: Uint8Array, { urlSafe = false, padding = true }: Base64Options = {}): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  let out = btoa(bin);
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
  if (!padding) out = out.replace(/=+$/, '');
  return out;
}

export const encodeBase64 = (text: string, options?: Base64Options) => bytesToBase64(new TextEncoder().encode(text), options);

export interface Base64Decoded {
  bytes: Uint8Array;
  /** Null when the bytes are not valid UTF-8 text (an image, a zip file and so on). */
  text: string | null;
  variant: 'standard' | 'url-safe';
}

export function decodeBase64(input: string): Base64Decoded {
  let s = input.trim();
  if (!s) throw new ToolError('Please enter some input before generating output.');
  s = s.replace(/^data:[^,]*;base64,/i, '').replace(/\s+/g, '');
  const bad = /[^A-Za-z0-9+/=_-]/.exec(s);
  if (bad) throw new ToolError(`“${bad[0]}” at position ${bad.index + 1} is not a Base64 character. Base64 uses only A–Z, a–z, 0–9, “+”, “/” and “=” (or “-” and “_” in URL-safe Base64).`);
  const urlSafe = /[-_]/.test(s);
  if (urlSafe && /[+/]/.test(s)) throw new ToolError('This mixes standard Base64 (“+”, “/”) with URL-safe Base64 (“-”, “_”). Use one or the other.');
  if (/=[^=]/.test(s) || /={3,}$/.test(s)) throw new ToolError('Padding (“=”) can only appear at the very end, at most twice.');
  const core = s.replace(/=+$/, '');
  if (core.length % 4 === 1) throw new ToolError('The length is not valid for Base64. A character may be missing or extra.');
  const b64 = core.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (core.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  let text: string | null = null;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (/[\u0000-\u0008\u000E-\u001F]/.test(text)) text = null;
  } catch {
    text = null;
  }
  return { bytes, text, variant: urlSafe ? 'url-safe' : 'standard' };
}

export function toHex(bytes: Uint8Array, max = 64): string {
  const hex = [...bytes.subarray(0, max)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  return bytes.length > max ? `${hex} …` : hex;
}
