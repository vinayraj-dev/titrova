import { formatDialect, mysql, plsql, postgresql, sql, sqlite, transactsql } from 'sql-formatter';
import { ToolError } from './errors';

export const SQL_DIALECTS = [
  { id: 'sql', label: 'Standard SQL', dialect: sql },
  { id: 'postgresql', label: 'PostgreSQL', dialect: postgresql },
  { id: 'mysql', label: 'MySQL', dialect: mysql },
  { id: 'transactsql', label: 'SQL Server', dialect: transactsql },
  { id: 'plsql', label: 'Oracle', dialect: plsql },
  { id: 'sqlite', label: 'SQLite', dialect: sqlite },
] as const;
export type SqlDialectId = (typeof SQL_DIALECTS)[number]['id'];

export interface SqlFormatOptions {
  dialect?: SqlDialectId;
  keywordCase?: 'upper' | 'lower' | 'preserve';
  indent?: 2 | 4;
  style?: 'standard' | 'tabularLeft';
}

export function formatSql(query: string, options: SqlFormatOptions = {}): string {
  const { dialect = 'sql', keywordCase = 'upper', indent = 2, style = 'standard' } = options;
  if (!query.trim()) throw new ToolError('Please enter some input before generating output.');
  const d = SQL_DIALECTS.find((x) => x.id === dialect)!.dialect;
  try {
    return formatDialect(query, { dialect: d, keywordCase, tabWidth: indent, indentStyle: style, linesBetweenQueries: 2 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    const pos = /line (\d+) column (\d+)/.exec(msg);
    const token = /«([^»]*)»|Unexpected "([^"]*)"/.exec(msg);
    const what = token ? (token[1] ?? token[2]) : '';
    const near = what === 'EOF' ? 'the query ends too early' : what ? `unexpected “${what}”` : 'it could not be read';
    throw new ToolError(
      `${pos ? `Line ${pos[1]}, column ${pos[2]}: ` : ''}${near}. Check for a missing bracket, quote or keyword, or try a different SQL dialect.`,
    );
  }
}
