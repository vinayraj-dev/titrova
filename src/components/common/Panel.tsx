import { useMemo, type ReactNode } from 'react';
import { AlertTriangle, CircleAlert, Info } from 'lucide-react';
import { highlight, type Lang } from '@/utils/highlight';
import { cn } from '@/utils/io';
import { CopyButton, DownloadButton } from './Actions';

/** A workbench pane. `side` colours the marker: iodine for what goes in, copper for what comes out. */
export function Pane({
  title,
  side,
  meta,
  actions,
  children,
  className,
}: {
  title: string;
  side: 'in' | 'out';
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card flex min-w-0 flex-col overflow-hidden shadow-lift', className)} aria-label={title}>
      <header className="flex min-h-[3.25rem] flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2">
        <span aria-hidden className={cn('h-2.5 w-2.5 shrink-0 rounded-full', side === 'in' ? 'bg-iodine' : 'bg-copper')} />
        <h2 className="font-sans text-[0.95rem] font-semibold tracking-normal">{title}</h2>
        {meta && <span className="text-sm text-muted">{meta}</span>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** Read-only, highlighted result with copy and download controls. */
export function CodeOutput({
  title = 'Output',
  code,
  lang,
  fileName,
  mime,
  meta,
  empty,
  runKey,
  height = '22rem',
  extraActions,
}: {
  title?: string;
  code: string;
  lang: Lang;
  fileName: string;
  mime?: string;
  meta?: ReactNode;
  empty: string;
  /** Change this to replay the reveal animation. */
  runKey?: number | string;
  height?: string;
  extraActions?: ReactNode;
}) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);
  return (
    <Pane
      title={title}
      side="out"
      meta={meta}
      actions={
        <>
          {extraActions}
          <CopyButton text={code} />
          <DownloadButton text={code} fileName={fileName} mime={mime} />
        </>
      }
    >
      <div className="relative bg-sunken" style={{ height }}>
        {code ? (
          <pre key={runKey} tabIndex={0} aria-label={`${title} code`} className="code-pre scan h-full p-4 pl-[1.1rem]">
            <code dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        ) : (
          <div className="grid-bg flex h-full items-center justify-center p-6 text-center">
            <p className="max-w-xs rounded-xl bg-paper/90 px-4 py-3 text-sm text-muted">{empty}</p>
          </div>
        )}
      </div>
    </Pane>
  );
}

export function ErrorNote({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} role="alert" className="pop-in flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[0.95rem] text-ink">
      <CircleAlert size={18} aria-hidden className="mt-0.5 shrink-0 text-danger" />
      <div>{children}</div>
    </div>
  );
}

export function WarningList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div role="status" className="pop-in rounded-xl border border-iodine/50 bg-iodine/10 px-4 py-3 text-[0.95rem]">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={17} aria-hidden className="text-iodine-ink" />
        {items.length === 1 ? 'One thing to check' : `${items.length} things to check`}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-6 text-ink/90 marker:text-iodine">
        {items.slice(0, 12).map((w) => (
          <li key={w}>{w}</li>
        ))}
        {items.length > 12 && <li>and {items.length - 12} more.</li>}
      </ul>
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl bg-copper/10 px-4 py-3 text-[0.95rem] text-ink/90">
      <Info size={17} aria-hidden className="mt-0.5 shrink-0 text-copper-ink" />
      <span>{children}</span>
    </p>
  );
}

/** Accessible on/off switch built on a native checkbox. */
export function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="group flex min-h-[2.75rem] cursor-pointer items-center gap-3 rounded-xl px-1" title={hint}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-line transition-colors duration-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] peer-checked:bg-copper peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-copper peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper"
      />
      <span className="text-[0.95rem] font-medium">{label}</span>
    </label>
  );
}

/** A small radio group rendered as joined buttons. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="label">{label}</legend>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-line bg-sunken p-1">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" className="peer sr-only" name={label} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="flex min-h-[2.25rem] items-center rounded-lg px-3 text-sm font-semibold text-muted transition-all duration-300 peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow peer-focus-visible:ring-2 peer-focus-visible:ring-copper">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
