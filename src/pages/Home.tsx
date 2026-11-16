import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Gauge, HandCoins, Search, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { FaqList } from '@/components/common/FaqList';
import { Magnetic } from '@/components/common/Magnetic';
import { Reveal } from '@/components/common/Reveal';
import { Seo } from '@/components/common/Seo';
import { DotField } from '@/components/home/DotField';
import { Pipeline } from '@/components/home/Pipeline';
import { Reactor } from '@/components/home/Reactor';
import { usePalette } from '@/components/navigation/CommandPalette';
import { ToolCard, ToolRow } from '@/components/tools/ToolCard';
import { HOME_FAQS } from '@/data/faqs';
import { GUIDES } from '@/data/guides';
import { site } from '@/data/site';
import { CATEGORIES, FAMILIES, LATEST_ADDED, PLANNED_TOOLS, TOOLS, isNew, toolBySlug, toolsInCategory, toolsInFamily } from '@/data/tools';
import { pointerFx, pointerFxReset } from '@/hooks/pointerFx';
import { spanFor } from './Tools';

const HEADLINE = ['Free', 'Salesforce', 'Developer', 'Tools'];
const TICKER_A = ['JSON.deserialize', 'SELECT … FROM', '18-character IDs', 'package.xml', '@TestSetup', 'HttpRequest', 'LAST_N_DAYS:30', 'Bearer eyJhbGci…', 'CASESAFEID(Id)'];
const TICKER_B = ['@AuraEnabled', 'GROUP BY ROLLUP', 'Test.setMock()', 'EncodingUtil.urlEncode', 'Pattern.compile', '<members>*</members>', 'base64Decode', 'WITH USER_MODE', '1794736800'];

const REASONS = [
  { icon: HandCoins, title: 'Free, with no account', text: 'Open a tool and use it. There is nothing to sign up for and no trial that runs out.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Your input is processed on your device. It is never uploaded, so it cannot be logged or leaked.' },
  { icon: Wrench, title: 'Built for Salesforce syntax', text: 'Reserved words, bind variables, key prefixes, wildcards: the details that generic tools get wrong.' },
  { icon: Gauge, title: 'Quick on any device', text: 'Small pages, no heavy editor to download, and layouts that work from a phone to an ultrawide monitor.' },
];

const POPULAR_CTA = ['json-to-apex', 'soql-formatter', 'salesforce-id-converter', 'curl-to-apex', 'json-formatter', 'jwt-decoder', 'regex-tester'];

