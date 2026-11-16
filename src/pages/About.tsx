import { Link } from 'react-router-dom';
import { DocPage } from '@/components/layout/DocPage';
import type { Block } from '@/data/content';
import { site } from '@/data/site';
import { TOOLS } from '@/data/tools';

const blocks: Block[] = [
  { h: 'What this is' },
  { p: 'Titrova is a small collection of free tools for people who build on Salesforce: developers, administrators, consultants and students. Each tool does one job that comes up constantly, such as turning a JSON payload into Apex classes or converting a column of record IDs, and does it without asking you to install anything or create an account.' },
  { h: 'The name' },
  { p: 'Titration is the lab technique of adding one solution to another, drop by drop, until it changes colour. That is what these tools do with your input: JSON becomes Apex, a one-line query becomes readable SOQL, a list of names becomes a deployment manifest. The site’s colours follow the same idea, from iodine amber to copper teal.' },
  { h: 'Why it exists' },
  { p: 'Most of these jobs take two minutes with the right utility and twenty without it. The utilities that already exist are often tied to a login, wrapped in a larger product, or run your input through someone else’s server. Salesforce work regularly involves client data and internal schema names, so “paste it into a website” is not always an acceptable answer.' },
  { p: 'The idea here is simple: the tool should come to your data, not the other way round. Everything runs as JavaScript in your browser tab.' },
  { h: 'Principles' },
  { ul: [
    'Useful first. A page earns its place by solving a real problem, not by ranking for a keyword.',
    'Honest about limits. The tools do not connect to an org, so they say clearly what they cannot check.',
    'Private by construction. There is no backend to send your input to.',
    'Free to use. No registration, no paid tier for the essentials.',
    'Accessible. Keyboard operable, readable in light and dark themes, and usable on a phone.',
  ] },
  { h: 'How it is funded' },
  { p: 'Hosting a static site costs very little, and the plan is to cover the time spent on it with advertising. Ads, when they are introduced, are kept away from tool inputs and outputs, are clearly labelled, and never appear as part of a result. If advertising is running when you read this, the privacy policy describes exactly what that involves.' },
  { h: 'How the tools are tested' },
  { p: 'The logic behind each tool is separate from its interface and covered by automated tests: nested and malformed JSON, hand-verified ID checksums, queries that must survive formatting unchanged, XML that must parse, and so on. The SOQL formatter also re-reads its own output and refuses to show a result that differs from the input in anything but spacing and keyword case.' },
  { h: 'Independence' },
  { p: site.disclaimer + ' Product names are used only to describe what the tools work with.' },
  { h: 'What comes next' },
  { p: 'Titrova started with five Salesforce tools and now includes everyday developer tools too, each with Salesforce extras such as Apex output. New tools are added based on what people actually use and ask for. AI features will only arrive if they can run entirely in your browser, because sending your code to an AI service would break the promise that nothing is uploaded.' },
];

export default function About() {
  return (
    <DocPage
      title="About"
      seoTitle="About Titrova – Free Salesforce Developer Tools"
      description="Titrova is an independent collection of free, browser-based tools for Salesforce developers. Read why it exists and how it works."
      path="/about"
      lead="Free tools for Salesforce developers, built to run entirely on your side of the screen."
      blocks={blocks}
      summary={{
        title: 'At a glance',
        points: [
          `${TOOLS.length} tools, all free`,
          'No account and no org login',
          'Input is processed in your browser',
          'Independent of Salesforce, Inc.',
          ...(site.author ? [`Built and maintained by ${site.author}`] : []),
        ],
      }}
    >
      <p>
        Found a bug, or have a tool in mind? <Link to="/contact">Get in touch</Link>. To see what the tools can do, start with the{' '}
        <Link to="/tools">full list</Link>.
      </p>
    </DocPage>
  );
}
