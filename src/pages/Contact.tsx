import { Link } from 'react-router-dom';
import { Bug, Github, Lightbulb, Mail } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Seo, breadcrumbLd } from '@/components/common/Seo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { site } from '@/data/site';
import { TOOLS } from '@/data/tools';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];

const issueUrl = (title: string, body: string) => `${site.repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
const mailUrl = (subject: string) => `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}`;

export default function Contact() {
  const hasEmail = !!site.contactEmail;
  const channels = [
    {
      icon: Bug,
      title: 'Report a problem',
      text: 'Something produced the wrong output or an error you did not expect.',
      label: 'Open a bug report on GitHub',
      href: issueUrl('Bug: ', 'Tool:\n\nWhat I entered (remove anything confidential):\n\nWhat I expected:\n\nWhat happened:\n\nBrowser and device:'),
    },
    {
      icon: Lightbulb,
      title: 'Suggest a tool',
      text: 'A repetitive Salesforce job that deserves a button.',
      label: 'Open a suggestion on GitHub',
      href: issueUrl('Tool idea: ', 'What should the tool do?\n\nWhat goes in, and what should come out?\n\nHow do you do this today?'),
    },
    hasEmail
      ? {
          icon: Mail,
          title: 'Email',
          text: 'For anything else, including privacy questions and advertising enquiries.',
          label: site.contactEmail,
          href: mailUrl('Titrova'),
        }
      : {
          icon: Github,
          title: 'Anything else',
          text: 'Questions, corrections to a guide, or privacy enquiries.',
          label: 'Start a discussion on GitHub',
          href: `${site.repoUrl}/issues`,
        },
  ];

  return (
    <>
      <Seo
        title="Contact Titrova – Bug Reports and Tool Ideas"
        description="Report a bug, suggest a new Salesforce developer tool or ask a question about Titrova."
        path="/contact"
        jsonLd={[breadcrumbLd(crumbs)]}
      />
      <div className="page pt-3 sm:pt-5">
        <Breadcrumbs items={crumbs} />
        <header className="mt-5 max-w-[52rem]">
          <h1 className="text-4xl font-bold sm:text-6xl">Contact</h1>
          <p className="mt-3 text-lg text-muted">
            Bug reports and tool ideas shape what gets built next. This is a small independent project, so replies can take a few days.
          </p>
          <div className="reaction-line mt-6 w-32" aria-hidden="true" />
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {channels.map((c, i) => (
            <Reveal key={c.title} kind="rise" delay={i * 90}>
              <a
                href={c.href}
                {...(c.href.startsWith('http') && { target: '_blank', rel: 'noreferrer' })}
                className="card group flex h-full flex-col p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-ink/40 hover:shadow-lift sm:p-6"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-paper transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <c.icon size={22} aria-hidden />
                </span>
                <span className="mt-4 block font-display text-2xl font-semibold tracking-tight">{c.title}</span>
                <span className="mt-2 block text-muted">{c.text}</span>
                <span className="link mt-auto block break-all pt-5">{c.label}</span>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <Reveal kind="left" className="card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">What makes a bug report easy to fix</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink/85 marker:font-semibold marker:text-copper-ink">
              <li>The name of the tool.</li>
              <li>The smallest input that shows the problem. Replace real names and IDs with made-up ones.</li>
              <li>What you expected to see, and what you saw instead.</li>
              <li>Your browser and whether you were on a phone or a computer.</li>
            </ol>
          </Reveal>
          <Reveal kind="right" delay={100} className="card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Before you write</h2>
            <p className="mt-3 text-ink/85">
              The tools never see your Salesforce org, so we cannot look anything up for you or recover data. Each tool page lists what it does and does not do,
              and that section answers most questions.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TOOLS.filter((t) => !t.staticPage).map((t) => (
                <li key={t.slug}>
                  <Link to={`${t.path}#features-and-limitations`} className="chip">
                    <t.icon size={15} aria-hidden /> {t.short}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </>
  );
}
