import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, CornerDownLeft, FileText, FolderOpen, Search, type LucideIcon } from 'lucide-react';
import { CATEGORIES, TOOLS } from '@/data/tools';
import { GUIDES } from '@/data/guides';

interface Item {
  label: string;
  hint: string;
  to: string;
  icon: LucideIcon;
  search: string;
  group: string;
}

const ITEMS: Item[] = [
  ...TOOLS.map((t) => ({ label: t.name, hint: t.tagline, to: t.path, icon: t.icon, group: 'Tools', search: `${t.name} ${t.tagline} ${t.keywords.join(' ')}`.toLowerCase() })),
  ...CATEGORIES.map((c) => ({ label: c.name, hint: c.blurb, to: `/${c.slug}`, icon: FolderOpen, group: 'Categories', search: `${c.name} ${c.blurb}`.toLowerCase() })),
  ...GUIDES.map((g) => ({ label: g.title, hint: `${g.minutes} minute guide`, to: `/guides/${g.slug}`, icon: BookOpen, group: 'Guides', search: `${g.title} ${g.description}`.toLowerCase() })),
  ...[
    ['All tools', '/tools'],
    ['Guides and tutorials', '/guides'],
    ['About', '/about'],
    ['Contact', '/contact'],
    ['Privacy policy', '/privacy-policy'],
    ['Terms and conditions', '/terms'],
    ['Disclaimer', '/disclaimer'],
  ].map(([label, to]) => ({ label, hint: 'Page', to, icon: FileText, group: 'Pages', search: label.toLowerCase() })),
];

const Ctx = createContext<() => void>(() => {});
/** Open the search palette from anywhere. */
export const usePalette = () => useContext(Ctx);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActive(0);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '');
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((o) => {
          if (!o) show();
          return !o;
        });
      } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? ITEMS.filter((it) => words.every((w) => it.search.includes(w))) : ITEMS.filter((it) => it.group !== 'Pages');
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const go = (item?: Item) => {
    if (!item) return;
    setOpen(false);
    navigate(item.to);
  };

  return (
    <Ctx.Provider value={show}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[10vh] sm:p-6 sm:pt-[14vh]" role="presentation">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" style={{ animation: 'fade-late 0.25s both' }} onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search tools, guides and pages"
            className="pop-in relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-panel"
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                go(results[active]);
              } else if (e.key === 'Tab') {
                e.preventDefault(); // keep focus inside the dialog
              }
            }}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search size={20} aria-hidden className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[active] ? `palette-${active}` : undefined}
                aria-label="Search tools, guides and pages"
                placeholder="Search tools, guides and pages"
                className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
              />
              <button type="button" onClick={close} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-muted hover:text-ink">
                Esc
              </button>
            </div>
            <ul ref={listRef} id="palette-list" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-4 py-8 text-center text-muted">
                  Nothing matches “{query}”. Try “JSON”, “SOQL”, “ID” or “package”.
                </li>
              )}
              {results.map((item, i) => (
                <li
                  key={item.to}
                  id={`palette-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 aria-selected:bg-ink aria-selected:text-paper"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sunken text-ink">
                    <item.icon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{item.label}</span>
                    <span className="block truncate text-sm opacity-70">{item.hint}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs font-semibold opacity-60 sm:block">{item.group}</span>
                  {i === active && <CornerDownLeft size={16} aria-hidden className="hidden shrink-0 sm:block" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
