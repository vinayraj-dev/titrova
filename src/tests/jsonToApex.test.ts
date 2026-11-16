import { describe, expect, it } from 'vitest';
import { jsonToApex, singularize, toApexIdentifier, validateRootClassName } from '@/utils/jsonToApex';
import { parseJson } from '@/utils/jsonParser';

const gen = (json: unknown | string, opts = {}) =>
  jsonToApex(typeof json === 'string' ? json : JSON.stringify(json), { rootClassName: 'Root', ...opts });

describe('parseJson', () => {
  it('keeps number text so 1 and 1.0 stay distinguishable', () => {
    const node = parseJson('{"a": 1, "b": 1.0}');
    expect(node).toEqual({
      t: 'object',
      entries: [
        ['a', { t: 'number', raw: '1' }],
        ['b', { t: 'number', raw: '1.0' }],
      ],
    });
  });

  it.each([
    ['{"a": 1,}', /trailing comma/],
    ["{'a': 1}", /double quotes/],
    ['{"a": "x}', /closing quotation mark/],
    ['{"a": 1', /closing “}”/],
    ['[1, 2', /closing “]”/],
    ['{"a" 1}', /Expected “:”/],
    ['{} extra', /after the end/],
    ['', /ends before/],
  ])('reports a helpful error for %s', (input, pattern) => {
    expect(() => parseJson(input)).toThrow(pattern);
    expect(() => parseJson(input)).toThrow(/Invalid JSON input at line \d+, column \d+/);
  });

  it('reports the line of the error', () => {
    expect(() => parseJson('{\n  "a": 1,\n  "b": oops\n}')).toThrow(/line 3, column 8/);
  });
});

