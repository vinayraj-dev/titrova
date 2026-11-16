import { apexString } from './apex';
import { ToolError } from './errors';
import { parseJson, type JNode } from './jsonParser';

export type Indent = 2 | 4 | 'tab';
export interface JsonFormatOptions {
  indent?: Indent;
  sortKeys?: boolean;
  mode?: 'format' | 'minify' | 'apex';
}
export interface JsonStats {
  bytes: number;
  depth: number;
  objects: number;
  arrays: number;
  keys: number;
}
export interface JsonFormatResult {
  output: string;
  stats: JsonStats;
  warnings: string[];
}

const MAX_SAFE = 9007199254740991n;

/**
 * Formats JSON without ever converting numbers to JavaScript numbers, so very large integers and
 * values such as 1.0 are kept exactly as written.
 */
export function formatJson(text: string, options: JsonFormatOptions = {}): JsonFormatResult {
  const { indent = 2, sortKeys = false, mode = 'format' } = options;
  if (!text.trim()) throw new ToolError('Please enter some input before generating output.');
  const root = parseJson(text);
  const warnings = new Set<string>();
  const stats: JsonStats = { bytes: new TextEncoder().encode(text).length, depth: 0, objects: 0, arrays: 0, keys: 0 };
  const unit = mode === 'format' ? (indent === 'tab' ? '\t' : ' '.repeat(indent)) : '';

  const write = (node: JNode, level: number): string => {
    stats.depth = Math.max(stats.depth, level);
    switch (node.t) {
      case 'string':
        return JSON.stringify(node.v);
      case 'boolean':
        return String(node.v);
      case 'null':
        return 'null';
      case 'number':
        if (/^-?\d+$/.test(node.raw) && (BigInt(node.raw) > MAX_SAFE || BigInt(node.raw) < -MAX_SAFE))
          warnings.add(`${node.raw} is larger than JavaScript can store exactly. It is kept as written here, but many tools will round it. In Apex, read it as a Long or a String.`);
        return node.raw;
      case 'array': {
        stats.arrays++;
        if (!node.items.length) return '[]';
        const items = node.items.map((n) => write(n, level + 1));
        if (!unit) return `[${items.join(',')}]`;
        const pad = unit.repeat(level + 1);
        return `[\n${items.map((s) => pad + s).join(',\n')}\n${unit.repeat(level)}]`;
      }
      case 'object': {
        stats.objects++;
        stats.keys += node.entries.length;
        if (!node.entries.length) return '{}';
        const seen = new Set<string>();
        for (const [k] of node.entries) {
          if (seen.has(k)) warnings.add(`The key “${k}” appears more than once in the same object. Most parsers keep only the last value, including Apex.`);
          seen.add(k);
        }
        const entries = sortKeys ? [...node.entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) : node.entries;
        const parts = entries.map(([k, v]) => `${JSON.stringify(k)}:${unit ? ' ' : ''}${write(v, level + 1)}`);
        if (!unit) return `{${parts.join(',')}}`;
        const pad = unit.repeat(level + 1);
        return `{\n${parts.map((s) => pad + s).join(',\n')}\n${unit.repeat(level)}}`;
      }
    }
  };

  const body = write(root, 0);
  const output = mode === 'apex' ? `String jsonBody = ${apexString(body)};` : body;
  return { output, stats, warnings: [...warnings] };
}
