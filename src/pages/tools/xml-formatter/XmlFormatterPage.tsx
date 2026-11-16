import { useMemo, useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Segmented } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { formatXml } from '@/utils/xmlFormat';
import { content, SAMPLE } from './content';

const tool = toolBySlug('xml-formatter');

export default function XmlFormatterPage() {
  const [xml, setXml] = useState(SAMPLE);
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('4');

  const { result, error } = useMemo(() => {
    try {
      return { result: formatXml(xml, { mode, indent: indent === 'tab' ? 'tab' : indent === '2' ? 2 : 4 }), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [xml, mode, indent]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="XML input"
          side="in"
          meta={result ? <span className="inline-flex items-center gap-1 text-copper-ink"><CheckCircle2 size={15} aria-hidden /> Well-formed</span> : undefined}
          actions={
            <>
              <PasteButton onPaste={setXml} />
              <button type="button" className="btn btn-soft btn-sm" disabled={!xml} onClick={() => setXml('')}>
                <Trash2 size={16} aria-hidden /> Clear
              </button>
            </>
          }
        >
          <div className="bg-sunken">
            <CodeEditor id="xml-input" label="XML input" value={xml} onChange={setXml} lang="xml" height="20rem" placeholder="Paste XML, for example <root><item>1</item></root>" invalid={!!error} describedBy={error ? 'xml-error' : undefined} />
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-line p-4">
            <Segmented label="Output" value={mode} onChange={setMode} options={[{ value: 'format', label: 'Format' }, { value: 'minify', label: 'Minify' }]} />
            {mode === 'format' && <Segmented label="Indent" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }]} />}
          </div>
        </Pane>
        <div className="flex min-w-0 flex-col gap-4">
          <CodeOutput
            title="Formatted XML"
            code={result?.output ?? ''}
            lang="xml"
            fileName="formatted.xml"
            mime="application/xml"
            height="26rem"
            meta={result ? `${result.stats.elements} elements, depth ${result.stats.depth}` : undefined}
            empty="Paste XML on the left. The formatted result appears here as you type."
          />
          {error && <ErrorNote id="xml-error">{error}</ErrorNote>}
        </div>
      </div>
    </ToolShell>
  );
}
