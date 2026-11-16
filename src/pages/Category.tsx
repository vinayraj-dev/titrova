import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Seo, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Dashboard } from '@/components/tools/Dashboard';
import { ToolGrid } from '@/components/tools/ToolCard';
import { GUIDES } from '@/data/guides';
import { categoryById, toolsInCategory, type CategoryId } from '@/data/tools';
import { cn } from '@/utils/io';

export default function Category({ id }: { id: CategoryId }) {
  const category = categoryById(id);
  const tools = toolsInCategory(id);
  const guides = GUIDES.filter((g) => tools.some((t) => t.slug === g.toolSlug));
  const path = `/${category.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools' },
    { name: category.name, path },
  ];

  return (
    <>
      <Seo title={`${category.name} – Free Online Tools`} description={category.seoDescription} path={path} jsonLd={[breadcrumbLd(crumbs)]} />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="emoji-bubble lg" aria-hidden="true">{category.emoji}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-bold sm:text-5xl">{category.name}</h1>
            <p className="mt-2 max-w-[60ch] text-lg text-muted">{category.blurb}</p>
          </div>
        </header>

        <Dashboard active={id}>
          <p className="mb-4 text-sm text-muted">{tools.length} {tools.length === 1 ? 'tool' : 'tools'} in this category</p>
          <ToolGrid tools={tools} />
          <div className={cn('mt-12 grid gap-x-10 gap-y-8', guides.length > 0 && 'xl:grid-cols-[minmax(0,1fr)_19rem]')}>
            <Reveal as="section" className="prose-lab">
              <h2>About these tools</h2>
              {category.intro.map((p) => <p key={p}>{p}</p>)}
              <p>
                Nothing here connects to a Salesforce org or sends your input to a server. See the <Link to="/privacy-policy">privacy policy</Link> for the detail.
              </p>
            </Reveal>
            {guides.length > 0 && (
              <Reveal as="section" kind="right" delay={100}>
                <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">Guides for this category</h2>
                <ul className="mt-3 space-y-2.5">
                  {guides.map((g) => (
                    <li key={g.slug}>
                      <Link to={`/guides/${g.slug}`} className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lift">
                        <BookOpen size={18} aria-hidden className="mt-0.5 shrink-0 text-copper-ink" />
                        <span>
                          <span className="block font-semibold leading-snug">{g.title}</span>
                          <span className="mt-1 block text-sm text-muted">{g.minutes} minute read</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </Dashboard>
      </div>
    </>
  );
}
