import { DocPage } from '@/components/layout/DocPage';
import type { Block } from '@/data/content';
import { ads, analyticsToken, site } from '@/data/site';

const operator = site.author ? `${site.name} is an independent website run by ${site.author}.` : `${site.name} is an independent website.`;

const storageRows: string[][] = [
  ['`titrova-theme`', 'Local storage', 'Remembers whether you chose the light or dark theme. Contains only the word “light” or “dark”.', 'Until you clear your browser’s site data'],
  ...(ads.enabled
    ? [['Google advertising cookies', 'Cookies (third party)', 'Set by Google to show, measure and limit the frequency of ads, and to remember your consent choice.', 'Set by Google; see Google’s policy']]
    : []),
];

const serviceRows: string[][] = [
  ['Cloudflare Pages', 'Hosts the site and protects it from abuse', 'Every visit'],
  ['GitHub', 'Bug reports and suggestions', 'Only if you open a GitHub link'],
  ...(analyticsToken ? [['Cloudflare Web Analytics', 'Counts page views without cookies', 'Every visit']] : []),
  ...(ads.enabled ? [['Google AdSense', 'Shows advertisements', 'Pages that display ads']] : []),
];

const blocks: Block[] = [
  { h: 'Who we are' },
  { p: `${operator} In this policy, “we” and “us” mean the person who operates the site, and “you” means anyone who visits it. We are responsible for the information described here.` },
  { h: 'What you enter into the tools' },
  { p: 'JSON, SOQL queries, record IDs, metadata names, object and field names and any other tool input are processed by JavaScript running in your browser tab. This input is never sent to us or to anyone else, is never logged, and is not saved between visits. When you close or reload the page, it is gone.' },
  { p: 'The Copy and Paste buttons use your browser’s clipboard only when you press them. The Download buttons create a file directly on your device.' },
  { h: 'Information we do not collect' },
  { ul: [
    'No accounts, so no usernames or passwords.',
    'No names, email addresses or phone numbers, unless you choose to contact us.',
    'No content you type into the tools.',
    'No payment information. Everything is free.',
    'No fingerprinting, session recording or cross-site tracking by us.',
  ] },
  { h: 'Cookies and local storage' },
  { p: ads.enabled
      ? 'We store one setting in your browser. Our advertising partner also uses cookies, as listed below.'
      : 'We do not set cookies. We store one setting in your browser, listed below. It is not used to identify you and is never sent to a server.' },
  { table: storageRows, head: ['Name', 'Type', 'Purpose', 'How long'], caption: 'What is stored in your browser' },
  { p: 'You can delete it at any time by clearing this site’s data in your browser settings. The site works normally without it; you will simply see the light theme.' },
  { h: 'Hosting and server logs' },
  { p: 'The site is served by Cloudflare. Like any web host, Cloudflare processes technical information needed to deliver pages and protect the service, such as your IP address, browser type and the page requested. We do not combine this with anything else and do not use it to identify visitors. Cloudflare handles this data under its own privacy policy.' },
  { h: 'Analytics' },
  { p: analyticsToken
      ? 'We use Cloudflare Web Analytics to count page views and measure loading speed. It sets no cookies, stores nothing on your device and builds no profile of you. We only see totals, such as how often a page was opened and from which country.'
      : 'We do not run any analytics script. There is no page-view tracking and no session recording.' },
  { h: 'Advertising' },
  ...(ads.enabled
    ? ([
        { p: 'This site shows advertisements provided by Google AdSense. Advertising is what keeps the tools free.' },
        { ul: [
          'Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this website or other websites.',
          'Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and other sites on the internet.',
          'You can opt out of personalised advertising in Google’s Ads Settings at `https://adssettings.google.com`, and from some other vendors at `https://www.aboutads.info`.',
          'Visitors in the European Economic Area, the United Kingdom and Switzerland are asked for consent before advertising cookies are used, and can change their choice at any time from the privacy link shown with the consent message.',
        ] },
        { p: 'Advertising scripts are separate from the tools and never receive what you type into a tool.' },
      ] as Block[])
    : ([
        { p: 'The site does not currently show advertisements. No advertising scripts are loaded and no advertising cookies are set.' },
        { p: 'The site is intended to be supported by advertising in future. Before any ads appear, this policy will be updated to name the advertising provider, list the cookies involved and explain how to opt out. Visitors in regions that require it will be asked for consent first.' },
      ] as Block[])),
  { h: 'Third-party services' },
  { table: serviceRows, head: ['Service', 'What it does', 'When it is involved'], caption: 'Services that may process technical data' },
  { p: 'Links to other websites are provided for convenience. Those sites have their own privacy policies, and we are not responsible for how they handle information.' },
  { h: 'Contacting us' },
  { p: 'If you send a bug report, a suggestion or an email, we receive whatever you choose to include and use it only to reply and to improve the site. Please remove confidential data from examples before sending them. Messages sent through GitHub are public and are governed by GitHub’s terms.' },
  { h: 'How long we keep information' },
  { ul: [
    'Tool input: never stored.',
    'Your theme setting: stays in your browser until you clear it.',
    'Emails you send us: kept only as long as needed to deal with your message, and deleted on request.',
    'Hosting logs: kept by Cloudflare for its own limited period.',
  ] },
  { h: 'Legal basis' },
  { p: 'Where data protection law asks for a legal basis, we rely on legitimate interests to serve and secure the website, on your request when we reply to a message, and on your consent for advertising cookies where consent is required.' },
  { h: 'Your rights' },
  { p: 'Depending on where you live, you may have the right to know what information we hold about you, to have it corrected or deleted, to withdraw consent, and to complain to a data protection authority. These rights come from laws such as the EU and UK General Data Protection Regulation, the California Consumer Privacy Act, and India’s Digital Personal Data Protection Act, 2023.' },
  { p: 'Because the tools do not collect personal information, there is usually nothing for us to provide or delete. If you have written to us and want that correspondence removed, ask and we will delete it. We do not sell or share personal information.' },
  { h: 'Children' },
  { p: 'This site is a set of tools for software professionals and learners. It is not directed at children, and we do not knowingly collect personal information from anyone under 18.' },
  { h: 'Security' },
  { p: 'Pages are served only over HTTPS with security headers that limit framing and content sniffing. Because tool input never leaves your device, there is no stored copy of it that could be exposed.' },
  { h: 'Changes to this policy' },
  { p: 'If the way the site handles information changes, for example when advertising is introduced, this page will be updated before the change takes effect and the effective date at the top will change.' },
];

export default function Privacy() {
  return (
    <DocPage
      legal
      title="Privacy policy"
      seoTitle="Privacy Policy"
      description="How Titrova handles your data: tool input is processed in your browser and never uploaded. Details on storage, hosting, analytics, ads and your rights."
      path="/privacy-policy"
      lead="What happens to the things you type here, written in plain language."
      blocks={blocks}
      summary={{
        title: 'Key points',
        points: [
          'Tool input never leaves your browser',
          'No accounts and no personal data requested',
          analyticsToken ? 'Cookieless, aggregate page counts only' : 'No analytics or tracking scripts',
          ads.enabled ? 'Ads by Google AdSense, with opt-outs explained' : 'No ads and no cookies at present',
          'Your rights are respected wherever you live',
        ],
      }}
    />
  );
}
