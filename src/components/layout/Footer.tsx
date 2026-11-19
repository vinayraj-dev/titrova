import { Link } from 'react-router-dom';
import { ArrowUp, Github, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { site } from '@/data/site';
import { CATEGORIES, TOOLS } from '@/data/tools';

const POPULAR = ['org-xray', 'json-to-apex', 'soql-formatter', 'salesforce-id-converter', 'curl-to-apex', 'json-formatter'];

const GROUPS = [
  { title: 'Popular tools', links: POPULAR.map((slug) => TOOLS.find((t) => t.slug === slug)!).map((t) => ({ to: t.path, label: t.short, external: !!t.staticPage })) },
  { title: 'Categories', links: CATEGORIES.map((c) => ({ to: `/${c.slug}`, label: c.short === 'Queries' ? 'SOQL & SQL' : c.short })) },
];
const EXPLORE = [
  { to: '/tools', label: `All ${TOOLS.length} tools` },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];
const LEGAL = [
  { to: '/privacy-policy', label: 'Privacy' },
  { to: '/privacy-policy#cookies-and-local-storage', label: 'Cookies' },
  { to: '/terms', label: 'Terms' },
  { to: '/disclaimer', label: 'Disclaimer' },
];

const linkCls = 'inline-block py-1 font-medium text-ink/80 transition-all duration-300 hover:translate-x-0.5 hover:text-copper-ink';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 overflow-hidden border-t border-line bg-surface sm:mt-20">
      <div className="page grid gap-x-10 gap-y-8 pt-10 sm:pt-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Link to="/" className="inline-flex w-fit items-center gap-2.5 rounded-xl">
            <Logo size={38} />
            <span className="font-display text-2xl font-bold tracking-tight">{site.name}</span>
          </Link>
          <p className="max-w-md text-muted">{site.tagline} Every tool runs in your browser, so what you paste stays on your device.</p>
          <p className="flex w-fit items-center gap-2 rounded-full bg-copper/10 px-3 py-1.5 text-sm font-semibold text-copper-ink">
            <ShieldCheck size={16} aria-hidden /> No sign-up, no uploads, no cost
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={site.repoUrl} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
              <Github size={16} aria-hidden /> Source on GitHub
            </a>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowUp size={16} aria-hidden /> Back to top
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
          {GROUPS.map((g) => (
            <nav key={g.title} aria-label={`Footer ${g.title.toLowerCase()}`}>
              <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">{g.title}</h2>
              <ul className="mt-2.5 space-y-0.5">
                {g.links.map((l) => (
                  <li key={l.to}>
                    {'external' in l && l.external ? <a href={l.to} className={linkCls}>{l.label}</a> : <Link to={l.to} className={linkCls}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="page mt-8 border-t border-line py-5">
        <nav aria-label="Explore" className="mb-4">
          <ul className="flex flex-wrap gap-2">
            {EXPLORE.map((l) => (
              <li key={l.to}><Link to={l.to} className="chip">{l.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold">© {year} {site.name}. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {LEGAL.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="font-medium text-muted underline-offset-4 hover:text-ink hover:underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-3 max-w-[90ch] text-[0.8rem] leading-relaxed text-muted">
          {site.disclaimer} Salesforce, Apex, SOQL and Lightning are trademarks of Salesforce, Inc. and are used only to describe what the tools work with.
        </p>
      </div>

      <div className="reaction-line h-1 rounded-none" aria-hidden="true" />
    </footer>
  );
}
