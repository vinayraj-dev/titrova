import { ToolError } from './errors';

/**
 * SOQL formatter.
 *
 * The formatter only ever changes whitespace and (optionally) the letter case of keywords.
 * After formatting, the output is tokenized again and compared with the input token by token;
 * if anything differs, the result is rejected instead of being shown.
 */

export interface Tok {
  type: 'word' | 'string' | 'number' | 'date' | 'bind' | 'op' | 'comma' | 'lparen' | 'rparen';
  text: string;
  /** Canonical upper-case keyword, when this word is acting as a keyword. */
  kw?: string;
}
interface Group {
  type: 'group';
  items: Node[];
}
type Node = Tok | Group;

export interface SoqlFormatOptions {
  uppercaseKeywords?: boolean;
  /** auto: one field per line when there are more than three fields or a subquery. */
  fieldLayout?: 'auto' | 'multi' | 'single';
  indent?: 2 | 4;
}

export interface SoqlFormatResult {
  formatted: string;
  warnings: string[];
}

const WORD = /[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/y;
const DATE = /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2}))?/y;
const NUM = /\d+(?:\.\d+)?/y;
const N_SUFFIX = /:\d+/y;
const DATE_N = /^(?:(?:LAST|NEXT)_N_[A-Z_]+|N_[A-Z_]+_AGO)$/i;

export function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const match = (re: RegExp, at = i) => {
    re.lastIndex = at;
    const m = re.exec(src);
    return m ? m[0] : null;
  };

  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      let closed = false;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === "'") {
          closed = true;
          break;
        }
        j++;
      }
      if (!closed)
        throw new ToolError(`A text value starting at character ${i + 1} is missing its closing single quote.`);
      toks.push({ type: 'string', text: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (/\d/.test(c)) {
      const d = match(DATE);
      if (d) {
        toks.push({ type: 'date', text: d });
        i += d.length;
        continue;
      }
      const num = match(NUM)!;
      toks.push({ type: 'number', text: num });
      i += num.length;
      continue;
    }
    if ((c === '-' || c === '+') && /\d/.test(src[i + 1] ?? '')) {
      const prev = toks[toks.length - 1];
      if (!prev || prev.type === 'op' || prev.type === 'comma' || prev.type === 'lparen') {
        const num = match(NUM, i + 1)!;
        toks.push({ type: 'number', text: c + num });
        i += 1 + num.length;
        continue;
      }
    }
    if (c === ':') {
      let j = i + 1;
      while (/\s/.test(src[j] ?? '')) j++;
      const name = match(WORD, j);
      if (!name) throw new ToolError(`The “:” at character ${i + 1} must be followed by an Apex variable name.`);
      toks.push({ type: 'bind', text: ':' + name });
      i = j + name.length;
      continue;
    }
    const word = match(WORD);
    if (word) {
      let text = word;
      i += word.length;
      if (src[i] === ':' && DATE_N.test(word)) {
        const n = match(N_SUFFIX);
        if (n) {
          text += n;
          i += n.length;
        }
      }
      toks.push({ type: 'word', text });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '!=' || two === '<>' || two === '<=' || two === '>=') {
      toks.push({ type: 'op', text: two });
      i += 2;
      continue;
    }
    if (c === '=' || c === '<' || c === '>' || c === '+' || c === '-') {
      toks.push({ type: 'op', text: c });
      i++;
      continue;
    }
    if (c === ',') toks.push({ type: 'comma', text: c });
    else if (c === '(') toks.push({ type: 'lparen', text: c });
    else if (c === ')') toks.push({ type: 'rparen', text: c });
    else
      throw new ToolError(
        `Unexpected character “${c}” at character ${i + 1}. If this query comes from Apex code, paste only the part between the square brackets.`,
      );
    i++;
  }
  return toks;
}

const ALWAYS = new Set(
  'SELECT FROM WHERE AND OR NOT IN LIKE INCLUDES EXCLUDES HAVING NULLS WITH TYPEOF USING ASC DESC'.split(' '),
);
const FUNCS = new Set('COUNT COUNT_DISTINCT SUM AVG MIN MAX ROLLUP CUBE'.split(' '));

