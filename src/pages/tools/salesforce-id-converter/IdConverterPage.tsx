import { useMemo, useState } from 'react';
import { ArrowRight, CircleAlert, CircleCheck, ListPlus, Trash2, Wrench } from 'lucide-react';
import { CopyButton, DownloadButton, PasteButton } from '@/components/common/Actions';
import { CodeEditor } from '@/components/common/CodeEditor';
import { ErrorNote, InfoNote, Pane } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { KEY_PREFIXES } from '@/data/keyPrefixes';
import { toolBySlug } from '@/data/tools';
import { cn } from '@/utils/io';
import { analyzeBatch, idChecksum, type IdResult, type IdStatus } from '@/utils/salesforceId';
import { content, EXAMPLE_BATCH, EXAMPLE_SINGLE } from './content';

const tool = toolBySlug('salesforce-id-converter');
const MAX_ROWS = 300;

const STATUS: Record<IdStatus, { label: string; cls: string; icon: typeof CircleCheck }> = {
  converted: { label: 'Converted', cls: 'bg-copper/15 text-copper-ink', icon: CircleCheck },
  valid: { label: 'Valid', cls: 'bg-copper/15 text-copper-ink', icon: CircleCheck },
  repaired: { label: 'Casing restored', cls: 'bg-iodine/20 text-iodine-ink', icon: Wrench },
  invalid: { label: 'Invalid', cls: 'bg-danger/15 text-danger', icon: CircleAlert },
};

function StatusBadge({ status }: { status: IdStatus }) {
  const s = STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold', s.cls)}>
      <s.icon size={14} aria-hidden /> {s.label}
    </span>
  );
}

