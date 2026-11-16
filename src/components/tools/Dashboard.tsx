import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { CATEGORIES, TOOLS, toolsInCategory, type CategoryId } from '@/data/tools';
import { cn } from '@/utils/io';

/** Category navigation: a sticky sidebar on large screens, a swipeable chip row on small ones. */
export function Dashboard({ active, children }: { active: CategoryId | 'all'; children: ReactNode }) {
  const items = [
    { id: 'all' as const, to: '/tools', emoji: '🧪', name: 'All tools', count: TOOLS.length },
    ...CATEGORIES.map((c) => ({ id: c.id, to: `/${c.slug}`, emoji: c.emoji, name: c.name.replace(' Utilities', ''), count: toolsInCategory(c.id).length })),
  ];
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <nav aria-label="Tool categories" className="card p-2.5 pl-3">
            <p className="px-2 pb-1.5 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">Browse</p>
            <ul className="space-y-0.5">
              {items.map((it) => (
                <li key={it.id}>
                  <Link to={it.to} className="dash-link" aria-current={active === it.id ? 'page' : undefined}>
                    <span className="emoji" aria-hidden="true">{it.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.93rem]">{it.name}</span>
                    <span className="dash-count">{it.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="relative overflow-hidden rounded-2xl bg-ink p-4 text-paper">
            <div className="grid-bg absolute inset-0 opacity-30 invert dark:invert-0" aria-hidden="true" />
            <p className="relative flex items-center gap-2 font-semibold"><ShieldCheck size={18} aria-hidden className="text-onink" /> Private by design</p>
            <dl className="relative mt-3 grid grid-cols-2 gap-2 text-center">
              {[['0', 'uploads'], ['0', 'sign-ups'], [String(TOOLS.length), 'tools'], ['100%', 'in-browser']].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-paper/10 px-2 py-2">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-xl font-bold leading-none">{v}</dd>
                  <dd className="mt-1 text-xs text-paper/70">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <nav aria-label="Tool categories" className="chip-scroller mb-5 lg:hidden">
          {items.map((it) => (
            <Link key={it.id} to={it.to} className={cn('chip min-h-[2.5rem]', active === it.id && '!border-ink !bg-ink !text-paper')} aria-current={active === it.id ? 'page' : undefined}>
              <span aria-hidden="true">{it.emoji}</span> {it.id === 'all' ? 'All' : CATEGORIES.find((c) => c.id === it.id)!.short}
              <span className={cn('rounded-full px-1.5 text-xs font-bold', active === it.id ? 'bg-paper/15 text-paper' : 'bg-sunken text-muted')}>{it.count}</span>
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
