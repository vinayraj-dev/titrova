import { ClipboardPaste, Cpu, FileCheck2, ServerOff } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';

function Connector() {
  return (
    <>
      <svg className="hidden h-6 w-full min-w-[3rem] lg:block" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="12" x2="100" y2="12" stroke="rgb(var(--copper))" strokeWidth="2.5" className="flow-dash" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg className="mx-auto h-10 w-6 lg:hidden" viewBox="0 0 24 40" aria-hidden="true">
        <line x1="12" y1="0" x2="12" y2="40" stroke="rgb(var(--copper))" strokeWidth="2.5" className="flow-dash" />
      </svg>
    </>
  );
}

/** Shows the whole data path: it starts and ends on the visitor's device. */
export function Pipeline() {
  return (
    <div className="rounded-[1.75rem] border border-line bg-surface p-4 sm:p-6">
      <div className="grid items-center lg:grid-cols-[1fr_auto_1.15fr_auto_1fr] lg:gap-3">
        <Reveal kind="left" className="rounded-2xl bg-iodine/10 p-5">
          <ClipboardPaste size={24} aria-hidden className="text-iodine-ink" />
          <p className="mt-3 font-display text-xl font-semibold tracking-tight">You paste</p>
          <p className="mt-1 text-muted">JSON, a query, record IDs or field names.</p>
        </Reveal>
        <Connector />
        <Reveal kind="pop" delay={150} className="relative overflow-hidden rounded-2xl bg-ink p-5 text-paper">
          <svg className="absolute -right-6 -top-6 h-32 w-32" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="26" fill="none" stroke="rgb(var(--copper))" strokeWidth="2" className="pulse-ring" />
            <circle cx="50" cy="50" r="26" fill="none" stroke="rgb(var(--iodine))" strokeWidth="2" className="pulse-ring" style={{ animationDelay: '1.2s' }} />
          </svg>
          <Cpu size={24} aria-hidden className="text-onink" />
          <p className="mt-3 font-display text-xl font-semibold tracking-tight">Your browser does the work</p>
          <p className="mt-1 text-paper/75">Parsing, generating and formatting happen in this tab, on your device.</p>
        </Reveal>
        <Connector />
        <Reveal kind="right" delay={300} className="rounded-2xl bg-copper/10 p-5">
          <FileCheck2 size={24} aria-hidden className="text-copper-ink" />
          <p className="mt-3 font-display text-xl font-semibold tracking-tight">You copy the result</p>
          <p className="mt-1 text-muted">Or download it as a file. That is the whole journey.</p>
        </Reveal>
      </div>
      <Reveal delay={420} className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-line px-5 py-4 sm:items-center">
        <ServerOff size={22} aria-hidden className="mt-0.5 shrink-0 text-muted sm:mt-0" />
        <p className="text-ink/85">
          <strong className="font-semibold text-ink">There is no server in this picture.</strong> The tools have no upload step, so there is nothing for us to
          store, log or lose.
        </p>
      </Reveal>
    </div>
  );
}
