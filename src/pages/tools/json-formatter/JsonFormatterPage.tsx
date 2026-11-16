import { useMemo, useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Segmented, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { formatJson, type JsonFormatOptions } from '@/utils/jsonFormat';
import { content, SAMPLE } from './content';

const tool = toolBySlug('json-formatter');
const kb = (n: number) => (n < 1024 ? `${n} bytes` : `${(n / 1024).toFixed(1)} KB`);

export default function JsonFormatterPage() {
  const [text, setText] = useState(SAMPLE);
  const [mode, setMode] = useState<NonNullable<JsonFormatOptions['mode']>>('format');
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2');
  const [sortKeys, setSortKeys] = useState(false);

  const { result, error } = useMemo(() => {
    try {
      return { result: formatJson(text, { mode, sortKeys, indent: indent === 'tab' ? 'tab' : indent === '4' ? 4 : 2 }), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [text, mode, indent, sortKeys]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="JSON input"
          side="in"
          meta={result ? <span className="inline-flex items-center gap-1 text-copper-ink"><CheckCircle2 size={15} aria-hidden /> Valid JSON</span> : undefined}
          actions={
            <>
              <PasteButton onPaste={setText} />
              <button type="button" className="btn btn-soft btn-sm" disabled={!text} onClick={() => setText('')}>
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="bg-sunken">
            <CodeEditor id="json-fmt-input" label="JSON input" value={text} onChange={setText} lang="json" height="20rem" placeholder='Paste JSON here, for example {"name": "Acme"}' invalid={!!error} describedBy={error ? 'json-fmt-error' : undefined} />
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-line p-4">
            <Segmented label="Output" value={mode} onChange={setMode} options={[{ value: 'format', label: 'Format' }, { value: 'minify', label: 'Minify' }, { value: 'apex', label: 'Apex string' }]} />
            {mode === 'format' && (
              <Segmented label="Indent" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }]} />
            )}
            <Switch label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
          </div>
        </Pane>
        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput
            title="Formatted JSON"
            code={result?.output ?? ''}
            lang={mode === 'apex' ? 'apex' : 'json'}
            fileName={mode === 'apex' ? 'jsonBody.apex' : 'formatted.json'}
            mime={mode === 'apex' ? 'text/plain' : 'application/json'}
            height="26rem"
            meta={result ? `${kb(result.stats.bytes)}, depth ${result.stats.depth}, ${result.stats.keys} keys` : undefined}
            empty="Paste JSON on the left. The formatted result appears here as you type."
          />
          {error && <ErrorNote id="json-fmt-error">{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
        </div>
      </div>
    </ToolShell>
  );
}
