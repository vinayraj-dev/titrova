import { apexString, isReservedWord, isValidApiName } from './apex';
import { ToolError } from './errors';

export const FIELD_TYPES = [
  'String',
  'Integer',
  'Decimal',
  'Boolean',
  'Date',
  'DateTime',
  'Email',
  'Phone',
  'Picklist',
  'Lookup ID',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldSpec {
  name: string;
  type: FieldType;
  value: string;
  /** Append the loop index so every record gets a different value (String and Email only). */
  unique?: boolean;
}

export type OutputMode = 'factory' | 'testSetup' | 'snippet';

export interface TestDataOptions {
  objectName: string;
  fields: FieldSpec[];
  count: number;
  mode: OutputMode;
  doInsert: boolean;
}

export interface TestDataResult {
  code: string;
  fileName: string;
  warnings: string[];
}

const ID_PATTERN = /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/;
const APEX_REFERENCE = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*(?:\[\d+\](?:\.[A-Za-z][A-Za-z0-9_]*)*)?$/;

function validDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Build the Apex expression for one field value. `indexVar` is the loop variable, or null outside a loop. */
export function fieldExpression(field: FieldSpec, indexVar: string | null): { expr: string; warning?: string } {
  const raw = field.value.trim();
  const label = `“${field.name}”`;
  switch (field.type) {
    case 'String':
    case 'Phone':
    case 'Picklist': {
      const text = raw || (field.type === 'String' ? `Test ${field.name.replace(/__c$/, '').replace(/_/g, ' ')}` : '');
      if (!text) throw new ToolError(`Enter a sample value for ${label}.`);
      if (field.type === 'String' && field.unique && indexVar) return { expr: `${apexString(text + ' ')} + ${indexVar}` };
      return { expr: apexString(text) };
    }
    case 'Email': {
      const text = raw || 'test.user@example.com';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
        throw new ToolError(`${label} needs an email address such as test.user@example.com.`);
      if (field.unique && indexVar) {
        const at = text.lastIndexOf('@');
        return { expr: `${apexString(text.slice(0, at))} + ${indexVar} + ${apexString(text.slice(at))}` };
      }
      return { expr: apexString(text) };
    }
    case 'Integer':
      if (!/^-?\d+$/.test(raw)) throw new ToolError(`${label} needs a whole number such as 10.`);
      if (Math.abs(Number(raw)) > 2147483647) throw new ToolError(`${label} is outside the range of an Apex Integer.`);
      return { expr: raw };
    case 'Decimal':
      if (!/^-?\d+(\.\d+)?$/.test(raw)) throw new ToolError(`${label} needs a number such as 1500.50.`);
      return { expr: raw };
    case 'Boolean':
      if (!/^(true|false)$/i.test(raw)) throw new ToolError(`${label} must be true or false.`);
      return { expr: raw.toLowerCase() };
    case 'Date': {
      if (!raw || /^today$/i.test(raw)) return { expr: 'Date.today()' };
      const rel = /^today\s*([+-])\s*(\d+)$/i.exec(raw);
      if (rel) return { expr: `Date.today().addDays(${rel[1] === '-' ? '-' : ''}${Number(rel[2])})` };
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
      if (!m || !validDate(+m[1], +m[2], +m[3]))
        throw new ToolError(`${label} needs a date as YYYY-MM-DD, or “today”, “today+30”, “today-7”.`);
      return { expr: `Date.newInstance(${+m[1]}, ${+m[2]}, ${+m[3]})` };
    }
    case 'DateTime': {
      if (!raw || /^now$/i.test(raw)) return { expr: 'DateTime.now()' };
      const rel = /^now\s*([+-])\s*(\d+)$/i.exec(raw);
      if (rel) return { expr: `DateTime.now().addDays(${rel[1] === '-' ? '-' : ''}${Number(rel[2])})` };
      const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
      if (!m || !validDate(+m[1], +m[2], +m[3]) || +m[4] > 23 || +m[5] > 59 || +(m[6] ?? 0) > 59)
        throw new ToolError(`${label} needs a date and time as YYYY-MM-DD HH:MM, or “now”, “now+1”, “now-7”.`);
      return { expr: `DateTime.newInstance(${+m[1]}, ${+m[2]}, ${+m[3]}, ${+m[4]}, ${+m[5]}, ${+(m[6] ?? 0)})` };
    }
    case 'Lookup ID': {
      if (!raw) throw new ToolError(`${label} needs a record ID or an Apex variable such as parentAccount.Id.`);
      if (ID_PATTERN.test(raw) && /\d/.test(raw.slice(0, 3)))
        return {
          expr: apexString(raw),
          warning: `${label} uses a hard-coded ID. Record IDs differ between orgs, so tests should create the parent record instead.`,
        };
      if (!APEX_REFERENCE.test(raw))
        throw new ToolError(`${label} needs a 15 or 18 character record ID, or an Apex variable such as parentAccount.Id.`);
      return {
        expr: raw,
        warning: `${label} refers to ${raw}. Make sure that variable exists where you paste this code.`,
      };
    }
  }
}

function baseName(objectName: string): string {
  const withoutSuffix = objectName.replace(/__(c|mdt|e|b|x)$/i, '');
  const withoutNamespace = withoutSuffix.includes('__') ? withoutSuffix.split('__').pop()! : withoutSuffix;
  return withoutNamespace.replace(/_/g, '');
}

function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  return word + 's';
}