describe('jsonToApex', () => {
  it('maps primitive types', () => {
    const { code } = gen('{"name":"Acme","count":3,"big":3000000000,"price":9.5,"ratio":1.0,"exp":1e3,"active":true}');
    expect(code).toContain('public String name;');
    expect(code).toContain('public Integer count;');
    expect(code).toContain('public Long big;');
    expect(code).toContain('public Decimal price;');
    expect(code).toContain('public Decimal ratio;');
    expect(code).toContain('public Decimal exp;');
    expect(code).toContain('public Boolean active;');
  });

  it('generates inner classes for nested objects', () => {
    const { code, classCount } = gen({ account: { owner: { name: 'A' } } });
    expect(code).toContain('public Account account;');
    expect(code).toContain('public class Account {');
    expect(code).toContain('public Owner owner;');
    expect(code).toContain('public class Owner {');
    expect(classCount).toBe(3);
  });

  it('generates singular class names for arrays of objects and merges their keys', () => {
    const { code } = gen({ contacts: [{ id: 1 }, { id: 2, email: 'a@b.co' }], categories: [{ label: 'x' }] });
    expect(code).toContain('public List<Contact> contacts;');
    expect(code).toContain('public class Contact {');
    expect(code).toContain('public Integer id;');
    expect(code).toContain('public String email;');
    expect(code).toContain('public List<Category> categories;');
  });

  it('handles arrays of primitives, nested arrays and number widening', () => {
    const { code } = gen({ tags: ['a'], matrix: [[1, 2], [3.5]], ids: [1, 5000000000] });
    expect(code).toContain('public List<String> tags;');
    expect(code).toContain('public List<List<Decimal>> matrix;');
    expect(code).toContain('public List<Long> ids;');
  });

  it('handles null values, empty arrays, mixed arrays and empty objects with warnings', () => {
    const { code, warnings } = gen({ middleName: null, items: [], mixed: [1, 'a'], meta: {} });
    expect(code).toContain('public Object middleName;');
    expect(code).toContain('public List<Object> items;');
    expect(code).toContain('public List<Object> mixed;');
    expect(code).toContain('public Meta meta;');
    expect(code).toMatch(/public class Meta \{\n {4}\}/);
    expect(warnings.join('\n')).toMatch(/middleName.*null/);
    expect(warnings.join('\n')).toMatch(/items.*empty array/);
    expect(warnings.join('\n')).toMatch(/Meta has no properties/);
  });

  it('uses the non-null type when a value is null in one array item only', () => {
    const { code } = gen({ rows: [{ v: null }, { v: 'x' }] });
    expect(code).toContain('public String v;');
  });

  it('renames reserved words and invalid identifiers, and maps them in parse()', () => {
    const { code, renames, warnings } = gen({ class: 'A', 'first-name': 'B', '2fa': true, Custom__c: 1, limit: 5 });
    expect(code).toContain('public String class_x;');
    expect(code).toContain('public String first_name;');
    expect(code).toContain('public Boolean x2fa;');
    expect(code).toContain('public Integer Custom_c;');
    expect(code).toContain('public Integer limit_x;');
    expect(code).toContain(`jsonString = jsonString.replaceAll('"class"\\\\s*:', '"class_x":');`);
    expect(code).toContain(`jsonString = jsonString.replaceAll('"first-name"\\\\s*:', '"first_name":');`);
    expect(renames).toHaveLength(5);
    expect(warnings[0]).toMatch(/5 JSON keys were renamed/);
  });

  it('resolves properties that collide after sanitising (Apex is case-insensitive)', () => {
    const { code } = gen({ 'user-id': 1, user_id: 2, Name: 'a', name: 'b' });
    const props = [...code.matchAll(/public \w+ (\w+);/g)].map((m) => m[1].toLowerCase());
    expect(new Set(props).size).toBe(props.length);
    expect(props).toHaveLength(4);
  });

  it('gives different shapes with the same key different class names and reuses identical shapes', () => {
    const { code } = gen({ a: { address: { city: 'X' } }, b: { address: { zip: 1 } }, c: { address: { city: 'Y' } } });
    expect(code).toContain('public class Address {');
    expect(code).toContain('public class Address2 {');
    expect(code).not.toContain('Address3');
  });

  it('never names an inner class after the root class or an Apex system type', () => {
    const { code } = gen({ root: { a: 1 }, string: { b: 1 }, list: [{ c: 1 }] });
    expect(code).toContain('public class Root2 {');
    expect(code).toContain('public class StringData {');
    expect(code).toContain('public class ListData {');
  });

  it('supports a top-level array of objects', () => {
    const { code } = gen([{ id: 1 }, { id: 2, name: 'x' }]);
    expect(code).toContain('public static List<Root> parse(String jsonString)');
    expect(code).toContain('return (List<Root>) JSON.deserialize(jsonString, List<Root>.class);');
    expect(code).toContain('public String name;');
  });

  it('applies options', () => {
    const { code } = gen({ a: 1 }, { auraEnabled: true, getSet: true, parseMethod: false, rootClassName: 'OrderResponse' });
    expect(code).toContain('public class OrderResponse {');
    expect(code).toContain('@AuraEnabled public Integer a { get; set; }');
    expect(code).not.toContain('parse(');
  });

  it('produces balanced braces and only legal identifiers', () => {
    const { code } = gen({ 'weird key!': [{ 'än': 1, '': 2, _x_: 3 }], 'a.b': { 'c d': null } });
    expect(code.split('{').length).toBe(code.split('}').length);
    for (const m of code.matchAll(/public (?:class |[\w<>]+ )(\w+)/g)) {
      expect(m[1]).toMatch(/^[A-Za-z][A-Za-z0-9_]*$/);
      expect(m[1]).not.toMatch(/__|_$/);
    }
  });

  it('rejects empty input, primitives, empty arrays and bad class names with clear messages', () => {
    expect(() => gen('   ')).toThrow('Please enter some input before generating output.');
    expect(() => gen('42')).toThrow(/must be an object or an array of objects/);
    expect(() => gen('[]')).toThrow(/top-level array is empty/);
    expect(() => gen('{"a":1}', { rootClassName: '1Bad' })).toThrow(/must start with a letter/);
    expect(() => gen('{"a":1}', { rootClassName: 'class' })).toThrow(/reserved word/);
    expect(() => gen('{"a": }')).toThrow(/Invalid JSON input/);
  });

  it('handles a large payload quickly', () => {
    const big = { rows: Array.from({ length: 20000 }, (_, i) => ({ id: i, name: 'n' + i, tags: ['a', 'b'], nested: { ok: true } })) };
    const start = Date.now();
    const { code } = gen(big);
    expect(code).toContain('public List<Row> rows;');
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

describe('helpers', () => {
  it('singularizes common plurals', () => {
    expect(['items', 'categories', 'addresses', 'statuses', 'cases', 'boxes', 'data', 'status', 'sizes'].map(singularize)).toEqual([
      'item', 'category', 'address', 'status', 'case', 'box', 'data', 'status', 'size',
    ]);
  });
  it('sanitises identifiers', () => {
    expect(toApexIdentifier('first name')).toBe('first_name');
    expect(toApexIdentifier('__weird__')).toBe('weird');
    expect(toApexIdentifier('123')).toBe('x123');
    expect(toApexIdentifier('$$$')).toBe('field');
    expect(toApexIdentifier('Select')).toBe('Select_x');
  });
  it('validates root class names', () => {
    expect(validateRootClassName('OrderResponse')).toBeNull();
    expect(validateRootClassName('')).toMatch(/Enter/);
    expect(validateRootClassName('A__B')).toMatch(/single underscores/);
    expect(validateRootClassName('A'.repeat(41))).toMatch(/40 characters/);
  });
});
