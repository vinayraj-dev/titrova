import { describe, expect, it } from 'vitest';
import { formatSoql, markKeywords, minifySoql, tokenize } from '@/utils/soql';

const fmt = (q: string, o = {}) => formatSoql(q, o).formatted;
const shape = (q: string) => markKeywords(tokenize(q)).map((t) => (t.kw ? t.text.toUpperCase() : t.text));

describe('formatSoql', () => {
  it('puts each clause on its own line and upper-cases keywords', () => {
    expect(fmt("select Id, Name from Account where Name like 'A%' order by Name desc nulls last limit 10 offset 5")).toBe(
      ['SELECT Id, Name', 'FROM Account', "WHERE Name LIKE 'A%'", 'ORDER BY Name DESC NULLS LAST', 'LIMIT 10', 'OFFSET 5'].join('\n'),
    );
  });

  it('lists fields one per line when there are more than three', () => {
    expect(fmt('SELECT Id, Name, Industry, Owner.Name FROM Account')).toBe(
      ['SELECT', '  Id,', '  Name,', '  Industry,', '  Owner.Name', 'FROM Account'].join('\n'),
    );
  });

  it('breaks WHERE conditions at AND / OR and keeps short groups inline', () => {
    expect(fmt("SELECT Id FROM Account WHERE Industry = 'Tech' AND (Rating = 'Hot' OR Rating = 'Warm') AND AnnualRevenue >= 1000")).toBe(
      ['SELECT Id', 'FROM Account', "WHERE Industry = 'Tech'", "  AND (Rating = 'Hot' OR Rating = 'Warm')", '  AND AnnualRevenue >= 1000'].join('\n'),
    );
  });

  it('indents child relationship subqueries', () => {
    expect(fmt('SELECT Id, (SELECT Id, LastName FROM Contacts WHERE Email != null ORDER BY LastName) FROM Account')).toBe(
      [
        'SELECT',
        '  Id,',
        '  (',
        '    SELECT Id, LastName',
        '    FROM Contacts',
        '    WHERE Email != null',
        '    ORDER BY LastName',
        '  )',
        'FROM Account',
      ].join('\n'),
    );
  });

  it('indents semi-join subqueries in WHERE', () => {
    expect(fmt("SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Opportunity WHERE StageName = 'Closed Won') AND Name != null")).toBe(
      [
        'SELECT Id',
        'FROM Account',
        'WHERE Id IN (',
        '    SELECT AccountId',
        '    FROM Opportunity',
        "    WHERE StageName = 'Closed Won'",
        '  )',
        '  AND Name != null',
      ].join('\n'),
    );
  });

  it('formats aggregate queries with GROUP BY and HAVING', () => {
    expect(fmt('select StageName, count(Id) total, sum(Amount) from Opportunity group by StageName having count(Id) > 5 and sum(Amount) > 1000')).toBe(
      [
        'SELECT StageName, COUNT(Id) total, SUM(Amount)',
        'FROM Opportunity',
        'GROUP BY StageName',
        'HAVING COUNT(Id) > 5',
        '  AND SUM(Amount) > 1000',
      ].join('\n'),
    );
    expect(fmt('SELECT COUNT() FROM Lead')).toBe('SELECT COUNT()\nFROM Lead');
    expect(fmt('SELECT LeadSource, COUNT(Name) FROM Lead GROUP BY ROLLUP(LeadSource)')).toContain('GROUP BY ROLLUP(LeadSource)');
  });

  it('keeps bind expressions, date literals and functions intact', () => {
    const out = fmt(
      'SELECT Id, toLabel(Status), FORMAT(Amount) FROM Case WHERE OwnerId = : userId AND AccountId IN :accountIds AND CreatedDate = LAST_N_DAYS:30 AND ClosedDate > 2024-01-01T00:00:00Z AND Amount > -5',
    );
    expect(out).toContain('toLabel(Status)');
    expect(out).toContain('OwnerId = :userId');
    expect(out).toContain('AccountId IN :accountIds');
    expect(out).toContain('CreatedDate = LAST_N_DAYS:30');
    expect(out).toContain('ClosedDate > 2024-01-01T00:00:00Z');
    expect(out).toContain('Amount > -5');
  });

  it('does not treat object names that look like keywords as keywords', () => {
    expect(fmt('select Id from Order order by OrderNumber')).toBe('SELECT Id\nFROM Order\nORDER BY OrderNumber');
    expect(fmt('select Id from Group')).toBe('SELECT Id\nFROM Group');
    expect(fmt('select Id, Type from Case limit 1')).toBe('SELECT Id, Type\nFROM Case\nLIMIT 1');
  });

  it('never changes text inside string literals', () => {
    const out = fmt("SELECT Id FROM Account WHERE Name = 'select  from (where' AND Note__c = 'it\\'s   and or'");
    expect(out).toContain("'select  from (where'");
    expect(out).toContain("'it\\'s   and or'");
  });

  it('supports TYPEOF, WITH, FOR and ALL ROWS', () => {
    const out = fmt(
      'SELECT TYPEOF What WHEN Account THEN Phone, NumberOfEmployees WHEN Opportunity THEN Amount ELSE Name END, Subject FROM Event WHERE IsDeleted = false WITH SECURITY_ENFORCED ORDER BY Subject LIMIT 5 ALL ROWS',
    );
    expect(out).toBe(
      [
        'SELECT',
        '  TYPEOF What',
        '    WHEN Account THEN Phone, NumberOfEmployees',
        '    WHEN Opportunity THEN Amount',
        '    ELSE Name',
        '  END,',
        '  Subject',
        'FROM Event',
        'WHERE IsDeleted = false',
        'WITH SECURITY_ENFORCED',
        'ORDER BY Subject',
        'LIMIT 5',
        'ALL ROWS',
      ].join('\n'),
    );
    expect(fmt('SELECT Id FROM Account LIMIT 1 FOR UPDATE')).toBe('SELECT Id\nFROM Account\nLIMIT 1\nFOR UPDATE');
  });

  it('breaks long parenthesised groups', () => {
    const out = fmt(
      "SELECT Id FROM Account WHERE (BillingCountry = 'United States' AND BillingState = 'California' AND Industry = 'Technology') OR Rating = 'Hot'",
    );
    expect(out).toBe(
      [
        'SELECT Id',
        'FROM Account',
        'WHERE (',
        "    BillingCountry = 'United States'",
        "    AND BillingState = 'California'",
        "    AND Industry = 'Technology'",
        '  )',
        "  OR Rating = 'Hot'",
      ].join('\n'),
    );
  });

  it('respects options', () => {
    expect(fmt('select Id from Account', { uppercaseKeywords: false })).toBe('select Id\nfrom Account');
    expect(fmt('SELECT Id, Name FROM Account', { fieldLayout: 'multi', indent: 4 })).toBe('SELECT\n    Id,\n    Name\nFROM Account');
    expect(fmt('SELECT A, B, C, D, E FROM X__c', { fieldLayout: 'single' })).toBe('SELECT A, B, C, D, E\nFROM X__c');
  });

  it('preserves meaning: the token stream is identical before and after', () => {
    const queries = [
      "SELECT Id,Name,(SELECT Id FROM Contacts WHERE (A__c=1 OR B__c=2) AND C__c IN ('x','y')) FROM Account WHERE NOT (Name LIKE 'a%') AND Owner.Profile.Name='Admin' ORDER BY Name ASC NULLS FIRST,CreatedDate DESC LIMIT :lim OFFSET 10",
      'select count_distinct(OwnerId),calendar_year(CloseDate) y from Opportunity where Amount>1000.50 and CloseDate=THIS_YEAR group by calendar_year(CloseDate) having sum(Amount)>=50000',
      "SELECT Id FROM Contact WHERE Skills__c INCLUDES ('A;B','C') AND Email NOT IN :blocked AND DISTANCE(Loc__c, GEOLOCATION(37.7,-122.4), 'mi') < 20 USING SCOPE mine",
      'SELECT Id FROM KnowledgeArticleVersion WHERE PublishStatus = \'Online\' UPDATE VIEWSTAT',
    ];
    for (const q of queries) {
      const once = fmt(q);
      expect(shape(once)).toEqual(shape(q));
      expect(fmt(once)).toBe(once); // idempotent
      expect(shape(minifySoql(q).formatted)).toEqual(shape(q));
    }
  });

  it('minifies to one line', () => {
    expect(minifySoql('SELECT Id,\n  Name\nFROM Account\nWHERE Id IN (\n SELECT AccountId FROM Contact )').formatted).toBe(
      'SELECT Id, Name FROM Account WHERE Id IN (SELECT AccountId FROM Contact)',
    );
  });

  it('reports structural problems clearly', () => {
    expect(() => fmt('  ')).toThrow('Please enter some input before generating output.');
    expect(() => fmt('UPDATE Account SET x = 1')).toThrow(/must start with SELECT/);
    expect(() => fmt('SELECT Id')).toThrow(/missing a FROM clause/);
    expect(() => fmt('SELECT FROM Account')).toThrow(/SELECT has no fields/);
    expect(() => fmt('SELECT Id,, Name FROM Account')).toThrow(/extra comma/);
    expect(() => fmt('SELECT Id, FROM Account')).toThrow(/extra comma/);
    expect(() => fmt('SELECT Id FROM Account WHERE (Name = 1')).toThrow(/never closed/);
    expect(() => fmt('SELECT Id FROM Account WHERE Name = 1)')).toThrow(/without a matching/);
    expect(() => fmt("SELECT Id FROM Account WHERE Name = 'abc")).toThrow(/closing single quote/);
    expect(() => fmt('SELECT Id FROM Account WHERE')).toThrow(/WHERE has no condition/);
    expect(() => fmt('[SELECT Id FROM Account]')).toThrow(/Unexpected character “\[”/);
  });

  it('warns about clause order without blocking the format', () => {
    const r = formatSoql('SELECT Id FROM Account LIMIT 5 ORDER BY Name');
    expect(r.warnings.join(' ')).toMatch(/ORDER BY is in an unusual position/);
    expect(r.formatted).toContain('LIMIT 5\nORDER BY Name');
  });

  it('formats a very large query', () => {
    const fields = Array.from({ length: 5000 }, (_, i) => `Field_${i}__c`).join(', ');
    const out = fmt(`SELECT ${fields} FROM Big__c`);
    expect(out.split('\n')).toHaveLength(5002);
  });
});
