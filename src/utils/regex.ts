import { apexString } from './apex';

export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  groups: (string | null)[];
  named: [string, string | null][];
}
export interface RegexRun {
  matches: RegexMatch[];
  truncated: boolean;
  replaced: string | null;
  error: string | null;
}

/**
 * Self-contained on purpose: it is also serialised into a Web Worker, so it must not reference
 * anything outside its own body.
 */
export function runRegex(source: string, flags: string, text: string, replacement: string | null, max: number): RegexRun {
  let re: RegExp;
  try {
    re = new RegExp(source, flags.includes('g') ? flags : flags + 'g');
    new RegExp(source, flags);
  } catch (e) {
    return { matches: [], truncated: false, replaced: null, error: (e as Error).message.replace(/^Invalid regular expression: /, '') };
  }
  const matches: RegexMatch[] = [];
  const all = flags.includes('g');
  let truncated = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (matches.length >= max) {
      truncated = true;
      break;
    }
    matches.push({
      index: m.index,
      end: m.index + m[0].length,
      text: m[0],
      groups: m.slice(1).map((g) => (g === undefined ? null : g)),
      named: m.groups ? Object.entries(m.groups).map(([k, v]) => [k, v === undefined ? null : v]) : [],
    });
    if (!all) break;
    if (m[0] === '') re.lastIndex += 1;
  }
  const replaced = replacement === null ? null : text.replace(new RegExp(source, flags), replacement);
  return { matches, truncated, replaced, error: null };
}

/** Runs the pattern in a Web Worker and gives up after `timeoutMs`, so a runaway pattern cannot freeze the page. */
export function runRegexSafely(source: string, flags: string, text: string, replacement: string | null, max = 1000, timeoutMs = 1500): Promise<RegexRun> {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function')
    return Promise.resolve(runRegex(source, flags, text, replacement, max));
  return new Promise((resolve) => {
    const code = `const run = ${runRegex.toString()};\nself.onmessage = (e) => self.postMessage(run(...e.data));`;
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    let worker: Worker;
    try {
      worker = new Worker(url);
    } catch {
      // Some browsers refuse workers on pages opened from a local file; run directly instead.
      URL.revokeObjectURL(url);
      resolve(runRegex(source, flags, text, replacement, max));
      return;
    }
    const done = (r: RegexRun) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(r);
    };
    const timer = setTimeout(
      () => done({ matches: [], truncated: false, replaced: null, error: `This pattern took longer than ${timeoutMs / 1000} seconds, so it was stopped. It may be backtracking catastrophically; look for nested quantifiers such as (a+)+.` }),
      timeoutMs,
    );
    worker.onmessage = (e) => done(e.data as RegexRun);
    worker.onerror = () => done(runRegex(source, flags, text, replacement, max));
    worker.postMessage([source, flags, text, replacement, max]);
  });
}

/** Apex (Java) version of the pattern: flags become inline modifiers and the string is escaped for Apex. */
export function toApexPattern(source: string, flags: string): { code: string; notes: string[] } {
  const inline = ['i', 'm', 's'].filter((f) => flags.includes(f)).join('');
  const notes: string[] = [];
  if (flags.includes('u')) notes.push('Java has no “u” flag; Unicode is supported by default, but \\p{…} property names can differ.');
  if (flags.includes('y')) notes.push('The sticky “y” flag has no Apex equivalent. Use m.find(start) or anchor the pattern with \\G.');
  if (/\(\?<[=!]/.test(source)) notes.push('Java supports lookbehind only when its length is bounded, so “+” or “*” inside a lookbehind will not compile in Apex.');
  const pattern = (inline ? `(?${inline})` : '') + source;
  const code = [
    `Pattern p = Pattern.compile(${apexString(pattern)});`,
    'Matcher m = p.matcher(input);',
    'while (m.find()) {',
    '    System.debug(m.group());',
    '}',
  ].join('\n');
  return { code, notes };
}

export const COMMON_PATTERNS: { label: string; source: string; flags: string; sample: string }[] = [
  { label: 'Email address', source: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', flags: 'g', sample: 'Contact sales@acme.example or support@acme.example.' },
  { label: 'Salesforce ID', source: '\\b[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?\\b', flags: 'g', sample: 'Account 001A0000006Vm9rIAC was merged into 0015g00000ABCDE.' },
  { label: 'ISO date', source: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', flags: 'g', sample: 'Created 2026-11-15, closed 2026-12-01.' },
  { label: 'URL', source: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'gi', sample: 'Docs: https://developer.salesforce.com and http://example.com/a?b=1' },
  { label: 'IPv4 address', source: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', flags: 'g', sample: 'Allowed: 10.0.0.1, 192.168.1.255; blocked: 999.1.1.1' },
  { label: 'Phone (international)', source: '\\+?\\d{1,3}[ -]?\\(?\\d{2,4}\\)?[ -]?\\d{3,4}[ -]?\\d{3,4}', flags: 'g', sample: 'Call +1 415 555 0100 or +91 98765 43210.' },
];
