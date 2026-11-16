import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronDown, Clock, FileText, Mail, Printer } from 'lucide-react';
import { Blocks } from '@/components/common/Blocks';
import { Seo, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import type { Block } from '@/data/content';
import { site } from '@/data/site';
import { cn } from '@/utils/io';

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const LEGAL_DOCS = [
  { to: '/privacy-policy', title: 'Privacy policy', text: 'What happens to the information you type here.' },
  { to: '/terms', title: 'Terms and conditions', text: 'The rules for using the site and its output.' },
  { to: '/disclaimer', title: 'Disclaimer', text: 'What the site and its generated code are not.' },
];

function wordCount(blocks: Block[]): number {
  let text = '';
  for (const b of blocks) {
    if ('p' in b) text += b.p;
    else if ('ul' in b) text += b.ul.join(' ');
    else if ('ol' in b) text += b.ol.join(' ');
    else if ('note' in b) text += b.note;
    else if ('table' in b) text += b.table.flat().join(' ');
  }
  return text.split(/\s+/).length;
}

function Toc({ sections, numbered }: { sections: string[]; numbered?: boolean }) {
  return (
    <ol className={cn('mt-3 space-y-1.5 text-[0.95rem]', numbered && 'toc')}>
      {sections.map((s) => (
        <li key={s}>
          <a href={`#${anchor(s)}`} className="block rounded-md py-0.5 font-medium text-ink/80 transition-colors hover:text-copper-ink">{s}</a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Layout for About and the legal documents. Legal documents get numbered clauses, an effective date,
 * a print button, a closing contact clause and links to the other legal documents.
 * On phones the key points and a collapsible contents list come first; on desktop they sit in a sticky sidebar.
 */
export function DocPage({
  title,
  seoTitle,
  description,
  path,
  lead,
  blocks,
  summary,
  legal,
  children,
}: {
  title: string;
  seoTitle?: string;
  description: string;
  path: string;
  lead: string;
  blocks: Block[];
  summary: { title: string; points: string[] };
  legal?: boolean;
  children?: ReactNode;
}) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: title, path },
  ];
  const sections = [...blocks.flatMap((b) => ('h' in b ? [b.h] : [])), ...(legal ? ['Contact'] : [])];
  const minutes = Math.max(1, Math.round(wordCount(blocks) / 220));

  return (
    <>
      <Seo title={seoTitle ?? title} description={description} path={path} jsonLd={[breadcrumbLd(crumbs)]} />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-5 max-w-[52rem]">
          <h1 className="text-4xl font-bold sm:text-6xl">{title}</h1>
          <p className="mt-3 text-lg text-muted">{lead}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-muted">
            {legal && (
              <span className="chip">
                <CalendarDays size={15} aria-hidden /> Effective <time dateTime={site.legalUpdatedIso}>{site.legalUpdated}</time>
              </span>
            )}
            <span className="chip">
              <Clock size={15} aria-hidden /> {minutes} minute read
            </span>
            {legal && (
              <button type="button" className="chip no-print" onClick={() => window.print()}>
                <Printer size={15} aria-hidden /> Print or save as PDF
              </button>
            )}
          </div>
          <div className="reaction-line mt-6 w-32" aria-hidden="true" />
        </header>

        <div className="mt-8 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <aside className="no-print space-y-3 lg:sticky lg:top-24 lg:order-last lg:space-y-5 lg:self-start">
            <div className="rounded-2xl bg-ink p-5 text-paper">
              <p className="font-display text-xl font-semibold tracking-tight">{summary.title}</p>
              <ul className="mt-3 space-y-2.5 text-paper/85">
                {summary.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-onink" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <details className="group card lg:hidden">
              <summary className="flex min-h-[3rem] cursor-pointer list-none items-center justify-between gap-3 px-5 font-semibold [&::-webkit-details-marker]:hidden">
                On this page ({sections.length} sections)
                <ChevronDown size={18} aria-hidden className="transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="border-t border-line px-5 pb-4">
                <Toc sections={sections} numbered={legal} />
              </div>
            </details>
            <nav aria-label="On this page" className="card hidden p-5 lg:block">
              <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">On this page</h2>
              <Toc sections={sections} numbered={legal} />
            </nav>
          </aside>

          <article className={cn('prose-lab min-w-0', legal && 'legal-doc')}>
            <Blocks blocks={blocks} />
            {legal && (
              <>
                <h2 id="contact">Contact</h2>
                <p>
                  Questions about this document, or requests about your information, can be sent{' '}
                  {site.contactEmail ? (
                    <>
                      by email to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>, or
                    </>
                  ) : null}{' '}
                  through the <Link to="/contact">contact page</Link>. We aim to reply within 30 days.
                </p>
              </>
            )}
            {children}
          </article>
        </div>

        {legal && (
          <section className="no-print mt-14" aria-labelledby="other-docs">
            <h2 id="other-docs" className="text-2xl font-semibold">Related documents</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {LEGAL_DOCS.filter((d) => d.to !== path).map((d) => (
                <li key={d.to}>
                  <Link to={d.to} className="card group flex h-full items-start gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lift">
                    <FileText size={20} aria-hidden className="mt-0.5 shrink-0 text-copper-ink" />
                    <span>
                      <span className="block font-semibold">{d.title}</span>
                      <span className="block text-sm text-muted">{d.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/contact" className="card group flex h-full items-start gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lift">
                  <Mail size={20} aria-hidden className="mt-0.5 shrink-0 text-copper-ink" />
                  <span>
                    <span className="block font-semibold">Contact</span>
                    <span className="block text-sm text-muted">Ask a question or make a request.</span>
                  </span>
                </Link>
              </li>
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
