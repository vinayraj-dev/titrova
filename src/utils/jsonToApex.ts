import { apexString, isReservedWord, isSystemTypeName, isValidApexIdentifier } from './apex';
import { ToolError } from './errors';
import { parseJson, type JNode } from './jsonParser';

export interface JsonToApexOptions {
  rootClassName: string;
  /** Add `@AuraEnabled` to every property (for LWC / Aura controllers). */
  auraEnabled?: boolean;
  /** Emit `{ get; set; }` properties instead of plain fields. */
  getSet?: boolean;
  /** Emit a static parse(String) helper. */
  parseMethod?: boolean;
}

export interface JsonToApexResult {
  code: string;
  classCount: number;
  propertyCount: number;
  /** JSON keys that had to be renamed to become valid Apex identifiers. */
  renames: { key: string; property: string }[];
  warnings: string[];
}

type T =
  | { k: 'string' | 'integer' | 'long' | 'decimal' | 'boolean' | 'null' | 'any' }
  | { k: 'list'; of: T }
  | { k: 'object'; fields: Map<string, T> };

const INT_MAX = 2147483647n;
const LONG_MAX = 9223372036854775807n;

function numberType(raw: string): T {
  if (/[.eE]/.test(raw)) return { k: 'decimal' };
  const v = BigInt(raw);
  const abs = v < 0n ? -v : v;
  if (abs <= INT_MAX) return { k: 'integer' };
  if (abs <= LONG_MAX) return { k: 'long' };
  return { k: 'decimal' };
}

function merge(a: T, b: T): T {
  if (a.k === 'null') return b;
  if (b.k === 'null') return a;
  if (a.k === 'any' || b.k === 'any') return { k: 'any' };
  if (a.k === 'list' && b.k === 'list') return { k: 'list', of: merge(a.of, b.of) };
  if (a.k === 'object' && b.k === 'object') {
    const fields = new Map(a.fields);
    for (const [key, t] of b.fields) fields.set(key, fields.has(key) ? merge(fields.get(key)!, t) : t);
    return { k: 'object', fields };
  }
  if (a.k === b.k) return a;
  const rank: Record<string, number> = { integer: 1, long: 2, decimal: 3 };
  if (rank[a.k] && rank[b.k]) return rank[a.k] >= rank[b.k] ? a : b;
  return { k: 'any' };
}

function infer(node: JNode): T {
  switch (node.t) {
    case 'string':
      return { k: 'string' };
    case 'boolean':
      return { k: 'boolean' };
    case 'null':
      return { k: 'null' };
    case 'number':
      return numberType(node.raw);
    case 'array':
      return { k: 'list', of: node.items.map(infer).reduce(merge, { k: 'null' } as T) };
    case 'object': {
      const fields = new Map<string, T>();
      for (const [key, child] of node.entries) {
        const t = infer(child);
        fields.set(key, fields.has(key) ? merge(fields.get(key)!, t) : t);
      }
      return { k: 'object', fields };
    }
  }
}

/** Turn any JSON key into a legal Apex identifier, changing as little as possible. */
export function toApexIdentifier(key: string): string {
  let s = key
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!s) s = 'field';
  if (/^[0-9]/.test(s)) s = 'x' + s;
  if (isReservedWord(s)) s += '_x';
  return s;
}

export function singularize(word: string): string {
  if (/ies$/i.test(word) && word.length > 4) return word.slice(0, -3) + 'y';
  if (/(sses|uses|xes|ches|shes)$/i.test(word)) return word.slice(0, -2);
  if (/s$/i.test(word) && !/(ss|us|is)$/i.test(word) && word.length > 2) return word.slice(0, -1);
  return word;
}

