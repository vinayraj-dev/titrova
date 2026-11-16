import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { curlToApex } from '@/utils/curlToApex';
import { toMessage } from '@/utils/errors';
import { content, EXAMPLES } from './content';

const tool = toolBySlug('curl-to-apex');

export default function CurlToApexPage() {
  const [cmd, setCmd] = useState(EXAMPLES[0].cmd);
  const [nc, setNc] = useState('');
  const [wrap, setWrap] = useState(true);
  const [mock, setMock] = useState(true);

  const { result, error } = useMemo(() => {
    try {
      return { result: curlToApex(cmd, { namedCredential: nc, wrapInClass: wrap, includeMock: mock }), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [cmd, nc, wrap, mock]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="cURL command"
          side="in"
          actions={
            <>
              <PasteButton onPaste={setCmd} />
              <button type="button" className="btn btn-soft btn-sm" disabled={!cmd} onClick={() => setCmd('')}>
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="bg-sunken">
            <CodeEditor id="curl-input" softWrap label="cURL command" value={cmd} onChange={setCmd} lang="text" height="14rem" placeholder="curl -X POST https://api.example.com/v1/orders -H 'Content-Type: application/json' -d '{...}'" invalid={!!error} describedBy={error ? 'curl-error' : undefined} />
          </div>
          <div className="grid gap-4 border-t border-line p-4">
            <div>
              <label htmlFor="named-credential" className="label">Named Credential (optional)</label>
              <input id="named-credential" className="input font-mono text-[0.95rem]" placeholder="For example Orders_API" value={nc} onChange={(e) => setNc(e.target.value)} spellCheck={false} autoComplete="off" />
              <p className="mt-1.5 text-sm text-muted">Recommended. The endpoint becomes callout:Name/… and the secret stays out of your code.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <Switch label="Wrap in a class" checked={wrap} onChange={setWrap} />
              <Switch label="Add mock and test" checked={mock} onChange={setMock} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Try an example</span>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} type="button" className="chip" onClick={() => setCmd(ex.cmd)}>{ex.label}</button>
              ))}
            </div>
          </div>
        </Pane>
        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput
            title="Apex callout"
            code={result?.code ?? ''}
            lang="apex"
            fileName={`${result?.className ?? 'Callout'}.cls`}
            height="29rem"
            meta={result ? `${result.code.trimEnd().split('\n').length} lines` : undefined}
            empty="Paste a cURL command on the left. The Apex callout appears here."
          />
          {error && <ErrorNote id="curl-error">{error}</ErrorNote>}
          {result && <WarningList items={result.warnings} />}
        </div>
      </div>
    </ToolShell>
  );
}
