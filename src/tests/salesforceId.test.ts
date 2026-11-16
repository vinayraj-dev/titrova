import { describe, expect, it } from 'vitest';
import { analyzeBatch, analyzeId, idChecksum, splitIds, to18 } from '@/utils/salesforceId';

/**
 * Each expected suffix below was derived by hand from Salesforce's published algorithm:
 * split the 15 characters into three groups of five, read each group right to left as a
 * 5-bit number where an uppercase letter is 1, and look the number up in A–Z,0–5.
 *
 *   001A0000006Vm9r → "001A0" = 01000₂ (8)  → I
 *                     "00000" = 00000₂ (0)  → A
 *                     "6Vm9r" = 00010₂ (2)  → C      → IAC
 */
const VERIFIED: [string, string][] = [
  ['001A0000006Vm9r', '001A0000006Vm9rIAC'],
  ['000000000000000', '000000000000000AAA'],
  ['AAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAA555'],
  ['aaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaAAA'],
  // "0015g" → 0; "00000" → 0; "ABCDE" → 11111₂ (31) → 5
  ['0015g00000ABCDE', '0015g00000ABCDEAA5'],
  // "a0B5g" → pos 2 → 4 → E; "00000" → A; "XyZaB" → pos 0,2,4 → 1+4+16 = 21 → V
  ['a0B5g00000XyZaB', 'a0B5g00000XyZaBEAV'],
  // "Abcde" → 1 → B; "fGhij" → 2 → C; "klmnO" → 16 → Q
  ['AbcdefGhijklmnO', 'AbcdefGhijklmnOBCQ'],
];

describe('Salesforce ID conversion', () => {
  it.each(VERIFIED)('converts %s to %s', (id15, id18) => {
    expect(to18(id15)).toBe(id18);
    expect(analyzeId(id15)).toMatchObject({ status: 'converted', id15, id18 });
  });

  it('computes each checksum character independently', () => {
    expect(idChecksum('A0000' + '0B000' + '0000C')).toBe('BCQ');
  });

  it('recognises valid 18-character IDs and returns the 15-character form', () => {
    const r = analyzeId('001A0000006Vm9rIAC');
    expect(r).toMatchObject({ status: 'valid', id15: '001A0000006Vm9r', id18: '001A0000006Vm9rIAC', prefix: '001' });
  });

  it('accepts a lower-case suffix on an otherwise valid ID', () => {
    expect(analyzeId('001A0000006Vm9riac')).toMatchObject({ status: 'valid', id18: '001A0000006Vm9rIAC' });
  });

  it('restores casing that was lost (for example after a spreadsheet upper-cased the ID)', () => {
    expect(analyzeId('001A0000006VM9RIAC')).toMatchObject({ status: 'repaired', id18: '001A0000006Vm9rIAC' });
    expect(analyzeId('001a0000006vm9riac')).toMatchObject({ status: 'repaired', id15: '001A0000006Vm9r' });
  });

  it('rejects an 18-character ID whose suffix cannot match', () => {
    // Suffix "5AC" says the first five characters are all uppercase letters, but they include digits.
    expect(analyzeId('001A0000006Vm9r5AC').status).toBe('invalid');
    // "9" is not in the checksum alphabet.
    expect(analyzeId('001A0000006Vm9rIA9').status).toBe('invalid');
  });

  it.each(['', '123', '001A0000006Vm9', '001A0000006Vm9rIACX', '001A0000006Vm9!', '001 A000 0006'])(
    'rejects invalid input %j',
    (input) => {
      const r = analyzeId(input);
      expect(r.status).toBe('invalid');
      expect(r.message).toContain('Please enter a valid 15-character or 18-character Salesforce ID.');
    },
  );

  it('splits and converts batches', () => {
    expect(splitIds('001A0000006Vm9r, "0015g00000ABCDE"\n\n a0B5g00000XyZaB;')).toHaveLength(3);
    const results = analyzeBatch('001A0000006Vm9r\nnot-an-id\n0015g00000ABCDEAA5');
    expect(results.map((r) => r.status)).toEqual(['converted', 'invalid', 'valid']);
  });

  it('converts 50,000 IDs quickly', () => {
    const text = Array.from({ length: 50000 }, () => '001A0000006Vm9r').join('\n');
    const start = Date.now();
    expect(analyzeBatch(text)).toHaveLength(50000);
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
