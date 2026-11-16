import { useEffect, useMemo, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { CopyButton } from '@/components/common/Actions';
import { ErrorNote, Pane, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { toMessage } from '@/utils/errors';
import { parseTimestamp, relativeTime } from '@/utils/timestamp';
import { content, EXAMPLE, EXAMPLES } from './content';

const tool = toolBySlug('timestamp-converter');

export default function TimestampPage() {
  const [input, setInput] = useState(EXAMPLE);
  const [now, setNow] = useState<number | null>(null);
  const [zone, setZone] = useState('');

  useEffect(() => {
    setNow(Date.now());
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const { result, error } = useMemo(() => {
    try {
      return { result: parseTimestamp(input), error: '' };
    } catch (e) {
      return { result: null, error: toMessage(e) };
    }
  }, [input]);

  const localRows =
    result && now !== null
      ? [
          { label: `Local time (${zone})`, value: new Date(result.ms).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'long' }) },
          { label: 'Relative to now', value: relativeTime(result.ms, now) },
        ]
      : [];

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Pane title="Timestamp or date" side="in">
          <div className="grid gap-4 p-4">
            <div>
              <label htmlFor="ts-input" className="label">Unix timestamp, ISO 8601 or HTTP date</label>
              <div className="flex gap-2">
                <input id="ts-input" className="input font-mono" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? 'ts-error' : undefined} />
                <button type="button" className="btn btn-soft shrink-0" onClick={() => { const t = Date.now(); setNow(t); setInput(String(Math.floor(t / 1000))); }}>
                  <Clock size={17} aria-hidden /> Now
                </button>
                <button type="button" className="btn btn-ghost shrink-0 !px-3" aria-label="Clear" onClick={() => setInput('')}>
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
            </div>
            {result && <p className="text-[0.95rem]" role="status">Detected: <strong>{result.detected}</strong></p>}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Examples</span>
              {EXAMPLES.map((ex) => <button key={ex} type="button" className="chip font-mono" onClick={() => setInput(ex)}>{ex}</button>)}
            </div>
            {error && <ErrorNote id="ts-error">{error}</ErrorNote>}
            {result && <WarningList items={result.warnings} />}
          </div>
        </Pane>
        <Pane title="Converted" side="out">
          {result ? (
            <dl className="divide-y divide-line">
              {[...localRows, ...result.rows].map((r) => (
                <div key={r.label} className="line-in grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)_auto]">
                  <dt className="text-sm font-semibold text-muted">{r.label}</dt>
                  <dd className="col-start-1 break-all font-mono text-[0.93rem] sm:col-start-2 sm:row-start-1">{r.value}</dd>
                  <dd className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1"><CopyButton text={r.value} className="!min-h-[2rem] border-transparent" /></dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="grid-bg flex min-h-[18rem] items-center justify-center p-6 text-center">
              <p className="max-w-xs rounded-xl bg-paper/90 px-4 py-3 text-sm text-muted">Enter a timestamp or a date. Every format appears here.</p>
            </div>
          )}
        </Pane>
      </div>
    </ToolShell>
  );
}