export function generateTestData(options: TestDataOptions): TestDataResult {
  const objectName = options.objectName.trim();
  if (!objectName) throw new ToolError('Enter the API name of the object, for example Account or Invoice__c.');
  if (!isValidApiName(objectName))
    throw new ToolError('The object API name can contain only letters, numbers and underscores, and must start with a letter.');
  const fields = options.fields.filter((f) => f.name.trim());
  if (!fields.length) throw new ToolError('Add at least one field with an API name before generating code.');
  const count = Math.floor(options.count);
  if (!Number.isFinite(count) || count < 1 || count > 10000)
    throw new ToolError('The number of records must be between 1 and 10,000.');

  const seen = new Set<string>();
  for (const f of fields) {
    const name = f.name.trim();
    if (!isValidApiName(name)) throw new ToolError(`“${name}” is not a valid field API name.`);
    if (seen.has(name.toLowerCase())) throw new ToolError(`The field “${name}” is listed more than once.`);
    seen.add(name.toLowerCase());
  }

  const warnings: string[] = [];
  const base = baseName(objectName);
  const plural = pluralize(base);
  let listVar = plural[0].toLowerCase() + plural.slice(1);
  if (isReservedWord(listVar)) listVar += 'List';
  const I = '    ';
  const useLoop = options.mode !== 'snippet' || count > 1;

  const assignments = (indexVar: string | null, indent: string): string[] =>
    fields.map((f, i) => {
      const { expr, warning } = fieldExpression({ ...f, name: f.name.trim() }, indexVar);
      if (warning) warnings.push(warning);
      return `${indent}${f.name.trim()} = ${expr}${i < fields.length - 1 ? ',' : ''}`;
    });

  const loop = (limit: string, indent: string): string[] => [
    `${indent}List<${objectName}> ${listVar} = new List<${objectName}>();`,
    `${indent}for (Integer i = 0; i < ${limit}; i++) {`,
    `${indent}${I}${listVar}.add(new ${objectName}(`,
    ...assignments('i', indent + I + I),
    `${indent}${I}));`,
    `${indent}}`,
  ];

  const lines: string[] = [];
  let fileName = `${base}TestData.apex`;

  if (options.mode === 'factory') {
    const className = `${base}TestDataFactory`.slice(0, 40);
    fileName = `${className}.cls`;
    lines.push(
      '/**',
      ` * Test data factory for ${objectName}. Generated by Titrova.`,
      ' * Adjust the values for your org\'s required fields, validation rules and relationships.',
      ' */',
      '@IsTest',
      `public class ${className} {`,
      `${I}public static List<${objectName}> create${plural}(Integer count, Boolean doInsert) {`,
      ...loop('count', I + I),
      `${I}${I}if (doInsert) {`,
      `${I}${I}${I}insert ${listVar};`,
      `${I}${I}}`,
      `${I}${I}return ${listVar};`,
      `${I}}`,
      '}',
    );
  } else if (options.mode === 'testSetup') {
    const className = `${base}Test`.slice(0, 40);
    fileName = `${className}.cls`;
    lines.push(
      '/**',
      ` * Test class skeleton with shared ${objectName} records. Generated by Titrova.`,
      ' * Adjust the values for your org\'s required fields, validation rules and relationships.',
      ' */',
      '@IsTest',
      `private class ${className} {`,
      `${I}@TestSetup`,
      `${I}static void setupTestData() {`,
      ...loop(String(count), I + I),
      `${I}${I}insert ${listVar};`,
      `${I}}`,
      '',
      `${I}@IsTest`,
      `${I}static void createsTestRecords() {`,
      `${I}${I}List<${objectName}> ${listVar} = [SELECT Id FROM ${objectName}];`,
      `${I}${I}Assert.areEqual(${count}, ${listVar}.size(), 'Expected ${count} ${objectName} record${count === 1 ? '' : 's'} from test setup.');`,
      `${I}}`,
      '}',
    );
    if (!options.doInsert)
      warnings.push('A @TestSetup method only shares records that are inserted, so this mode always inserts.');
  } else if (useLoop) {
    lines.push(...loop(String(count), ''));
    if (options.doInsert) lines.push(`insert ${listVar};`);
  } else {
    let recordVar = base[0].toLowerCase() + base.slice(1);
    if (isReservedWord(recordVar) || recordVar.toLowerCase() === objectName.toLowerCase()) recordVar += 'Record';
    lines.push(`${objectName} ${recordVar} = new ${objectName}(`, ...assignments(null, I), ');');
    if (options.doInsert) lines.push(`insert ${recordVar};`);
  }

  return { code: lines.join('\n') + '\n', fileName, warnings: [...new Set(warnings)] };
}