/** Decide which words act as keywords. Context matters: `FROM Order`, `FROM Group` and `FROM Case` are object names. */
export function markKeywords(toks: Tok[]): Tok[] {
  let typeofDepth = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.type !== 'word' || t.text.includes('.') || t.text.includes(':')) continue;
    const u = t.text.toUpperCase();
    const prev = toks[i - 1];
    const next = toks[i + 1];
    const prevKw = prev?.kw;
    const nextU = next?.type === 'word' ? next.text.toUpperCase() : '';
    if (prevKw === 'FROM') continue; // always an object name

    let kw = false;
    if (u === 'ORDER' || u === 'GROUP') kw = nextU === 'BY';
    else if (u === 'BY') kw = prevKw === 'ORDER' || prevKw === 'GROUP';
    else if (u === 'LIMIT' || u === 'OFFSET') kw = next?.type === 'number' || next?.type === 'bind';
    else if (u === 'FIRST' || u === 'LAST') kw = prevKw === 'NULLS';
    else if (u === 'FOR') kw = nextU === 'VIEW' || nextU === 'REFERENCE' || nextU === 'UPDATE';
    else if (u === 'VIEW' || u === 'REFERENCE') kw = prevKw === 'FOR';
    else if (u === 'UPDATE') kw = prevKw === 'FOR' || nextU === 'TRACKING' || nextU === 'VIEWSTAT';
    else if (u === 'TRACKING' || u === 'VIEWSTAT') kw = prevKw === 'UPDATE';
    else if (u === 'ALL') kw = nextU === 'ROWS';
    else if (u === 'ROWS') kw = prevKw === 'ALL';
    else if (u === 'SCOPE') kw = prevKw === 'USING';
    else if (u === 'SECURITY_ENFORCED' || u === 'USER_MODE' || u === 'SYSTEM_MODE') kw = prevKw === 'WITH';
    else if (u === 'WHEN' || u === 'THEN' || u === 'ELSE') kw = typeofDepth > 0;
    else if (u === 'END') {
      kw = typeofDepth > 0;
      if (kw) typeofDepth--;
    } else if (FUNCS.has(u)) kw = next?.type === 'lparen';
    else if (ALWAYS.has(u)) {
      kw = true;
      if (u === 'TYPEOF') typeofDepth++;
    }
    if (kw) t.kw = u;
  }
  return toks;
}

function buildTree(toks: Tok[]): Node[] {
  const stack: Node[][] = [[]];
  for (const t of toks) {
    if (t.type === 'lparen') stack.push([]);
    else if (t.type === 'rparen') {
      if (stack.length === 1) throw new ToolError('There is a closing parenthesis “)” without a matching “(”.');
      const items = stack.pop()!;
      stack[stack.length - 1].push({ type: 'group', items });
    } else stack[stack.length - 1].push(t);
  }
  if (stack.length > 1)
    throw new ToolError(
      stack.length === 2
        ? 'A parenthesis “(” is never closed. Add the missing “)”.'
        : `${stack.length - 1} parentheses are never closed. Add the missing “)” characters.`,
    );
  return stack[0];
}

const isGroup = (n: Node | undefined): n is Group => !!n && n.type === 'group';
const kwOf = (n: Node | undefined): string | undefined => (n && !isGroup(n) ? n.kw : undefined);
const isSubquery = (n: Node): boolean => isGroup(n) && kwOf(n.items[0]) === 'SELECT';
const containsSubquery = (n: Node): boolean => isGroup(n) && (isSubquery(n) || n.items.some(containsSubquery));

const CLAUSE_RANK: Record<string, number> = {
  SELECT: 0,
  FROM: 1,
  USING: 2,
  WHERE: 3,
  WITH: 4,
  GROUP: 5,
  HAVING: 6,
  ORDER: 7,
  LIMIT: 8,
  OFFSET: 9,
  FOR: 10,
  ALL: 11,
  UPDATE: 12,
};
const CLAUSE_LABEL: Record<string, string> = { GROUP: 'GROUP BY', ORDER: 'ORDER BY', ALL: 'ALL ROWS' };

class Formatter {
  warnings: string[] = [];
  private upper: boolean;
  private layout: 'auto' | 'multi' | 'single';
  private unit: string;

  constructor(o: SoqlFormatOptions) {
    this.upper = o.uppercaseKeywords ?? true;
    this.layout = o.fieldLayout ?? 'auto';
    this.unit = ' '.repeat(o.indent ?? 2);
  }

  private pad(level: number) {
    return this.unit.repeat(level);
  }
  private txt(t: Tok) {
    return t.kw && this.upper ? t.kw : t.text;
  }

