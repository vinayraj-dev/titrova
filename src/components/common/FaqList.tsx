import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Faq } from '@/data/content';
import { Inline } from './Blocks';

/** Accordion. Answers stay in the DOM when closed, so search engines can still read them. */
export function FaqList({ items, idPrefix = 'faq' }: { items: Faq[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="acc" data-open={isOpen}>
            <h3 className="font-sans tracking-normal">
              <button
                type="button"
                id={`${idPrefix}-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[1.02rem] font-semibold leading-snug transition-colors hover:bg-ink/[0.03]"
              >
                {item.q}
                <span className="acc-icon grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sunken">
                  <Plus size={16} aria-hidden />
                </span>
              </button>
            </h3>
            <div className="acc-body" id={`${idPrefix}-a-${i}`} role="region" aria-labelledby={`${idPrefix}-q-${i}`} {...(!isOpen && { inert: '' as unknown as boolean })}>
              <div>
                <p className="max-w-[68ch] px-5 pb-5 text-ink/85">
                  <Inline text={item.a} />
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
