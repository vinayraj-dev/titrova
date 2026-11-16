import { describe, expect, it } from 'vitest';
import { buildPackageXml, parseMembers, validateApiVersion } from '@/utils/packageXml';
import { METADATA_TYPES } from '@/data/metadataTypes';

describe('buildPackageXml', () => {
  it('generates a well-formed package.xml with sorted types and members', () => {
    const { xml, typeCount, memberCount } = buildPackageXml(
      [
        { name: 'CustomObject', members: ['Invoice__c', 'Account'], wildcard: false },
        { name: 'ApexClass', members: [], wildcard: true },
      ],
      '62.0',
    );
    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
        '    <types>',
        '        <members>*</members>',
        '        <name>ApexClass</name>',
        '    </types>',
        '    <types>',
        '        <members>Account</members>',
        '        <members>Invoice__c</members>',
        '        <name>CustomObject</name>',
        '    </types>',
        '    <version>62.0</version>',
        '</Package>',
        '',
      ].join('\n'),
    );
    expect(typeCount).toBe(2);
    expect(memberCount).toBe(3);
  });

  it('parses as XML in the browser DOM', () => {
    const { xml } = buildPackageXml([{ name: 'Layout', members: ['Account-Account Layout', 'A & B <test>'], wildcard: false }], '60.0');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect([...doc.querySelectorAll('members')].map((m) => m.textContent)).toEqual(['A & B <test>', 'Account-Account Layout']);
    expect(doc.querySelector('version')?.textContent).toBe('60.0');
  });

  it('merges duplicate types, removes duplicate members and treats * as the wildcard', () => {
    const { xml, memberCount } = buildPackageXml(
      [
        { name: 'ApexClass', members: ['A', 'B', 'A'], wildcard: false },
        { name: 'ApexClass', members: ['*', 'C'], wildcard: false },
      ],
      '62.0',
    );
    expect(xml.match(/<types>/g)).toHaveLength(1);
    expect(memberCount).toBe(4);
    expect(xml.indexOf('<members>*</members>')).toBeLessThan(xml.indexOf('<members>A</members>'));
  });

  it('skips empty types with a warning and fails when nothing is left', () => {
    const r = buildPackageXml(
      [
        { name: 'Flow', members: [], wildcard: false },
        { name: 'ApexTrigger', members: ['AccountTrigger'], wildcard: false },
      ],
      '62.0',
    );
    expect(r.xml).not.toContain('Flow');
    expect(r.warnings[0]).toMatch(/Flow was left out/);
    expect(() => buildPackageXml([{ name: 'Flow', members: [], wildcard: false }], '62.0')).toThrow(/Add at least one metadata type/);
    expect(() => buildPackageXml([], '62.0')).toThrow(/Add at least one metadata type/);
  });

  it('validates the API version', () => {
    expect(validateApiVersion('62.0')).toBeNull();
    expect(validateApiVersion('')).toMatch(/Enter an API version/);
    expect(validateApiVersion('62')).toMatch(/must look like/);
    expect(validateApiVersion('62.5')).toMatch(/must look like/);
    expect(validateApiVersion('abc')).toMatch(/must look like/);
    expect(() => buildPackageXml([{ name: 'ApexClass', members: [], wildcard: true }], 'v62')).toThrow(/must look like/);
  });

  it('parses typed member lists', () => {
    expect(parseMembers(' A , B\n\nC,')).toEqual(['A', 'B', 'C']);
  });
});

describe('metadata type catalogue', () => {
  it('includes every type required by the specification, without duplicates', () => {
    const names = METADATA_TYPES.map((t) => t.name);
    for (const required of [
      'ApexClass', 'ApexTrigger', 'CustomObject', 'CustomField', 'Flow', 'LightningComponentBundle', 'AuraDefinitionBundle',
      'Layout', 'Profile', 'PermissionSet', 'CustomLabel', 'StaticResource', 'ValidationRule',
    ])
      expect(names).toContain(required);
    expect(new Set(names).size).toBe(names.length);
  });
});