function Ticker({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const loop = [...items, ...items];
  return (
    <div className="marquee">
      <ul className={`marquee-track ${reverse ? 'rev' : ''}`} style={{ '--t': reverse ? '58s' : '46s' } as React.CSSProperties}>
        {loop.map((item, i) => (
          <li key={i} className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-sm text-muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHead({ id, title, text, action }: { id: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div>
        <Reveal as="h2" kind="clip" id={id} className="text-3xl font-bold sm:text-[2.6rem]">
          {title}
        </Reveal>
        <Reveal as="p" delay={120} className="mt-2 max-w-[60ch] text-lg text-muted">
          {text}
        </Reveal>
      </div>
      {action && <Reveal delay={200}>{action}</Reveal>}
    </div>
  );
}

export default function Home() {
  const openPalette = usePalette();
  const newTools = TOOLS.filter(isNew);
  const releaseMonth = new Date(LATEST_ADDED + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <>
      <Seo
        title="Titrova – Free Salesforce Developer Tools"
        description="Free online tools for Salesforce developers: JSON to Apex, SOQL and SQL formatters, ID converter, cURL to Apex, JWT decoder, regex tester and more."
        path="/"
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url + '/', description: site.tagline },
        ]}
      />

      {/* Hero */}
      <section className="relative" aria-labelledby="hero-title">
        <div className="absolute inset-x-0 top-0 h-[34rem] overflow-hidden" aria-hidden="true">
          <DotField />
          <div className="glow -left-40 -top-10 h-[30rem] w-[30rem]" style={{ '--glow': 'var(--iodine)' } as React.CSSProperties} />
          <div className="glow -right-40 top-10 h-[32rem] w-[32rem]" style={{ '--glow': 'var(--copper)', animationDelay: '-6s' } as React.CSSProperties} />
        </div>
        <div className="page relative pb-4 pt-8 sm:pt-14">
          <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 id="hero-title" aria-label={HEADLINE.join(' ')} className="text-[clamp(2.3rem,11vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em] lg:text-[min(4.6rem,6.2vw)]">
                {HEADLINE.map((word, i) => (
                  <span key={word} aria-hidden="true">
                    <span className="rise-word">
                      <span style={{ '--i': i } as React.CSSProperties}>{word}</span>
                    </span>
                    {i === 1 ? <br /> : i < 3 ? ' ' : null}
                  </span>
                ))}
              </h1>
              <div className="reaction-line draw mt-3 w-44 sm:w-72" aria-hidden="true" />
            </div>
            <div className="fade-late" style={{ '--d': '520ms' } as React.CSSProperties}>
              <p className="max-w-[46ch] text-lg text-ink/80 sm:text-xl">
                A collection of practical utilities to help Salesforce developers format, generate, validate and work with Salesforce code faster.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openPalette}
                  className="flex h-12 min-w-[13rem] flex-1 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left text-muted shadow-lift transition-colors hover:border-ink/40 hover:text-ink"
                >
                  <Search size={18} aria-hidden />
                  <span className="flex-1">Search tools</span>
                  <kbd aria-hidden="true" className="hidden rounded-md border border-line bg-sunken px-1.5 py-0.5 font-sans text-xs font-semibold sm:inline">/</kbd>
                </button>
                <Magnetic>
                  <Link to="/tools" className="btn btn-primary group h-12 px-5">
                    Browse all tools
                    <ArrowRight size={17} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem] font-medium text-muted">
                {['No sign-up', 'No uploads', 'No cost'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-copper" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="fade-late mt-9" style={{ '--d': '760ms' } as React.CSSProperties}>
            <Reactor />
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-3" aria-hidden="true">
        <Ticker items={TICKER_A} />
        <div className="hidden sm:block">
          <Ticker items={TICKER_B} reverse />
        </div>
      </div>

      {/* Tools, by family */}
      {(['salesforce', 'developer'] as const).map((f, fi) => {
        const list = toolsInFamily(f);
        return (
          <section key={f} className={fi === 0 ? 'page mt-14 sm:mt-20' : 'page mt-16 sm:mt-24'} aria-labelledby={`home-${f}`}>
            <SectionHead
              id={`home-${f}`}
              title={`${FAMILIES[f].emoji} ${f === 'salesforce' ? 'Salesforce tools' : 'Everyday developer tools'}`}
              text={f === 'salesforce' ? `${list.length} utilities for the Salesforce jobs that come up every week.` : `${list.length} formatters, decoders and testers, each with Salesforce extras built in.`}
              action={
                fi === 0 ? (
                  <Link to="/tools" className="btn btn-soft group">
                    All {TOOLS.length} tools <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                ) : undefined
              }
            />
            <div className="mt-8 grid gap-4 md:grid-cols-6">
              {list.map((tool, i) => (
                <Reveal key={tool.slug} kind="rise" delay={(i % 3) * 90} className={spanFor(i, list.length)}>
                  <ToolCard tool={tool} large={spanFor(i, list.length) === 'md:col-span-3'} />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}

      {/* Categories */}
      <section className="page mt-16 sm:mt-24" aria-labelledby="categories">
        <SectionHead id="categories" title="Tool categories" text="Browse by the part of the job you are working on." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => {
            const tools = toolsInCategory(c.id);
            return (
              <Reveal key={c.id} kind="up" delay={(i % 3) * 80}>
                <Link
                  to={`/${c.slug}`}
                  className="fx-card card group flex h-full flex-col p-5"
                  onPointerMove={(e) => pointerFx(e, 6)}
                  onPointerLeave={pointerFxReset}
                >
                  <span className="flex items-center justify-between">
                    <span className="emoji-bubble" aria-hidden="true">{c.emoji}</span>
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-sm font-semibold text-paper">
                      {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                    </span>
                  </span>
                  <span className="mt-4 block font-display text-xl font-semibold tracking-tight">{c.name}</span>
                  <span className="mt-1.5 block text-muted">{c.blurb}</span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {tools.map((t) => (
                      <span key={t.slug} className="rounded-lg bg-sunken px-2 py-0.5 text-sm font-medium text-ink/80">{t.short}</span>
                    ))}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Recently added + planned */}
      <section className="page mt-16 sm:mt-24" aria-labelledby="recent">
        <SectionHead id="recent" title="Recently added tools" text="What is new on the bench, and what is being considered next." />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Reveal kind="left" className="card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles size={18} aria-hidden className="text-iodine-ink" /> {newTools.length} tools added in {releaseMonth}
            </p>
            <ul className="mt-4 space-y-2.5">
              {newTools.slice(0, 4).map((t) => (
                <li key={t.slug}><ToolRow tool={t} /></li>
              ))}
            </ul>
            {newTools.length > 4 && (
              <p className="mt-4">
                <Link to="/tools" className="link">See all {newTools.length} new tools on the dashboard</Link>
              </p>
            )}
          </Reveal>
          <Reveal kind="right" delay={120} className="flex flex-col rounded-2xl border border-dashed border-line p-5 sm:p-6">
            <p className="font-semibold"><span aria-hidden="true">🔭</span> Being considered</p>
            <p className="mt-1 text-muted">These do not exist yet. Your suggestions decide the order.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {PLANNED_TOOLS.map((name, i) => (
                <li key={name} className="float rounded-full border border-dashed border-line px-3 py-1.5 text-sm font-medium text-muted" style={{ animationDelay: `${i * -0.7}s` }}>
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-5">
              <Link to="/contact" className="link">Tell us which one you need first</Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Why */}
      <section className="page mt-16 sm:mt-24" aria-labelledby="why">
        <SectionHead id="why" title="Why use Titrova?" text="Because pasting a client’s payload into a random website should not be a risk you have to think about." />
        <div className="mt-8">
          <Pipeline />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={i * 80} className="card p-5">
              <r.icon size={22} aria-hidden className="text-copper-ink" />
              <h3 className="mt-3 text-lg font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-muted">{r.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Guides */}
      <section className="page mt-16 sm:mt-24" aria-labelledby="guides">
        <SectionHead
          id="guides"
          title="Developer guides"
          text="Short, practical explanations of the ideas behind each tool."
          action={
            <Link to="/guides" className="btn btn-soft group">
              All guides <ArrowRight size={16} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {GUIDES.slice(0, 3).map((g, i) => {
            const t = toolBySlug(g.toolSlug);
            return (
              <Reveal key={g.slug} kind="rise" delay={i * 90}>
                <Link to={`/guides/${g.slug}`} className="card group flex h-full flex-col p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-lift sm:p-6">
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted">
                    <BookOpen size={16} aria-hidden /> {g.minutes} minute read
                  </span>
                  <span className="mt-3 block font-display text-xl font-semibold leading-snug tracking-tight">{g.title}</span>
                  <span className="mt-2 block text-muted">{g.description}</span>
                  <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-copper-ink">
                    <t.icon size={16} aria-hidden /> Goes with the {t.name}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="page mt-16 sm:mt-24 grid gap-x-12 gap-y-6 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="faq">
        <div>
          <Reveal as="h2" kind="clip" id="faq" className="text-3xl font-bold sm:text-[2.6rem]">
            Frequently asked questions
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 text-lg text-muted">
            The short version: it is free, it is private, and it is not made by Salesforce.
          </Reveal>
          <Reveal delay={200} className="mt-5">
            <Link to="/contact" className="btn btn-soft">Ask something else</Link>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <FaqList items={HOME_FAQS} idPrefix="home" />
        </Reveal>
      </section>

      {/* Closing call to action */}
      <section className="page mt-16 sm:mt-24" aria-labelledby="start">
        <Reveal kind="rise" className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-paper sm:px-10 sm:py-14">
          <div className="grid-bg absolute inset-0 opacity-40 invert dark:invert-0" aria-hidden="true" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 id="start" className="text-3xl font-bold sm:text-5xl">Paste something and see.</h2>
              <p className="mt-3 max-w-[44ch] text-lg text-paper/75">Every tool opens with a working example, so you can judge it in ten seconds.</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {TOOLS.filter((t) => POPULAR_CTA.includes(t.slug)).map((t) => (
                <li key={t.slug}>
                  <Link to={t.path} className="group flex items-center gap-3 rounded-xl border border-paper/15 bg-paper/5 px-4 py-3 font-semibold transition-colors duration-300 hover:bg-paper hover:text-ink">
                    <span aria-hidden="true" className="shrink-0 text-lg">{t.emoji}</span>
                    <span className="flex-1">{t.short}</span>
                    <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/tools" className="group flex items-center gap-3 rounded-xl bg-paper px-4 py-3 font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5">
                  <span aria-hidden="true" className="shrink-0 text-lg">🧪</span>
                  <span className="flex-1">All {TOOLS.length} tools</span>
                  <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
}
