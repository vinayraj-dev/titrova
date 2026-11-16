import { Fragment, useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import type { Block } from '@/data/content';
import { highlight, type Lang } from '@/utils/highlight';
import { CopyButton } from './Actions';

/** Renders `inline code` marked with backticks. */
export function Inline({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) => (i % 2 ? <code key={i}>{part}</code> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

export function CodeSample({ code, lang, label }: { code: string; lang: Lang; label?: string }) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);
  const name = label ?? { apex: 'Apex', soql: 'SOQL', json: 'JSON', xml: 'XML', text: 'Example' }[lang];
  return (
    <figure className="not-prose my-5 overflow-hidden rounded-2xl border border-line bg-sunken">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-1.5 text-sm font-semibold text-muted">
        {name}
        <CopyButton text={code} className="!min-h-[2rem] border-transparent" />
      </figcaption>
      <pre tabIndex={0} aria-label={`${name} example`} className="code-pre p-4">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </figure>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ('h' in b) return <h2 key={i} id={slug(b.h)}>{b.h}</h2>;
        if ('h3' in b) return <h3 key={i}>{b.h3}</h3>;
        if ('p' in b) return <p key={i}><Inline text={b.p} /></p>;
        if ('ul' in b) return <ul key={i}>{b.ul.map((li) => <li key={li}><Inline text={li} /></li>)}</ul>;
        if ('ol' in b) return <ol key={i}>{b.ol.map((li) => <li key={li}><Inline text={li} /></li>)}</ol>;
        if ('code' in b) return <CodeSample key={i} code={b.code} lang={b.lang} label={b.label} />;
        if ('table' in b)
          return (
            <div key={i} className="not-prose my-5 overflow-hidden rounded-2xl border border-line">
              <table className="rtable w-full border-collapse text-left text-[0.93rem]">
                {b.caption && <caption className="border-b border-line bg-sunken px-4 py-2.5 text-left text-sm font-semibold">{b.caption}</caption>}
                <thead className="bg-surface text-muted">
                  <tr>{b.head.map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {b.table.map((row) => (
                    <tr key={row[0]}>{row.map((cell, j) => (j === 0 ? <th key={j} scope="row" className="px-4 py-2.5 align-top font-semibold"><Inline text={cell} /></th> : <td key={j} data-label={b.head[j]} className="px-4 py-2.5 align-top text-ink/85"><Inline text={cell} /></td>))}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        return (
          <p key={i} className="!my-6 flex items-start gap-3 rounded-2xl border border-iodine/40 bg-iodine/10 px-4 py-3.5">
            <Lightbulb size={19} aria-hidden className="mt-1 shrink-0 text-iodine-ink" />
            <span><Inline text={b.note} /></span>
          </p>
        );
      })}
    </>
  );
}
