import { ToolError } from './errors';

export interface TimestampResult {
  ms: number;
  detected: string;
  rows: { label: string; value: string }[];
  warnings: string[];
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/**
 * Understands Unix time in seconds, milliseconds, microseconds or nanoseconds, ISO 8601 dates and
 * HTTP dates. All outputs here are in UTC so they are the same for everyone; local time is shown separately.
 */
export function parseTimestamp(input: string): TimestampResult {
  const s = input.trim();
  if (!s) throw new ToolError('Please enter some input before generating output.');
  const warnings: string[] = [];
  let ms: number;
  let detected: string;

  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const digits = s.replace(/^-/, '').split('.')[0].length;
    const n = Number(s);
    if (digits <= 11) [ms, detected] = [n * 1000, 'Unix time in seconds'];
    else if (digits <= 14) [ms, detected] = [n, 'Unix time in milliseconds'];
    else if (digits <= 17) [ms, detected] = [n / 1000, 'Unix time in microseconds'];
    else if (digits <= 19) [ms, detected] = [n / 1e6, 'Unix time in nanoseconds'];
    else throw new ToolError('This number has too many digits to be a Unix timestamp.');
  } else {
    const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(s);
    if (iso) {
      const [, y, mo, d, h = '00', mi = '00', se = '00', frac = '', zone] = iso;
      if (!iso[4]) detected = 'ISO 8601 date (midnight UTC assumed)';
      else detected = zone ? 'ISO 8601 date and time' : 'ISO 8601 date and time (UTC assumed)';
      if (iso[4] && !zone) warnings.push('No time zone was given, so UTC was assumed. Add “Z” or an offset such as +05:30 to be explicit.');
      const z = !zone || zone.toUpperCase() === 'Z' ? 'Z' : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone;
      ms = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${se}.${(frac + '000').slice(0, 3)}${z}`);
      const check = new Date(Date.UTC(+y, +mo - 1, +d));
      if (Number.isNaN(ms) || check.getUTCMonth() !== +mo - 1 || +h > 23 || +mi > 59 || +se > 59)
        throw new ToolError(`“${s}” is not a real date or time.`);
    } else if (/^[A-Za-z]{3}, \d{1,2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} (GMT|UTC|[+-]\d{4})$/.test(s)) {
      ms = Date.parse(s);
      detected = 'HTTP / RFC 2822 date';
    } else {
      throw new ToolError('Enter a Unix timestamp (such as 1763200800) or an ISO 8601 date (such as 2026-11-15T10:30:00Z).');
    }
  }
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) throw new ToolError('This date is outside the range a computer calendar can represent.');
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  if (y < 1700 || y > 4000) warnings.push('Salesforce can only store dates between the years 1700 and 4000.');
  const wholeMs = Math.floor(ms);
  const iso = d.toISOString();
  const soql = `${pad(y, 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
  const rows = [
    { label: 'ISO 8601 (UTC)', value: iso },
    { label: 'Unix seconds', value: String(Math.floor(wholeMs / 1000)) },
    { label: 'Unix milliseconds', value: String(wholeMs) },
    { label: 'SOQL DateTime literal', value: soql },
    { label: 'SOQL Date literal (UTC day)', value: soql.slice(0, 10) },
    { label: 'Apex DateTime (GMT)', value: `DateTime.newInstanceGmt(${y}, ${d.getUTCMonth() + 1}, ${d.getUTCDate()}, ${d.getUTCHours()}, ${d.getUTCMinutes()}, ${d.getUTCSeconds()})` },
    { label: 'Apex from milliseconds', value: `DateTime.newInstance(${wholeMs}L)` },
    { label: 'HTTP date', value: d.toUTCString() },
    { label: 'Day of the week (UTC)', value: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()] },
  ];
  return { ms, detected, rows, warnings };
}

/** “3 days ago”, “in 2 hours”. */
export function relativeTime(ms: number, now: number): string {
  const diff = (ms - now) / 1000;
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'], [3600, 'minute'], [86400, 'hour'], [2592000, 'day'], [31536000, 'month'], [Infinity, 'year'],
  ];
  const sizes = [1, 60, 3600, 86400, 2592000, 31536000];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 10) return rtf.format(0, 'second');
  const idx = units.findIndex(([limit]) => abs < limit);
  return rtf.format(Math.round(diff / sizes[idx]), units[idx][1]);
}