  private spaceBetween(prev: Node, cur: Node): boolean {
    if (!isGroup(cur) && cur.type === 'comma') return false;
    if (isGroup(cur) && !isGroup(prev) && (prev.type === 'word' || prev.type === 'bind') && (!prev.kw || FUNCS.has(prev.kw)))
      return false; // function call: COUNT(Id), toLabel(Status)
    return true;
  }

  inline(nodes: Node[]): string {
    let out = '';
    nodes.forEach((n, i) => {
      const s = isGroup(n) ? '(' + this.inline(n.items) + ')' : this.txt(n);
      out += (i > 0 && this.spaceBetween(nodes[i - 1], n) ? ' ' : '') + s;
    });
    return out;
  }

  private splitCommas(nodes: Node[]): Node[][] {
    const parts: Node[][] = [[]];
    let depth = 0;
    for (const n of nodes) {
      const kw = kwOf(n);
      if (kw === 'TYPEOF') depth++;
      else if (kw === 'END') depth--;
      if (!isGroup(n) && n.type === 'comma' && depth === 0) parts.push([]);
      else parts[parts.length - 1].push(n);
    }
    return parts;
  }

  private typeofLines(nodes: Node[], level: number): string[] {
    const segs: Node[][] = [[]];
    for (const n of nodes) {
      const kw = kwOf(n);
      if (kw === 'WHEN' || kw === 'ELSE' || kw === 'END') segs.push([]);
      segs[segs.length - 1].push(n);
    }
    return segs.map((seg, i) => {
      const isEnd = kwOf(seg[0]) === 'END';
      return this.pad(i === 0 || isEnd ? level : level + 1) + this.inline(seg);
    });
  }

  private itemLines(item: Node[], level: number): string[] {
    if (item.length === 1 && isSubquery(item[0])) {
      return [this.pad(level) + '(', ...this.queryLines((item[0] as Group).items, level + 1), this.pad(level) + ')'];
    }
    if (kwOf(item[0]) === 'TYPEOF') return this.typeofLines(item, level);
    return [this.pad(level) + this.inline(item)];
  }

  /** A boolean expression: each top-level AND / OR starts a new line. */
  private condLines(nodes: Node[], level: number): string[] {
    const parts: { op: string; nodes: Node[] }[] = [{ op: '', nodes: [] }];
    for (const n of nodes) {
      const kw = kwOf(n);
      if ((kw === 'AND' || kw === 'OR') && parts[parts.length - 1].nodes.length)
        parts.push({ op: this.txt(n as Tok), nodes: [] });
      else parts[parts.length - 1].nodes.push(n);
    }
    const out: string[] = [];
    for (const p of parts) {
      const lines = this.partLines(p.nodes, level);
      if (p.op) lines[0] = this.pad(level) + p.op + ' ' + lines[0].trimStart();
      out.push(...lines);
    }
    return out;
  }

  private partLines(nodes: Node[], level: number): string[] {
    const lines: string[] = [];
    let cur = '';
    nodes.forEach((n, i) => {
      const sep = cur && i > 0 && this.spaceBetween(nodes[i - 1], n) ? ' ' : '';
      if (isGroup(n) && (containsSubquery(n) || this.shouldBreak(n))) {
        lines.push(this.pad(level) + cur + sep + '(');
        lines.push(...(isSubquery(n) ? this.queryLines(n.items, level + 1) : this.condLines(n.items, level + 1)));
        cur = ')';
      } else {
        cur += sep + (isGroup(n) ? '(' + this.inline(n.items) + ')' : this.txt(n));
      }
    });
    lines.push(this.pad(level) + cur);
    return lines;
  }

  private shouldBreak(g: Group): boolean {
    const hasBool = g.items.some((n) => kwOf(n) === 'AND' || kwOf(n) === 'OR');
    return hasBool && this.inline(g.items).length > 72;
  }

