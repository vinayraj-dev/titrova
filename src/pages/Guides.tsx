import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Seo, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { GUIDES } from '@/data/guides';
import { toolBySlug } from '@/data/tools';
import { spanFor } from './Tools';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/guides' },
];

export default function Guides() {
  return (
    <>
      <Seo
        title="Salesforce Developer Guides and Tutorials"
        description="Practical guides for Salesforce developers: JSON deserialization in Apex, 15 vs 18 character IDs, SOQL style, package.xml and Apex test data."
        path="/guides"
        jsonLd={[breadcrumbLd(crumbs)]}
      />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-5">
          <h1 className="text-4xl font-bold sm:text-6xl">Guides and tutorials</h1>
          <p className="mt-3 max-w-[60ch] text-lg text-muted">
            The reasoning behind each tool, written to be read in one sitting. Every guide includes code you can copy.
          </p>
        </header>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {GUIDES.map((g, i) => {
            const tool = toolBySlug(g.toolSlug);
            const big = i < 2;
            return (
              <Reveal key={g.slug} kind="rise" delay={i * 80} className={spanFor(i, GUIDES.length)}>
                <Link to={`/guides/${g.slug}`} className="card group flex h-full flex-col p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-lift sm:p-6">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-muted">
                    <span className="flex items-center gap-2">
                      <BookOpen size={16} aria-hidden /> {g.minutes} minute read
                    </span>
                    <ArrowUpRight size={20} aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                  <span className={`mt-4 block font-display font-semibold leading-snug tracking-tight ${big ? 'text-2xl sm:text-[1.7rem]' : 'text-xl'}`}>{g.title}</span>
                  <span className="mt-2 block text-muted">{g.description}</span>
                  <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-copper-ink">
                    <tool.icon size={16} aria-hidden /> Goes with the {tool.name}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </>
  );
}
