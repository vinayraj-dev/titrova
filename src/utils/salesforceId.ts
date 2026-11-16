const SUFFIX_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

/** Compute the 3-character case checksum for a 15-character Salesforce ID. */
export function idChecksum(id15: string): string {
  let suffix = '';
  for (let chunk = 0; chunk < 3; chunk++) {
    let bits = 0;
    for (let pos = 0; pos < 5; pos++) {
      const c = id15[chunk * 5 + pos];
      if (c >= 'A' && c <= 'Z') bits |= 1 << pos;
    }
    suffix += SUFFIX_ALPHABET[bits];
  }
  return suffix;
}

export function to18(id15: string): string {
  return id15 + idChecksum(id15);
}

/** Rebuild the original letter casing of the first 15 characters from an 18-character ID's suffix. */
function restoreCase(id18: string): string | null {
  const body = id18.slice(0, 15);
  const suffix = id18.slice(15).toUpperCase();
  let out = '';
  for (let chunk = 0; chunk < 3; chunk++) {
    const bits = SUFFIX_ALPHABET.indexOf(suffix[chunk]);
    if (bits < 0) return null;
    for (let pos = 0; pos < 5; pos++) {
      const c = body[chunk * 5 + pos];
      const upper = (bits >> pos) & 1;
      if (/[A-Za-z]/.test(c)) out += upper ? c.toUpperCase() : c.toLowerCase();
      else if (upper) return null; // suffix says "uppercase letter" but this is a digit
      else out += c;
    }
  }
  return out;
}

export type IdStatus = 'converted' | 'valid' | 'repaired' | 'invalid';

export interface IdResult {
  input: string;
  status: IdStatus;
  id15?: string;
  id18?: string;
  prefix?: string;
  message: string;
}

export const INVALID_ID_MESSAGE = 'Please enter a valid 15-character or 18-character Salesforce ID.';

export function analyzeId(raw: string): IdResult {
  const input = raw.trim();
  if (!/^[A-Za-z0-9]+$/.test(input)) {
    return { input, status: 'invalid', message: `${INVALID_ID_MESSAGE} IDs contain only letters and numbers.` };
  }
  if (input.length === 15) {
    return {
      input,
      status: 'converted',
      id15: input,
      id18: to18(input),
      prefix: input.slice(0, 3),
      message: 'Converted from 15 to 18 characters.',
    };
  }
  if (input.length === 18) {
    const body = input.slice(0, 15);
    const suffix = input.slice(15).toUpperCase();
    if (idChecksum(body) === suffix) {
      return {
        input,
        status: 'valid',
        id15: body,
        id18: body + suffix,
        prefix: body.slice(0, 3),
        message: 'Already 18 characters. The checksum matches the letter casing.',
      };
    }
    const restored = restoreCase(input);
    if (restored) {
      return {
        input,
        status: 'repaired',
        id15: restored,
        id18: restored + suffix,
        prefix: restored.slice(0, 3),
        message: 'The letter casing did not match the 3-character suffix, so the casing was restored from the suffix. If the suffix was typed by hand, double-check it.',
      };
    }
    return {
      input,
      status: 'invalid',
      message: 'This has 18 characters, but its last 3 characters cannot belong to this ID. One or more characters may be mistyped.',
    };
  }
  return { input, status: 'invalid', message: `${INVALID_ID_MESSAGE} This one has ${input.length} characters.` };
}

/** Split pasted text into IDs: new lines, commas, semicolons, tabs, spaces and quotes all separate values. */
export function splitIds(text: string): string[] {
  return text
    .split(/[\s,;"']+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function analyzeBatch(text: string): IdResult[] {
  return splitIds(text).map(analyzeId);
}