  queryLines(nodes: Node[], level: number): string[] {
    if (!nodes.length) throw new ToolError('There is an empty pair of parentheses where a query or value was expected.');
    if (kwOf(nodes[0]) !== 'SELECT') throw new ToolError('A SOQL query must start with SELECT.');

    // Split into clauses.
    const clauses: { kw: string; nodes: Node[] }[] = [];
    nodes.forEach((n, i) => {
      const kw = kwOf(n);
      const starts =
        kw !== undefined &&
        kw in CLAUSE_RANK &&
        !(kw === 'UPDATE' && kwOf(nodes[i - 1]) === 'FOR') &&
        !(kw === 'ALL' && kwOf(nodes[i - 1]) === 'FOR');
      if (starts) clauses.push({ kw: kw!, nodes: [n] });
      else clauses[clauses.length - 1].nodes.push(n);
    });

    // Structural checks (syntax shape only — nothing here knows about your org's schema).
    const names = clauses.map((c) => c.kw);
    if (!names.includes('FROM')) throw new ToolError('The query is missing a FROM clause, for example “FROM Account”.');
    let maxRank = -1;
    const seen = new Set<string>();
    for (const kw of names) {
      const label = CLAUSE_LABEL[kw] ?? kw;
      if (seen.has(kw) && kw !== 'WITH' && kw !== 'FOR')
        this.warnings.push(`${label} appears more than once in the same query.`);
      seen.add(kw);
      if (CLAUSE_RANK[kw] < maxRank) this.warnings.push(`${label} is in an unusual position. Salesforce expects clauses in a fixed order.`);
      maxRank = Math.max(maxRank, CLAUSE_RANK[kw]);
    }

    const out: string[] = [];
    for (const clause of clauses) {
      const head = clause.nodes[0] as Tok;
      const body = clause.nodes.slice(1);
      if (clause.kw === 'SELECT') {
        const items = this.splitCommas(body);
        if (items.some((it) => it.length === 0)) {
          if (items.length === 1) throw new ToolError('SELECT has no fields. List at least one field, for example “SELECT Id”.');
          throw new ToolError('There is an extra comma in the SELECT list. Remove it or add the missing field.');
        }
        const complex = items.some((it) => (it.length === 1 && isSubquery(it[0])) || kwOf(it[0]) === 'TYPEOF');
        const multi = this.layout === 'multi' || (this.layout === 'auto' && (items.length > 3 || complex));
        if (!multi && !complex) {
          out.push(this.pad(level) + this.txt(head) + ' ' + items.map((it) => this.inline(it)).join(', '));
        } else {
          out.push(this.pad(level) + this.txt(head));
          items.forEach((it, i) => {
            const lines = this.itemLines(it, level + 1);
            if (i < items.length - 1) lines[lines.length - 1] += ',';
            out.push(...lines);
          });
        }
      } else if (clause.kw === 'WHERE' || clause.kw === 'HAVING') {
        if (!body.length) throw new ToolError(`${clause.kw} has no condition after it.`);
        const lines = this.condLines(body, level + 1);
        lines[0] = this.pad(level) + this.txt(head) + ' ' + lines[0].trimStart();
        out.push(...lines);
      } else {
        if (clause.kw === 'FROM' && !body.length) throw new ToolError('FROM must be followed by an object name, for example “FROM Account”.');
        out.push(this.pad(level) + this.inline(clause.nodes));
      }
    }
    return out;
  }
}

function assertSameTokens(before: Tok[], output: string) {
  const after = markKeywords(tokenize(output));
  const same =
    before.length === after.length &&
    before.every((b, i) => {
      const a = after[i];
      if (a.type !== b.type) return false;
      return b.kw ? a.text.toUpperCase() === b.text.toUpperCase() : a.text === b.text;
    });
  if (!same)
    throw new ToolError(
      'This query uses syntax the formatter cannot rearrange safely, so it was left unchanged. Please report it so we can add support.',
    );
}

function prepare(query: string): { toks: Tok[]; tree: Node[] } {
  if (!query.trim()) throw new ToolError('Please enter some input before generating output.');
  const toks = markKeywords(tokenize(query));
  return { toks, tree: buildTree(toks) };
}

export function formatSoql(query: string, options: SoqlFormatOptions = {}): SoqlFormatResult {
  const { toks, tree } = prepare(query);
  const f = new Formatter(options);
  const formatted = f.queryLines(tree, 0).join('\n');
  assertSameTokens(toks, formatted);
  return { formatted, warnings: [...new Set(f.warnings)] };
}

/** Collapse a query onto one line, e.g. for an Apex string or a URL. */
export function minifySoql(query: string, options: SoqlFormatOptions = {}): SoqlFormatResult {
  const { toks, tree } = prepare(query);
  const f = new Formatter(options);
  f.queryLines(tree, 0); // run the same structural checks
  const formatted = f.inline(tree);
  assertSameTokens(toks, formatted);
  return { formatted, warnings: [...new Set(f.warnings)] };
}
