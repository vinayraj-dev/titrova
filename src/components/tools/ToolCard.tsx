import { Link } from 'react-router-dom';
import { ToolLink } from './ToolLink';
import { ArrowRight, ArrowUpRight, Lightbulb } from 'lucide-react';
import { FAMILIES, isNew, type ToolMeta } from '@/data/tools';
import { pointerFx, pointerFxReset } from '@/hooks/pointerFx';
import { cn } from '@/utils/io';

/** The whole card is one link. It tilts toward the pointer and its border lights up under it. */
export function ToolCard({ tool, large, className }: { tool: ToolMeta; large?: boolean; className?: string }) {
  return (
    <ToolLink
      tool={tool}
      className={cn('fx-card card group flex h-full flex-col p-5 sm:p-6', className)}
      onPointerMove={(e) => pointerFx(e, 7)}
      onPointerLeave={pointerFxReset}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="emoji-bubble" data-family={tool.family} aria-hidden="true">{tool.emoji}</span>
        <span className="flex items-center gap-2">
          {isNew(tool) && <span className="sticker">New</span>}
          <ArrowUpRight size={22} aria-hidden className="fx-arrow text-muted" />
        </span>
      </span>
      <span className={cn('mt-5 block font-display font-semibold leading-tight tracking-tight', large ? 'text-2xl sm:text-[1.7rem]' : 'text-xl sm:text-[1.3rem]')}>
        {tool.name}
      </span>
      <span className="mt-2 block text-muted">{tool.tagline}</span>
      <span className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-sm font-semibold">
        <span className="whitespace-nowrap rounded-lg bg-iodine/15 px-2.5 py-1 text-iodine-ink">{tool.from}</span>
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <ArrowRight size={15} aria-hidden className="text-muted" />
          <span className="rounded-lg bg-copper/15 px-2.5 py-1 text-copper-ink">{tool.to}</span>
        </span>
        <span className="sr-only">. {FAMILIES[tool.family].name}{isNew(tool) ? ', new' : ''}.</span>
      </span>
    </ToolLink>
  );
}

/** Compact, single-row variant for sidebars and lists. */
export function ToolRow({ tool }: { tool: ToolMeta }) {
  return (
    <ToolLink tool={tool} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lift">
      <span className="emoji-bubble sm" data-family={tool.family} aria-hidden="true">{tool.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{tool.name}</span>
        <span className="block truncate text-sm text-muted">{tool.from} to {tool.to}</span>
      </span>
      {isNew(tool) && <span className="sticker copper">New</span>}
      <ArrowRight size={16} aria-hidden className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1" />
    </ToolLink>
  );
}

/**
 * A grid of tool cards that never leaves an empty slot: when the last row is short,
 * a "suggest a tool" tile fills exactly the remaining space at each breakpoint.
 */
export function ToolGrid({ tools, className }: { tools: ToolMeta[]; className?: string }) {
  const n = tools.length;
  const two = n % 2 === 1 ? 'sm:flex' : 'sm:hidden';
  const three = n % 3 === 0 ? 'xl:hidden' : n % 3 === 1 ? 'xl:flex xl:col-span-2' : 'xl:flex xl:col-span-1';
  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {tools.map((t, i) => (
        <li key={t.slug} className="pop-in" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
          <ToolCard tool={t} />
        </li>
      ))}
      <li className={cn('hidden', two, three)}>
        <Link to="/contact" className="group flex h-full w-full flex-col justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 transition-colors duration-300 hover:border-copper hover:bg-copper/5">
          <span className="emoji-bubble" aria-hidden="true">💡</span>
          <span className="mt-2 font-display text-xl font-semibold tracking-tight">Missing a tool?</span>
          <span className="text-muted">Tell us what you need next. Suggestions decide what gets built.</span>
          <span className="mt-1 inline-flex items-center gap-1.5 font-semibold text-copper-ink">
            <Lightbulb size={16} aria-hidden /> Suggest a tool
          </span>
        </Link>
      </li>
    </ul>
  );
}