/** Shows how each of the three suffix characters is derived from five characters of the ID. */
function Breakdown({ id15 }: { id15: string }) {
  const suffix = idChecksum(id15);
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {[0, 1, 2].map((g) => {
        const chunk = id15.slice(g * 5, g * 5 + 5).split('');
        const bits = chunk.map((c) => (c >= 'A' && c <= 'Z' ? 1 : 0));
        const value = bits.reduce<number>((sum, b, i) => sum + (b << i), 0);
        return (
          <div key={g} className="line-in rounded-xl bg-sunken p-3" style={{ animationDelay: `${g * 110}ms` }}>
            <div className="flex gap-1">
              {chunk.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    'grid h-9 flex-1 place-items-center rounded-md font-mono text-[0.95rem] font-semibold',
                    bits[i] ? 'bg-copper text-white dark:text-sunken' : 'bg-surface text-muted',
                  )}
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-2 font-mono text-sm text-muted">
              {[...bits].reverse().join('')} = {value}
              <ArrowRight size={14} aria-hidden />
              <span className="rounded-md bg-ink px-2 py-0.5 font-semibold text-paper">{suffix[g]}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SingleResult({ r }: { r: IdResult }) {
  if (r.status === 'invalid' || !r.id18 || !r.id15) return <ErrorNote>{r.message}</ErrorNote>;
  const object = r.prefix ? KEY_PREFIXES[r.prefix] : undefined;
  return (
    <div className="space-y-4" role="status">
      <div>
        <p className="text-sm font-semibold text-muted">18-character ID</p>
        <p className="mt-1 break-all font-mono text-[1.45rem] font-semibold leading-tight sm:text-[1.9rem]" data-testid="id18">
          {r.id15}
          <span className="rounded-md bg-copper/20 px-1 text-copper-ink">{r.id18.slice(15)}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={r.id18} label="Copy 18" />
        <CopyButton text={r.id15} label="Copy 15" />
        <StatusBadge status={r.status} />
      </div>
      <dl className="grid gap-x-6 gap-y-3 border-t border-line pt-4 text-[0.95rem] sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-muted">Detected format</dt>
          <dd>{r.input.length}-character ID. {r.message}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">15-character ID</dt>
          <dd className="break-all font-mono">{r.id15}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-muted">Key prefix</dt>
          <dd>
            <code className="rounded-md bg-sunken px-1.5 py-0.5">{r.prefix}</code>{' '}
            {object ? `is the standard prefix for ${object}.` : 'is not one of the well-known standard prefixes. It may belong to a custom object or a less common standard object.'}
          </dd>
        </div>
      </dl>
      <div>
        <p className="mb-2 text-sm font-semibold text-muted">How the last three characters are calculated</p>
        <Breakdown id15={r.id15} />
      </div>
    </div>
  );
}

function BatchResult({ results }: { results: IdResult[] }) {
  const ok = results.filter((r) => r.status !== 'invalid');
  const bad = results.length - ok.length;
  const all18 = ok.map((r) => r.id18).join('\n');
  const csv = ['input,id15,id18,status', ...results.map((r) => [r.input, r.id15 ?? '', r.id18 ?? '', STATUS[r.status].label].map((v) => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-semibold" role="status">
          {ok.length.toLocaleString('en-US')} of {results.length.toLocaleString('en-US')} converted
          {bad > 0 && <span className="text-danger">, {bad.toLocaleString('en-US')} invalid</span>}
        </p>
        <CopyButton text={all18} label="Copy 18-character IDs" />
        <DownloadButton text={csv} fileName="salesforce-ids.csv" mime="text/csv" label="Download CSV" />
      </div>
      <div className="max-h-[26rem] overflow-auto rounded-xl border border-line" tabIndex={0} aria-label="Conversion results">
        <table className="w-full min-w-[30rem] text-left text-[0.92rem]">
          <thead className="sticky top-0 bg-surface text-muted shadow-[0_1px_0_rgb(var(--line))]">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">Input</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">18-character ID</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {results.slice(0, MAX_ROWS).map((r, i) => (
              <tr key={i} className="line-in" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }} title={r.message}>
                <td className="max-w-[12rem] truncate px-3 py-2 font-mono">{r.input}</td>
                <td className="px-3 py-2 font-mono">
                  {r.id18 ? (
                    <>
                      {r.id18.slice(0, 15)}
                      <span className="font-semibold text-copper-ink">{r.id18.slice(15)}</span>
                    </>
                  ) : (
                    <span className="font-sans text-muted">Not a Salesforce ID</span>
                  )}
                </td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {results.length > MAX_ROWS && (
        <p className="text-sm text-muted">
          Showing the first {MAX_ROWS} rows. Copy and Download include all {results.length.toLocaleString('en-US')}.
        </p>
      )}
    </div>
  );
}

export default function IdConverterPage() {
  const [text, setText] = useState(EXAMPLE_SINGLE);
  const results = useMemo(() => analyzeBatch(text), [text]);

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Pane
          title="Salesforce IDs"
          side="in"
          meta={results.length > 0 ? `${results.length.toLocaleString('en-US')} ${results.length === 1 ? 'ID' : 'IDs'}` : undefined}
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
            <CodeEditor
              id="id-input"
              label="Salesforce IDs, one per line"
              value={text}
              onChange={setText}
              lang="text"
              height="15rem"
              placeholder={'Paste one ID or many, for example\n001A0000006Vm9r'}
            />
          </div>
          <div className="grid gap-3 border-t border-line p-4">
            <p className="text-[0.95rem] text-muted">
              15 or 18 characters, letters and numbers only. Separate several IDs with new lines, commas or spaces. Results update as you type.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Example input</span>
              <button type="button" className="chip" onClick={() => setText(EXAMPLE_SINGLE)}>Single ID</button>
              <button type="button" className="chip" onClick={() => setText(EXAMPLE_BATCH)}>
                <ListPlus size={15} aria-hidden /> Batch with problems
              </button>
            </div>
          </div>
        </Pane>

        <Pane title="Result" side="out">
          <div className="min-h-[22rem] p-4 sm:p-5" key={results.length > 1 ? 'batch' : 'single'}>
            {results.length === 0 ? (
              <div className="grid-bg flex h-full min-h-[19rem] items-center justify-center rounded-xl p-6 text-center">
                <p className="max-w-xs rounded-xl bg-paper/90 px-4 py-3 text-sm text-muted">
                  Please enter a valid 15-character or 18-character Salesforce ID. The converted ID appears here.
                </p>
              </div>
            ) : results.length === 1 ? (
              <SingleResult r={results[0]} />
            ) : (
              <BatchResult results={results} />
            )}
          </div>
        </Pane>
      </div>
      <div className="mt-4">
        <InfoNote>A well-formed ID is not proof that a record exists. Only Salesforce can tell you whether an ID belongs to a real record in your org.</InfoNote>
      </div>
    </ToolShell>
  );
}
