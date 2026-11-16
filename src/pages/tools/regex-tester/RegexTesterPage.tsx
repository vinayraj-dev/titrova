import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CodeEditor } from '@/components/common/CodeEditor';
import { CodeOutput, ErrorNote, Pane, Switch, WarningList } from '@/components/common/Panel';
import { ToolShell } from '@/components/tools/ToolShell';
import { toolBySlug } from '@/data/tools';
import { cn } from '@/utils/io';
import { COMMON_PATTERNS, runRegex, runRegexSafely, toApexPattern, type RegexRun } from '@/utils/regex';
import { content } from './content';

const tool = toolBySlug('regex-tester');
const FLAGS = [
  { f: 'g', label: 'global' },
  { f: 'i', label: 'ignore case' },
  { f: 'm', label: 'multiline' },
  { f: 's', label: 'dot all' },
  { f: 'u', label: 'unicode' },
  { f: 'y', label: 'sticky' },
];
const start = COMMON_PATTERNS[2];

function Highlighted({ text, run }: { text: string; run: RegexRun }) {
  const parts: JSX.Element[] = [];
  let last = 0;
  run.matches.forEach((m, i) => {
    if (m.index > last) parts.push(<Fragment key={`t${i}`}>{text.slice(last, m.index)}</Fragment>);
    parts.push(
      m.text ? (
        <mark key={`m${i}`} className={cn('rounded px-0.5 text-ink', i % 2 ? 'bg-copper/30' : 'bg-iodine/40')}>{m.text}</mark>
      ) : (
        <span key={`m${i}`} className="mx-px inline-block h-4 w-0.5 translate-y-0.5 bg-danger" aria-label="empty match" />
      ),
    );
    last = Math.max(last, m.end);
  });
  parts.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

export default function RegexTesterPage() {
  const [source, setSource] = useState(start.source);
  const [flags, setFlags] = useState(start.flags);
  const [text, setText] = useState(start.sample);
  const [replaceOn, setReplaceOn] = useState(false);
  const [replacement, setReplacement] = useState('$<day>/$<month>/$<year>');
  const [run, setRun] = useState<RegexRun>(() => runRegex(start.source, start.flags, start.sample, null, 1000));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      runRegexSafely(source, flags, text, replaceOn ? replacement : null).then((r) => !cancelled && setRun(r));
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [source, flags, text, replaceOn, replacement]);

  const apex = useMemo(() => toApexPattern(source, flags), [source, flags]);
  const toggle = (f: string) => setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : 'gimsuy'.split('').filter((x) => x === f || cur.includes(x)).join('')));

  return (
    <ToolShell tool={tool} content={content}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="Pattern and test text"
          side="in"
          actions={
            <button type="button" className="btn btn-soft btn-sm" onClick={() => { setSource(''); setText(''); }}>
              <Trash2 size={16} aria-hidden /> Clear
            </button>
          }
        >
          <div className="grid gap-4 p-4">
            <div>
              <label htmlFor="regex-pattern" className="label">Regular expression</label>
              <div className={cn('flex items-center rounded-xl border bg-surface font-mono focus-within:border-copper', run.error ? 'border-danger' : 'border-line')}>
                <span className="pl-3 text-muted" aria-hidden="true">/</span>
                <input id="regex-pattern" className="min-h-[2.75rem] min-w-0 flex-1 bg-transparent px-1 text-[0.95rem] outline-none" value={source} onChange={(e) => setSource(e.target.value)} spellCheck={false} autoComplete="off" aria-invalid={!!run.error} aria-describedby={run.error ? 'regex-error' : undefined} />
                <span className="pr-3 text-muted" aria-hidden="true">/{flags}</span>
              </div>
            </div>
            <fieldset>
              <legend className="label">Flags</legend>
              <div className="flex flex-wrap gap-2">
                {FLAGS.map(({ f, label }) => (
                  <button key={f} type="button" className="chip" aria-pressed={flags.includes(f)} onClick={() => toggle(f)}>
                    <span className="font-mono font-bold">{f}</span> {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Common patterns</span>
              {COMMON_PATTERNS.map((p) => (
                <button key={p.label} type="button" className="chip" onClick={() => { setSource(p.source); setFlags(p.flags); setText(p.sample); }}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="border-y border-line bg-sunken">
            <CodeEditor id="regex-text" softWrap label="Test text" value={text} onChange={setText} lang="text" height="9rem" placeholder="Paste the text to search" />
          </div>
          <div className="grid gap-3 p-4">
            <Switch label="Replace" checked={replaceOn} onChange={setReplaceOn} />
            {replaceOn && (
              <div>
                <label htmlFor="regex-replacement" className="label">Replace with</label>
                <input id="regex-replacement" className="input font-mono text-[0.95rem]" value={replacement} onChange={(e) => setReplacement(e.target.value)} spellCheck={false} autoComplete="off" />
              </div>
            )}
          </div>
        </Pane>

        <div className="flex min-w-0 flex-col gap-4">
          <Pane title="Matches" side="out" meta={run.error ? undefined : `${run.matches.length}${run.truncated ? '+' : ''} ${run.matches.length === 1 ? 'match' : 'matches'}`}>
            <pre tabIndex={0} aria-label="Test text with matches highlighted" className="max-h-[11rem] min-h-[6rem] overflow-auto whitespace-pre-wrap break-words bg-sunken p-4 font-mono text-[13px] leading-relaxed">
              {run.error ? text : <Highlighted text={text} run={run} />}
            </pre>
            {!run.error && run.matches.length > 0 && (
              <div className="max-h-[11rem] overflow-auto border-t border-line" tabIndex={0} aria-label="Match details">
                <table className="w-full text-left text-[0.9rem]">
                  <thead className="sticky top-0 bg-surface text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-semibold">#</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Match</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Position</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Groups</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono">
                    {run.matches.slice(0, 200).map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-1.5 text-muted">{i + 1}</td>
                        <td className="max-w-[10rem] truncate px-4 py-1.5">{m.text || '(empty)'}</td>
                        <td className="px-4 py-1.5 text-muted">{m.index}–{m.end}</td>
                        <td className="px-4 py-1.5">
                          {m.named.length ? m.named.map(([k, v]) => `${k}=${v ?? '∅'}`).join(', ') : m.groups.length ? m.groups.map((g, j) => `$${j + 1}=${g ?? '∅'}`).join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Pane>
          {run.error && <ErrorNote id="regex-error">{run.error}</ErrorNote>}
          {replaceOn && !run.error && run.replaced !== null && (
            <CodeOutput title="Replaced text" code={run.replaced} lang="text" fileName="replaced.txt" height="7rem" empty="" />
          )}
          <CodeOutput title="Apex code" code={run.error || !source ? '' : apex.code} lang="apex" fileName="RegexExample.apex" height="9.5rem" empty="Enter a valid pattern to get Apex code." />
          {!run.error && <WarningList items={apex.notes} />}
        </div>
      </div>
    </ToolShell>
  );
}
