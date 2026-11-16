import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Segmented } from '@/components/common/Panel';
import { Reveal } from '@/components/common/Reveal';
import { Seo, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Dashboard } from '@/components/tools/Dashboard';
import { ToolGrid } from '@/components/tools/ToolCard';
import { CATEGORIES, FAMILIES, PLANNED_TOOLS, TOOLS, type Family } from '@/data/tools';

/** Column spans on a 6-column grid so that any number of cards fills its rows completely. */
export function spanFor(index: number, total: number): string {
  if (total === 1) return 'md:col-span-6';
  if (total === 2 || total === 4) return 'md:col-span-3';
  if (total === 3) return 'md:col-span-2';
  const firstRowTwo = total % 3 === 2;
  const firstRowFour = total % 3 === 1;
  if (firstRowTwo && index < 2) return 'md:col-span-3';
  if (firstRowFour && index < 4) return 'md:col-span-3';
  return 'md:col-span-2';
}

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Tools', path: '/tools' },
];
type Sort = 'popular' | 'az' | 'newest';

export default function Tools() {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<'all' | Family>('all');
  const [sort, setSort] = useState<Sort>('popular');

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = TOOLS.filter(
      (t) =>
        (family === 'all' || t.family === family) &&
        words.every((w) => `${t.name} ${t.tagline} ${t.keywords.join(' ')} ${t.categories.map((c) => CATEGORIES.find((x) => x.id === c)!.name).join(' ')}`.toLowerCase().includes(w)),
    );
    if (sort === 'az') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'newest') return [...list].sort((a, b) => b.added.localeCompare(a.added));
    return list;
  }, [query, family, sort]);

  const grouped = !query && family === 'all' && sort === 'popular';

  return (
    <>
      <Seo
        title="All Free Salesforce & Developer Tools"
        description={`Browse ${TOOLS.length} free tools: JSON to Apex, SOQL and SQL formatters, ID converter, package.xml builder, JWT decoder, regex tester and more.`}
        path="/tools"
        jsonLd={[breadcrumbLd(crumbs)]}
      />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-5 max-w-[52rem]">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-copper-ink">🧪 Tool dashboard</p>
          <h1 className="mt-1 text-4xl font-bold sm:text-6xl">All tools</h1>
          <p className="mt-3 text-lg text-muted">
            {TOOLS.length} free tools for Salesforce and everyday development. Each one opens with a working example and runs entirely in your browser.
          </p>
        </header>

        <Dashboard active="all">
          <div className="card flex flex-wrap items-end gap-x-5 gap-y-3 p-3 sm:p-4">
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="tool-filter" className="label">Filter tools</label>
              <div className="relative">
                <Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input id="tool-filter" type="search" className="input pl-11 pr-11" placeholder="Try “query”, “token” or “deploy”" value={query} autoComplete="off" onChange={(e) => setQuery(e.target.value)} />
                {query && (
                  <button type="button" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink" aria-label="Clear filter" onClick={() => setQuery('')}>
                    <X size={17} aria-hidden />
                  </button>
                )}
              </div>
            </div>
            <Segmented label="Show" value={family} onChange={setFamily} options={[{ value: 'all', label: 'All' }, { value: 'salesforce', label: '⚡ Salesforce' }, { value: 'developer', label: '🧰 Developer' }]} />
            <div>
              <label htmlFor="tool-sort" className="label">Sort</label>
              <select id="tool-sort" className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
                <option value="az">A to Z</option>
              </select>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted" role="status">Showing {shown.length} of {TOOLS.length}</p>

          {grouped ? (
            (['salesforce', 'developer'] as Family[]).map((f) => {
              const list = shown.filter((t) => t.family === f);
              return (
                <section key={f} className="mt-6" aria-labelledby={`family-${f}`}>
                  <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 id={`family-${f}`} className="text-2xl font-semibold sm:text-3xl">
                      <span aria-hidden="true">{FAMILIES[f].emoji}</span> {FAMILIES[f].name}
                    </h2>
                    <span className="dash-count !ml-0">{list.length}</span>
                    <p className="w-full text-muted">{FAMILIES[f].blurb}</p>
                  </div>
                  <ToolGrid tools={list} />
                </section>
              );
            })
          ) : shown.length ? (
            <ToolGrid tools={shown} className="mt-4" />
          ) : (
            <div className="grid-bg mt-4 rounded-3xl border border-dashed border-line p-10 text-center">
              <div className="mx-auto max-w-md rounded-2xl bg-paper/90 p-5">
                <p className="text-4xl" aria-hidden="true">🔍</p>
                <p className="mt-2 font-display text-2xl font-semibold tracking-tight">No tool matches that yet</p>
                <p className="mt-2 text-muted">Try a different word, or clear the filters to see everything.</p>
                <button type="button" className="btn btn-primary mt-4" onClick={() => { setQuery(''); setFamily('all'); setSort('popular'); }}>
                  Show all tools
                </button>
              </div>
            </div>
          )}

          <Reveal className="mt-10 flex flex-col gap-4 rounded-2xl border border-dashed border-line p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold"><span aria-hidden="true">🔭</span> Coming later</h2>
              <p className="mt-1 text-muted">Ideas being considered. None of these exist yet.</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {PLANNED_TOOLS.map((name) => (
                  <li key={name} className="rounded-full border border-dashed border-line px-3 py-1.5 text-sm font-medium text-muted">{name}</li>
                ))}
              </ul>
            </div>
            <Link to="/contact" className="btn btn-primary shrink-0">Suggest a tool</Link>
          </Reveal>
        </Dashboard>
      </div>
    </>
  );
}
