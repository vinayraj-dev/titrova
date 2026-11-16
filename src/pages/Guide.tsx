import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { Blocks } from '@/components/common/Blocks';
import { Reveal } from '@/components/common/Reveal';
import { Seo, absoluteUrl, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { GUIDES, guideBySlug } from '@/data/guides';
import { site } from '@/data/site';
import { toolBySlug } from '@/data/tools';

const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function Guide({ slug }: { slug: string }) {
  const guide = guideBySlug(slug)!;
  const tool = toolBySlug(guide.toolSlug);
  const path = `/guides/${guide.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: guide.title, path },
  ];
  const sections = guide.blocks.flatMap((b) => ('h' in b ? [b.h] : []));
  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <>
      <Seo
        title={guide.title}
        description={guide.description}
        path={path}
        type="article"
        jsonLd={[
          breadcrumbLd(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: guide.title,
            description: guide.description,
            datePublished: guide.updated,
            dateModified: guide.updated,
            mainEntityOfPage: absoluteUrl(path),
            ...(site.author && { author: { '@type': 'Person', name: site.author } }),
            publisher: { '@type': 'Organization', name: site.name, url: site.url + '/' },
          },
        ]}
      />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-5 max-w-[52rem]">
          <h1 className="text-[2rem] font-bold sm:text-5xl">{guide.title}</h1>
          <p className="mt-3 text-lg text-muted">{guide.description}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted">
            <span className="flex items-center gap-1.5">
              <Clock size={15} aria-hidden /> {guide.minutes} minute read
            </span>
            <span>
              Updated <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
            </span>
            {site.author && <span>By {site.author}</span>}
          </p>
          <div className="reaction-line mt-6 w-32" aria-hidden="true" />
        </header>

        <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <article className="prose-lab min-w-0">
            <Blocks blocks={guide.blocks} />
            <AdSlot placement="content" className="not-prose my-8" />
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal kind="right">
              <Link to={tool.path} className="group block rounded-2xl bg-ink p-5 text-paper transition-transform duration-500 hover:-translate-y-1">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-paper/10">
                  <tool.icon size={20} aria-hidden className="text-onink" />
                </span>
                <span className="mt-3 block text-sm font-semibold text-paper/70">Try it yourself</span>
                <span className="mt-1 block font-display text-xl font-semibold leading-snug tracking-tight">{tool.name}</span>
                <span className="mt-2 block text-paper/75">{tool.tagline}</span>
                <span className="mt-4 inline-flex items-center gap-2 font-semibold text-onink">
                  Open the tool <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
            <Reveal kind="right" delay={80}>
              <nav aria-label="In this guide" className="card p-5">
                <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">In this guide</h2>
                <ol className="mt-3 space-y-2 text-[0.95rem]">
                  {sections.map((s) => (
                    <li key={s}>
                      <a href={`#${anchor(s)}`} className="block rounded-md py-0.5 font-medium text-ink/80 transition-colors hover:text-copper-ink">{s}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </Reveal>
            <AdSlot placement="sidebar" />
          </aside>
        </div>

        <section className="mt-16" aria-labelledby="more-guides">
          <h2 id="more-guides" className="text-2xl font-semibold sm:text-3xl">More guides</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((g, i) => (
              <Reveal as="li" key={g.slug} delay={i * 70}>
                <Link to={`/guides/${g.slug}`} className="card flex h-full flex-col p-5 transition-all duration-500 hover:-translate-y-1 hover:border-ink/40 hover:shadow-lift">
                  <span className="text-sm font-semibold text-muted">{g.minutes} minute read</span>
                  <span className="mt-2 block font-display text-lg font-semibold leading-snug tracking-tight">{g.title}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