function pascal(key: string): string {
  const parts = key
    .normalize('NFKD')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  let s = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  if (!s) s = 'Item';
  if (/^[0-9]/.test(s)) s = 'X' + s;
  return s;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateRootClassName(name: string): string | null {
  if (!name.trim()) return 'Enter a root class name.';
  if (!isValidApexIdentifier(name))
    return 'The root class name must start with a letter and contain only letters, numbers and single underscores.';
  if (name.length > 40) return 'Apex class names can be at most 40 characters long.';
  if (isReservedWord(name)) return `“${name}” is a reserved word in Apex and cannot be used as a class name.`;
  return null;
}

export function jsonToApex(json: string, options: JsonToApexOptions): JsonToApexResult {
  const { rootClassName, auraEnabled = false, getSet = false, parseMethod = true } = options;
  if (!json.trim()) throw new ToolError('Please enter some input before generating output.');
  const nameError = validateRootClassName(rootClassName);
  if (nameError) throw new ToolError(nameError);

  const rootType = infer(parseJson(json));

  // Unwrap a top-level array (or array of arrays) to find the object that becomes the root class.
  let listDepth = 0;
  let core: T = rootType;
  while (core.k === 'list') {
    core = core.of;
    listDepth++;
  }
  if (core.k !== 'object') {
    throw new ToolError(
      listDepth > 0 && core.k === 'null'
        ? 'The top-level array is empty, so there is nothing to build a class from. Add at least one object to the array.'
        : 'The top level of the JSON must be an object or an array of objects to generate an Apex class.',
    );
  }

  const warnings: string[] = [];

  // ---- Pass 1: decide property names for every key, globally and consistently. ----
  const objects: Map<string, T>[] = [];
  (function collect(t: T) {
    if (t.k === 'list') collect(t.of);
    else if (t.k === 'object') {
      objects.push(t.fields);
      t.fields.forEach(collect);
    }
  })(core);

  const baseNames = new Set<string>();
  for (const fields of objects) for (const key of fields.keys()) baseNames.add(toApexIdentifier(key).toLowerCase());

  const conflicting = new Set<string>();
  for (const fields of objects) {
    const seen = new Map<string, string>();
    for (const key of fields.keys()) {
      const lower = toApexIdentifier(key).toLowerCase();
      if (seen.has(lower) && seen.get(lower) !== key) conflicting.add(key);
      else seen.set(lower, key);
    }
  }
  const propertyNames = new Map<string, string>();
  for (const key of conflicting) {
    const base = toApexIdentifier(key);
    let n = 2;
    while (baseNames.has((base + n).toLowerCase())) n++;
    baseNames.add((base + n).toLowerCase());
    propertyNames.set(key, base + n);
  }
  const propertyName = (key: string) => propertyNames.get(key) ?? toApexIdentifier(key);

  // ---- Pass 2: name classes and emit code. ----
  const classes: { name: string; signature: string; lines: string[] }[] = [];
  const usedClassNames = new Set<string>([rootClassName.toLowerCase()]);
  let propertyCount = 0;
  const renames = new Map<string, string>();

  const typeName = (t: T, hint: string): string => {
    switch (t.k) {
      case 'string':
        return 'String';
      case 'integer':
        return 'Integer';
      case 'long':
        return 'Long';
      case 'decimal':
        return 'Decimal';
      case 'boolean':
        return 'Boolean';
      case 'null':
      case 'any':
        return 'Object';
      case 'list':
        return `List<${typeName(t.of, singularize(hint))}>`;
      case 'object':
        return defineClass(t.fields, hint, false);
    }
  };

  const signatureOf = (t: T): string => {
    if (t.k === 'list') return `[${signatureOf(t.of)}]`;
    if (t.k === 'object') return `{${[...t.fields].map(([k, v]) => `${JSON.stringify(k)}:${signatureOf(v)}`).join(',')}}`;
    return t.k;
  };

  function defineClass(fields: Map<string, T>, hint: string, isRoot: boolean): string {
    const signature = signatureOf({ k: 'object', fields });
    let name = rootClassName;
    if (!isRoot) {
      const existing = classes.find((c) => c.signature === signature);
      if (existing) return existing.name;
      let base = pascal(hint);
      if (isReservedWord(base) || isSystemTypeName(base)) base += 'Data';
      base = base.slice(0, 36);
      name = base;
      let n = 2;
      while (usedClassNames.has(name.toLowerCase())) name = base + n++;
      usedClassNames.add(name.toLowerCase());
    }
    const entry = { name, signature: isRoot ? '\u0000root' : signature, lines: [] as string[] };
    classes.push(entry);

    if (fields.size === 0) warnings.push(`${name} has no properties because the matching JSON object is empty.`);
    for (const [key, t] of fields) {
      const prop = propertyName(key);
      if (prop !== key) renames.set(key, prop);
      const type = typeName(t, key);
      if (t.k === 'null')
        warnings.push(`“${key}” is null in the sample, so its type is unknown. It was generated as Object — change it to the real type.`);
      else if (t.k === 'any')
        warnings.push(`“${key}” holds values of different types in the sample, so it was generated as Object.`);
      else if (t.k === 'list' && (t.of.k === 'null' || t.of.k === 'any'))
        warnings.push(
          t.of.k === 'null'
            ? `“${key}” is an empty array in the sample, so it was generated as List<Object> — change it to the real item type.`
            : `“${key}” mixes item types in the sample, so it was generated as List<Object>.`,
        );
      const annotation = auraEnabled ? '@AuraEnabled ' : '';
      entry.lines.push(`${annotation}public ${type} ${prop}${getSet ? ' { get; set; }' : ';'}`);
      propertyCount++;
    }
    return name;
  }

  defineClass(core.fields, rootClassName, true);

  const IND = '    ';
  const out: string[] = [];
  out.push('/**');
  out.push(' * Apex wrapper generated by Titrova (JSON to Apex).');
  out.push(' * Types are inferred from one sample payload. Review them before deploying.');
  out.push(' */');
  out.push(`public class ${rootClassName} {`);
  const [root, ...inner] = classes;
  for (const line of root.lines) out.push(IND + line);
  for (const cls of inner) {
    out.push('');
    out.push(`${IND}public class ${cls.name} {`);
    for (const line of cls.lines) out.push(IND + IND + line);
    out.push(`${IND}}`);
  }

  const renameList = [...renames].map(([key, property]) => ({ key, property }));
  if (parseMethod) {
    let returnType = rootClassName;
    for (let d = 0; d < listDepth; d++) returnType = `List<${returnType}>`;
    out.push('');
    out.push(`${IND}public static ${returnType} parse(String jsonString) {`);
    if (renameList.length) {
      out.push(`${IND}${IND}// Some JSON keys are not valid Apex identifiers. Rename them before deserializing.`);
      for (const { key, property } of renameList) {
        const pattern = '"' + escapeRegex(JSON.stringify(key).slice(1, -1)) + '"\\s*:';
        out.push(`${IND}${IND}jsonString = jsonString.replaceAll(${apexString(pattern)}, ${apexString(`"${property}":`)});`);
      }
    }
    out.push(`${IND}${IND}return (${returnType}) JSON.deserialize(jsonString, ${returnType}.class);`);
    out.push(`${IND}}`);
  }
  out.push('}');

  if (renameList.length) {
    warnings.unshift(
      parseMethod
        ? `${renameList.length} JSON ${renameList.length === 1 ? 'key was' : 'keys were'} renamed to valid Apex identifiers. The generated parse() method maps them for you; plain JSON.deserialize will not.`
        : `${renameList.length} JSON ${renameList.length === 1 ? 'key was' : 'keys were'} renamed to valid Apex identifiers. Turn on “parse() method” or map them yourself, because JSON.deserialize matches by name.`,
    );
  }

  return { code: out.join('\n') + '\n', classCount: classes.length, propertyCount, renames: renameList, warnings };
}
