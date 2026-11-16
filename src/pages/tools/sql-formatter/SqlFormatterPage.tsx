import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Segmented } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { formatSql, SQL_DIALECTS, type SqlDialectId, type SqlFormatOptions } from '@/utils/sqlFormat';
import { content, EXAMPLES } from './content';

const tool = toolBySlug('sql-formatter');

export default function SqlFormatterPage() {
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [dialect, setDialect] = useState<SqlDialectId>('postgresql');
  const [keywordCase, setKeywordCase] = useState<NonNullable<SqlFormatOptions['keywordCase']>>('upper');
  const [indent, setIndent] = useState<'2' | '4'>('2');
  const [style, setStyle] = useState<NonNullable<SqlFormatOptions['style']>>('standard');

  const { output, error } = useMemo(() => {
    try {
      return { output: formatSql(sql, { dialect, keywordCase, indent: indent === '4' ? 4 : 2, style }), error: '' };
    } catch (e) {
      return { output: '', error: toMessage(e) };
    }
  }, [sql, dialect, keywordCase, indent, style]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="SQL input"
          side="in"
          actions={
            <>
              <PasteButton onPaste={setSql} />
              <button type="button" className="btn btn-soft btn-sm" disabled={!sql} onClick={() => setSql('')}>
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="bg-sunken">
            <CodeEditor id="sql-input" label="SQL input" value={sql} onChange={setSql} lang="text" height="13rem" placeholder="Paste SQL, for example select * from accounts" invalid={!!error} describedBy={error ? 'sql-error' : undefined} />
          </div>
          <div className="grid gap-4 border-t border-line p-4">
            <div className="max-w-xs">
              <label htmlFor="sql-dialect" className="label">Dialect</label>
              <select id="sql-dialect" className="input" value={dialect} onChange={(e) => setDialect(e.target.value as SqlDialectId)}>
                {SQL_DIALECTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Segmented label="Keywords" value={keywordCase} onChange={setKeywordCase} options={[{ value: 'upper', label: 'UPPER' }, { value: 'lower', label: 'lower' }, { value: 'preserve', label: 'As typed' }]} />
              <Segmented label="Indent" value={indent} onChange={setIndent} options={[{ value: '2', label: '2' }, { value: '4', label: '4' }]} />
              <Segmented label="Layout" value={style} onChange={setStyle} options={[{ value: 'standard', label: 'Standard' }, { value: 'tabularLeft', label: 'Tabular' }]} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Examples</span>
              {EXAMPLES.map((ex) => <button key={ex.label} type="button" className="chip" onClick={() => setSql(ex.sql)}>{ex.label}</button>)}
            </div>
          </div>
        </Pane>
        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput title="Formatted SQL" code={output} lang="soql" fileName="query.sql" height="30rem" meta={output ? `${output.split('\n').length} lines` : undefined} empty="Paste SQL on the left. The formatted query appears here." />
          {error && <ErrorNote id="sql-error">{error}</ErrorNote>}
        </div>
      </div>
    </ToolShell>
  );
}
