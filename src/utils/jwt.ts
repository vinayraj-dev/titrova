import { ToolError } from './errors';

export interface JwtClaim {
  key: string;
  label: string;
  value: string;
  /** For time claims: the instant in milliseconds. */
  time?: number;
}
export interface JwtDecoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  headerJson: string;
  payloadJson: string;
  signature: string;
  alg: string;
  claims: JwtClaim[];
  warnings: string[];
}

const LABELS: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not valid before',
  iat: 'Issued at',
  jti: 'Token ID',
  scope: 'Scope',
  scp: 'Scope',
  azp: 'Authorised party',
  name: 'Name',
  email: 'Email',
};
const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat', 'auth_time']);

export function base64UrlToBytes(part: string, label: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(part)) throw new ToolError(`The ${label} is not valid Base64URL. It may be cut off or contain extra characters.`);
  const clean = part.replace(/=+$/, '');
  if (clean.length % 4 === 1) throw new ToolError(`The ${label} has an impossible length. The token may be cut off.`);
  const b64 = clean.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (clean.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function parsePart(part: string, label: string): Record<string, unknown> {
  const text = new TextDecoder().decode(base64UrlToBytes(part, label));
  try {
    const value = JSON.parse(text);
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch {
    /* handled below */
  }
  throw new ToolError(`The ${label} does not contain a JSON object, so this is not a JWT.`);
}

export const isoUtc = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');

export function decodeJwt(input: string): JwtDecoded {
  const token = input.trim().replace(/^Bearer\s+/i, '');
  if (!token) throw new ToolError('Please enter some input before generating output.');
  const parts = token.split('.');
  if (parts.length === 5) throw new ToolError('This token has five parts, so it is an encrypted JWT (JWE). It can only be read with the decryption key.');
  if (parts.length !== 3) throw new ToolError(`A JWT has three parts separated by dots (header.payload.signature). This input has ${parts.length}.`);
  const header = parsePart(parts[0], 'header');
  const payload = parsePart(parts[1], 'payload');
  const alg = typeof header.alg === 'string' ? header.alg : 'unknown';
  const warnings: string[] = [];
  if (alg.toLowerCase() === 'none') warnings.push('The algorithm is “none”: this token is not signed, and no server should accept it.');
  if (!parts[2] && alg.toLowerCase() !== 'none') warnings.push('The signature part is empty.');

  const claims: JwtClaim[] = Object.entries(payload).map(([key, v]) => {
    const label = LABELS[key] ?? key;
    if (TIME_CLAIMS.has(key) && typeof v === 'number') return { key, label, value: `${isoUtc(v * 1000)} (${v})`, time: v * 1000 };
    return { key, label, value: typeof v === 'string' ? v : JSON.stringify(v) };
  });
  return {
    header,
    payload,
    headerJson: JSON.stringify(header, null, 2),
    payloadJson: JSON.stringify(payload, null, 2),
    signature: parts[2],
    alg,
    claims,
    warnings,
  };
}

/** Whether the token is usable at `nowMs`, based on exp and nbf. */
export function jwtTimeStatus(payload: Record<string, unknown>, nowMs: number): { state: 'valid' | 'expired' | 'not-yet' | 'no-expiry'; text: string } {
  const exp = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  const nbf = typeof payload.nbf === 'number' ? payload.nbf * 1000 : null;
  if (nbf !== null && nowMs < nbf) return { state: 'not-yet', text: 'Not valid yet' };
  if (exp === null) return { state: 'no-expiry', text: 'No expiry date' };
  return nowMs >= exp ? { state: 'expired', text: 'Expired' } : { state: 'valid', text: 'Not expired' };
}

const HASH: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
export const canVerify = (alg: string) => alg in HASH;

/** Verifies an HMAC (HS256/384/512) signature with Web Crypto, entirely in the browser. */
export async function verifyHmac(input: string, secret: string, secretIsBase64 = false): Promise<boolean> {
  const token = input.trim().replace(/^Bearer\s+/i, '');
  const [h, p, s] = token.split('.');
  const { alg } = decodeJwt(token);
  if (!canVerify(alg)) throw new ToolError(`Signatures made with ${alg} need a public key and cannot be checked here.`);
  if (!secret) throw new ToolError('Enter the secret that was used to sign the token.');
  const keyBytes = secretIsBase64 ? base64UrlToBytes(secret.replace(/\+/g, '-').replace(/\//g, '_'), 'secret') : new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'HMAC', hash: HASH[alg] }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, base64UrlToBytes(s, 'signature') as BufferSource, new TextEncoder().encode(`${h}.${p}`));
}
