import { DocPage } from '@/components/layout/DocPage';
import type { Block } from '@/data/content';
import { site } from '@/data/site';

const blocks: Block[] = [
  { h: 'Independent of Salesforce' },
  { p: site.disclaimer },
  { p: 'Salesforce, Apex, SOQL, Lightning and other product names are trademarks of Salesforce, Inc. They appear on this site only to describe what the tools are compatible with. The site does not use Salesforce logos or branding.' },
  { h: 'Generated code and files' },
  { p: 'The tools produce Apex, SOQL and XML by applying general rules to what you enter. They do not connect to a Salesforce org and know nothing about your objects, fields, validation rules, sharing model or API version.' },
  { ul: [
    'Output may need changes before it compiles or behaves correctly in your org.',
    'Types inferred from a sample JSON payload may not match every response an API can return.',
    'A formatted query has the same meaning as the query you entered, but is not checked against your schema.',
    'A converted ID is correctly formed; that does not mean a record with that ID exists.',
    'A package.xml lists what you selected; it is not checked against the components in your org.',
  ] },
  { note: 'Always review generated output and test it in a sandbox, scratch org or other non-production environment before deploying.' },
  { h: 'Guides and documentation' },
  { p: 'The guides describe how the platform is generally understood to behave at the time of writing. Salesforce changes with every release, and its official documentation is the authority. If you find something out of date or wrong, please tell us.' },
  { h: 'No professional advice' },
  { p: 'Nothing on this site is professional, legal, security or compliance advice. Decisions about your Salesforce implementation are yours and your organisation’s.' },
  { h: 'Advertising' },
  { p: 'Advertisements, when shown, come from third parties. They are labelled, they are not endorsements, and we do not control their content.' },
  { h: 'External links' },
  { p: 'Links to other websites are provided for convenience. We do not control those sites and are not responsible for their content or availability.' },
  { h: 'Availability' },
  { p: 'The site is offered free of charge and may change, be interrupted or be withdrawn without notice.' },
];

export default function Disclaimer() {
  return (
    <DocPage
      legal
      title="Disclaimer"
      description="Titrova is independent of Salesforce, Inc. Generated code is provided as is and should always be reviewed and tested before you deploy it."
      path="/disclaimer"
      lead="What this site is not, and what its output is not."
      blocks={blocks}
      summary={{ title: 'Keep in mind', points: ['Independent of Salesforce, Inc.', 'The tools never see your org', 'Output is a starting point', 'Test before you deploy'] }}
    />
  );
}
