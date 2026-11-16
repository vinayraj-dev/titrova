import { useEffect, useRef, useState } from 'react';
import { Play, Sparkles, Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { jsonToApex, validateRootClassName, type JsonToApexResult } from '@/utils/jsonToApex';
import { content, EXAMPLES } from './content';

const tool = toolBySlug('json-to-apex');
const initial = EXAMPLES[0];
const initialResult = jsonToApex(initial.json, { rootClassName: initial.root, parseMethod: true });

export default function JsonToApexPage() {
  const [json, setJson] = useState(initial.json);
  const [root, setRoot] = useState(initial.root);
  const [parseMethod, setParseMethod] = useState(true);
  const [aura, setAura] = useState(false);
  const [getSet, setGetSet] = useState(false);
  const [result, setResult] = useState<JsonToApexResult | null>(initialResult);
  const [error, setError] = useState('');
  const [runKey, setRunKey] = useState(0);
  const optionsTouched = useRef(false);

  const run = (source = json, rootName = root) => {
    try {
      setResult(jsonToApex(source, { rootClassName: rootName.trim(), parseMethod, auraEnabled: aura, getSet }));
      setError('');
    } catch (e) {
      setResult(null);
      setError(toMessage(e));
    }
    setRunKey((k) => k + 1);
  };

  // Re-run when an option changes, so the output always reflects the switches.
  useEffect(() => {
    if (!optionsTouched.current) {
      optionsTouched.current = true;
      return;
    }
    if (json.trim()) run();
    // Intentionally keyed on the options only: typing in the editor must not re-run.
  }, [parseMethod, aura, getSet]);

  const rootError = validateRootClassName(root.trim());
  const beautify = () => {
    try {
      setJson(JSON.stringify(JSON.parse(json), null, 2));
      setError('');
    } catch {
      run(); // surfaces the precise syntax error
    }
  };

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="JSON input"
          side="in"
          actions={
            <>
              <PasteButton onPaste={(t) => setJson(t)} />
              <button type="button" className="btn btn-soft btn-sm" onClick={beautify} disabled={!json.trim()}>
                <Sparkles size={16} aria-hidden /> Tidy
              </button>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                disabled={!json}
                onClick={() => {
                  setJson('');
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
              id="json-input"
              label="JSON input"
              value={json}
              onChange={setJson}
              lang="json"
              placeholder={'Paste JSON here, for example {"name": "Acme"}'}
              onRun={() => run()}
              describedBy={error ? 'json-error' : undefined}
              invalid={!!error}
            />
          </div>
          <div className="grid gap-4 border-t border-line p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[12rem] flex-1">
                <label htmlFor="root-class" className="label">Root class name</label>
                <input
                  id="root-class"
                  className="input font-mono text-[0.95rem]"
                  value={root}
                  onChange={(e) => setRoot(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && run()}
                  spellCheck={false}
                  autoComplete="off"
                  maxLength={60}
                  aria-invalid={!!rootError}
                  aria-describedby={rootError ? 'root-error' : undefined}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={() => run()}>
                <Play size={17} aria-hidden /> Generate Apex
              </button>
            </div>
            {rootError && <p id="root-error" className="-mt-2 text-sm text-danger">{rootError}</p>}
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <Switch label="parse() method" checked={parseMethod} onChange={setParseMethod} />
              <Switch label="@AuraEnabled" checked={aura} onChange={setAura} />
              <Switch label="{ get; set; }" checked={getSet} onChange={setGetSet} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Try an example</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setJson(ex.json);
                    setRoot(ex.root);
                    run(ex.json, ex.root);
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
            title="Apex output"
            code={result?.code ?? ''}
            lang="apex"
            fileName={`${root.trim() || 'Wrapper'}.cls`}
            runKey={runKey}
            height="27.5rem"
            meta={result ? `${result.classCount} ${result.classCount === 1 ? 'class' : 'classes'}, ${result.propertyCount} ${result.propertyCount === 1 ? 'property' : 'properties'}` : undefined}
            empty="Paste JSON on the left and select Generate Apex. Your wrapper classes appear here."
          />
          {error && <ErrorNote id="json-error">{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
        </div>
      </div>
    </ToolShell>
  );
}
