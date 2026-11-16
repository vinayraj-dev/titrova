import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Check, Minus, ShieldCheck } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { Blocks, Inline } from '@/components/common/Blocks';
import { FaqList } from '@/components/common/FaqList';
import { Reveal } from '@/components/common/Reveal';
import { Seo, absoluteUrl, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import type { ToolContent } from '@/data/content';
import { guideForTool } from '@/data/guides';
import { CATEGORIES, TOOLS, isNew, type ToolMeta } from '@/data/tools';
import { ToolRow } from './ToolCard';

/**
 * The shared frame for every tool page: breadcrumb, title, the tool itself (immediately, above the fold),
 * then documentation, limitations, related tools and FAQs. Adding a tool means writing its UI and its
 * content object — the page structure, SEO tags and structured data come from here.
 */
export function ToolShell({ tool, content, children }: { tool: ToolMeta; content: ToolContent; children: ReactNode }) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools' },
    { name: tool.name, path: tool.path },
  ];
  const related = TOOLS.filter((t) => t.slug !== tool.slug)
    .sort((a, b) => Number(b.categories.some((c) => tool.categories.includes(c))) - Number(a.categories.some((c) => tool.categories.includes(c))))
    .slice(0, 4);
  const guide = guideForTool(tool.slug);

  return (
    <>
      <Seo
        title={tool.seoTitle}
        description={tool.description}
        path={tool.path}
        jsonLd={[
          breadcrumbLd(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: tool.name,
            url: absoluteUrl(tool.path),
            description: tool.description,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
        ]}
      />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="hidden shrink-0 sm:block">
              <span className="emoji-bubble lg" data-family={tool.family} aria-hidden="true">{tool.emoji}</span>
            </span>
            <div className="min-w-0">
              <h1 className="text-[1.9rem] font-bold sm:text-4xl">{tool.name}</h1>
              <p className="mt-1.5 max-w-[62ch] text-[1.05rem] text-muted">{tool.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isNew(tool) && <span className="sticker">New</span>}
                {tool.categories.map((id) => {
                  const c = CATEGORIES.find((x) => x.id === id)!;
                  return (
                    <Link key={id} to={`/${c.slug}`} className="chip !py-0.5 text-[0.85rem]">
                      <span aria-hidden="true">{c.emoji}</span> {c.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-full border border-copper/40 bg-copper/10 px-3.5 py-1.5 text-sm font-semibold text-copper-ink">
            <ShieldCheck size={16} aria-hidden />
            Runs in your browser. Nothing is uploaded.
          </p>
        </header>

        <div className="mt-6">{children}</div>

        <AdSlot placement="content" className="mt-10 max-w-[60rem]" />

        <div className="mt-14 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <article className="prose-lab min-w-0">
            <h2 id="how-to-use">How to use the {tool.name}</h2>
            <ol>
              {content.steps.map((s) => (
                <li key={s}><Inline text={s} /></li>
              ))}
            </ol>
            <Blocks blocks={content.article} />
            <h2 id="features-and-limitations">Features and limitations</h2>
            <div className="not-prose mt-4 grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <h3 className="font-sans text-base font-semibold tracking-normal">What it does</h3>
                <ul className="mt-3 space-y-2.5 text-[0.97rem]">
                  {content.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-copper-ink" />
                      <span><Inline text={f} /></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="font-sans text-base font-semibold tracking-normal">What it does not do</h3>
                <ul className="mt-3 space-y-2.5 text-[0.97rem]">
                  {content.limitations.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Minus size={18} aria-hidden className="mt-0.5 shrink-0 text-iodine-ink" />
                      <span><Inline text={f} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal kind="right">
              <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">Related tools</h2>
              <ul className="mt-3 space-y-2.5">
                {related.map((t) => (
                  <li key={t.slug}><ToolRow tool={t} /></li>
                ))}
              </ul>
            </Reveal>
            {guide && (
              <Reveal kind="right" delay={80}>
                <Link to={`/guides/${guide.slug}`} className="group block rounded-2xl bg-ink p-5 text-paper transition-transform duration-500 hover:-translate-y-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-paper/70">
                    <BookOpen size={16} aria-hidden /> Guide, {guide.minutes} minute read
                  </span>
                  <span className="mt-2 block font-display text-xl font-semibold leading-snug tracking-tight">{guide.title}</span>
                  <span className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-iodine to-copper transition-all duration-500 group-hover:w-full" />
                </Link>
              </Reveal>
            )}
            <AdSlot placement="sidebar" />
          </aside>
        </div>

        <section className="mt-16" aria-labelledby="tool-faq">
          <Reveal>
            <h2 id="tool-faq" className="text-2xl font-semibold sm:text-3xl">Questions about the {tool.name}</h2>
          </Reveal>
          <Reveal className="mt-6" delay={80}>
            <FaqList items={content.faqs} idPrefix={tool.slug} />
          </Reveal>
        </section>
      </div>
    </>
  );
}
