import { ToolError } from './errors';

/**
 * A small JSON parser that keeps what JSON.parse throws away:
 *  - the raw text of numbers (so 1 and 1.0 can map to Integer and Decimal),
 *  - the order of keys,
 *  - the line and column of the first syntax error.
 */
export type JNode =
  | { t: 'object'; entries: [string, JNode][] }
  | { t: 'array'; items: JNode[] }
  | { t: 'string'; v: string }
  | { t: 'number'; raw: string }
  | { t: 'boolean'; v: boolean }
  | { t: 'null' };

export class JsonSyntaxError extends ToolError {
  constructor(
    public detail: string,
    public line: number,
    public column: number,
  ) {
    super(`Invalid JSON input at line ${line}, column ${column}: ${detail} Please check your brackets, quotation marks and commas.`);
    this.name = 'JsonSyntaxError';
  }
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const MAX_DEPTH = 100;

export function parseJson(text: string): JNode {
  let i = 0;
  const n = text.length;

  const fail = (detail: string, at = i): never => {
    let line = 1;
    let col = 1;
    for (let k = 0; k < at && k < n; k++) {
      if (text[k] === '\n') {
        line++;
        col = 1;
      } else col++;
    }
    throw new JsonSyntaxError(detail, line, col);
  };

  const ws = () => {
    while (i < n) {
      const c = text[i];
      if (c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\uFEFF') i++;
      else break;
    }
  };

  const readString = (): string => {
    const start = i;
    i++;
    while (i < n) {
      const c = text[i];
      if (c === '"') {
        i++;
        try {
          return JSON.parse(text.slice(start, i)) as string;
        } catch {
          return fail('This string contains an invalid escape sequence.', start);
        }
      }
      if (c === '\\') i += 2;
      else if (c < ' ') return fail('A string is missing its closing quotation mark.', start);
      else i++;
    }
    return fail('A string is missing its closing quotation mark.', start);
  };

  const value = (depth: number): JNode => {
    if (depth > MAX_DEPTH) fail('The JSON is nested more than 100 levels deep.');
    ws();
    if (i >= n) fail('The input ends before the JSON is complete.');
    const c = text[i];

    if (c === '{') {
      i++;
      const entries: [string, JNode][] = [];
      ws();
      if (text[i] === '}') {
        i++;
        return { t: 'object', entries };
      }
      for (;;) {
        ws();
        if (text[i] === '}') fail('There is a trailing comma before “}”.');
        if (text[i] === "'") fail('Property names must use double quotes, not single quotes.');
        if (text[i] !== '"') fail('Expected a property name in double quotes.');
        const key = readString();
        ws();
        if (text[i] !== ':') fail(`Expected “:” after the property name “${key}”.`);
        i++;
        entries.push([key, value(depth + 1)]);
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === '}') {
          i++;
          return { t: 'object', entries };
        }
        fail(i >= n ? 'An object is missing its closing “}”.' : 'Expected “,” or “}” after a property value.');
      }
    }

    if (c === '[') {
      i++;
      const items: JNode[] = [];
      ws();
      if (text[i] === ']') {
        i++;
        return { t: 'array', items };
      }
      for (;;) {
        ws();
        if (text[i] === ']') fail('There is a trailing comma before “]”.');
        items.push(value(depth + 1));
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === ']') {
          i++;
          return { t: 'array', items };
        }
        fail(i >= n ? 'An array is missing its closing “]”.' : 'Expected “,” or “]” after an array item.');
      }
    }

    if (c === '"') return { t: 'string', v: readString() };
    if (c === "'") fail('Strings must use double quotes, not single quotes.');

    if (c === '-' || (c >= '0' && c <= '9')) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(text);
      if (!m) fail('This number is not valid JSON.');
      i += m![0].length;
      return { t: 'number', raw: m![0] };
    }

    for (const [word, node] of [
      ['true', { t: 'boolean', v: true }],
      ['false', { t: 'boolean', v: false }],
      ['null', { t: 'null' }],
    ] as [string, JNode][]) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return node;
      }
    }
    return fail(`Unexpected character “${c}”.`);
  };

  const root = value(0);
  ws();
  if (i < n) fail('Unexpected content after the end of the JSON value.');
  return root;
}
