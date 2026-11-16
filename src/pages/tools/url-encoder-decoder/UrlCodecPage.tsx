import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Segmented } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { parseUrl, urlDecode, urlEncode, type ParsedUrl, type UrlMode } from '@/utils/urlCodec';
import { content } from './content';

const tool = toolBySlug('url-encoder-decoder');

export default function UrlCodecPage() {
  const [dir, setDir] = useState<'encode' | 'decode'>('decode');
  const [mode, setMode] = useState<UrlMode>('component');
  const [text, setText] = useState('https://example.my.salesforce.com/services/data/v62.0/query?q=SELECT%20Id%2C%20Name%20FROM%20Account%20WHERE%20Name%20%3D%20%27Acme%20%26%20Sons%27&batch=200');

  const { output, error } = useMemo(() => {
    if (!text) return { output: '', error: '' };
    try {
      return { output: dir === 'encode' ? urlEncode(text, mode) : urlDecode(text, mode), error: '' };
    } catch (e) {
      return { output: '', error: toMessage(e) };
    }
  }, [text, dir, mode]);

  const parsed: ParsedUrl | null = useMemo(() => {
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text.trim())) return null;
    try {
      return parseUrl(text);
    } catch {
      return null;
    }
  }, [text]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title={dir === 'encode' ? 'Text to encode' : 'Text to decode'}
          side="in"
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
            <CodeEditor id="url-input" softWrap label={dir === 'encode' ? 'Text to encode' : 'Text to decode'} value={text} onChange={setText} lang="text" height="11rem" placeholder="Paste text or a URL" invalid={!!error} describedBy={error ? 'url-error' : undefined} />
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-line p-4">
            <Segmented label="Direction" value={dir} onChange={(d) => { if (output && !error) setText(output); setDir(d); }} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
            <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'component', label: 'Component' }, { value: 'uri', label: 'Whole URL' }, { value: 'form', label: 'Form / Apex' }]} />
          </div>
        </Pane>
        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput title={dir === 'encode' ? 'Encoded' : 'Decoded'} code={output} lang="text" fileName={dir === 'encode' ? 'encoded.txt' : 'decoded.txt'} height="14.5rem" meta={output ? `${output.length.toLocaleString('en-US')} characters` : undefined} empty="Type or paste text on the left. The result appears here." />
          {error && <ErrorNote id="url-error">{error}</ErrorNote>}
        </div>
      </div>
      {parsed && (
        <section className="mt-4 grid gap-4 md:grid-cols-2" aria-label="URL breakdown">
          <div className="card overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 font-sans text-[0.95rem] font-semibold tracking-normal">URL parts</h2>
            <dl className="divide-y divide-line text-[0.93rem]">
              {parsed.parts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-4 py-2">
                  <dt className="font-semibold text-muted">{k}</dt>
                  <dd className="break-all font-mono">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 font-sans text-[0.95rem] font-semibold tracking-normal">Query parameters ({parsed.params.length})</h2>
            {parsed.params.length ? (
              <dl className="divide-y divide-line text-[0.93rem]">
                {parsed.params.map(([k, v], i) => (
                  <div key={i} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-4 py-2">
                    <dt className="break-all font-mono font-semibold">{k}</dt>
                    <dd className="break-all font-mono">{v || '(empty)'}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-4 py-3 text-muted">This URL has no query parameters.</p>
            )}
          </div>
        </section>
      )}
    </ToolShell>
  );
}
