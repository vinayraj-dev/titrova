import { useEffect, useRef, useState } from 'react';
import { Minimize2, Play, Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, InfoNote, Pane, Segmented, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { formatSoql, minifySoql, type SoqlFormatOptions, type SoqlFormatResult } from '@/utils/soql';
import { content, EXAMPLES } from './content';

const tool = toolBySlug('soql-formatter');
const initialResult = formatSoql(EXAMPLES[0].query);

export default function SoqlFormatterPage() {
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [upper, setUpper] = useState(true);
  const [layout, setLayout] = useState<NonNullable<SoqlFormatOptions['fieldLayout']>>('auto');
  const [indent, setIndent] = useState<'2' | '4'>('2');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [result, setResult] = useState<SoqlFormatResult | null>(initialResult);
  const [error, setError] = useState('');
  const [runKey, setRunKey] = useState(0);
  const touched = useRef(false);

  const run = (source = query, as = mode) => {
    const options: SoqlFormatOptions = { uppercaseKeywords: upper, fieldLayout: layout, indent: indent === '4' ? 4 : 2 };
    try {
      setResult(as === 'minify' ? minifySoql(source, options) : formatSoql(source, options));
      setError('');
    } catch (e) {
      setResult(null);
      setError(toMessage(e));
    }
    setMode(as);
    setRunKey((k) => k + 1);
  };

  useEffect(() => {
    if (!touched.current) {
      touched.current = true;
      return;
    }
    if (query.trim()) run();
    // Intentionally keyed on the options only: typing in the editor must not re-run.
  }, [upper, layout, indent]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="SOQL input"
          side="in"
          actions={
            <>
              <PasteButton onPaste={setQuery} />
              <button
                type="button"
                className="btn btn-soft btn-sm"
                disabled={!query}
                onClick={() => {
                  setQuery('');
                  setResult(null);
                  setError('');
                }}
              >
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="bg-sunken">
            <CodeEditor
              id="soql-input"
              label="SOQL input"
              value={query}
              onChange={setQuery}
              lang="soql"
              height="15rem"
              placeholder="Paste a query, for example SELECT Id, Name FROM Account"
              onRun={() => run(query, 'format')}
              describedBy={error ? 'soql-error' : undefined}
              invalid={!!error}
            />
          </div>
          <div className="grid gap-4 border-t border-line p-4">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => run(query, 'format')}>
                <Play size={17} aria-hidden /> Format query
              </button>
              <button type="button" className="btn btn-soft" onClick={() => run(query, 'minify')}>
                <Minimize2 size={17} aria-hidden /> Minify
              </button>
            </div>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Segmented
                label="Field list"
                value={layout}
                onChange={setLayout}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'multi', label: 'One per line' },
                  { value: 'single', label: 'One line' },
                ]}
              />
              <Segmented
                label="Indent"
                value={indent}
                onChange={setIndent}
                options={[
                  { value: '2', label: '2 spaces' },
                  { value: '4', label: '4 spaces' },
                ]}
              />
              <Switch label="Upper-case keywords" checked={upper} onChange={setUpper} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Example queries</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setQuery(ex.query);
                    run(ex.query, 'format');
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </Pane>

        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput
            title={mode === 'minify' ? 'Minified query' : 'Formatted query'}
            code={result?.formatted ?? ''}
            lang="soql"
            fileName="query.soql"
            runKey={runKey}
            height="27rem"
            meta={result ? `${result.formatted.split('\n').length} ${result.formatted.includes('\n') ? 'lines' : 'line'}` : undefined}
            empty="Paste a query on the left and select Format query. The formatted SOQL appears here."
          />
          {error && <ErrorNote id="soql-error">{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
          <InfoNote>Checks here cover structure only. Field and object names can only be verified by running the query in your org.</InfoNote>
        </div>
      </div>
    </ToolShell>
  );
}
