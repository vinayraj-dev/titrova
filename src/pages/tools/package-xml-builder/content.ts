import type { ToolContent } from '@/data/content';

export const content: ToolContent = {
  steps: [
    'Start from a preset, or search the list and select the metadata types you need.',
    'For each type, turn on the wildcard to include every component, or add member names one by one. You can paste a comma-separated list.',
    'Set the API version to one your org supports.',
    'Copy the XML or download it as `package.xml`, then use it with the Salesforce CLI, VS Code or a deployment tool.',
  ],
  features: [
    'Searchable catalogue of commonly deployed metadata types, with the 13 most-used types listed first.',
    'Wildcard switch per type, disabled where the Metadata API does not accept `*`.',
    'Hints for member formats, such as `Object.Field` for custom fields and `Folder/Name` for reports.',
    'Any other metadata type can be added by typing its name.',
    'Types and members are sorted and de-duplicated; special characters are XML-escaped.',
    'Presets for Apex code, Lightning UI, automation, security and the data model.',
  ],
  limitations: [
    'The catalogue is a curated subset, not the complete list of metadata types. Salesforce adds types in most releases.',
    'It does not connect to your org, so it cannot list your components or confirm that a member exists.',
    'It builds `package.xml` only. It does not create `destructiveChanges.xml` or the folder of metadata files.',
    'Wildcard support is recorded per type from Salesforce documentation and may change between API versions.',
  ],
  article: [
    { h: 'What package.xml is for' },
    { p: 'A `package.xml` manifest lists metadata components by type and name. The Metadata API uses it in two directions: to decide what to retrieve from an org, and to describe what a deployment contains. Tools such as the Salesforce CLI, the VS Code extensions, Ant-based scripts and most CI pipelines accept it.' },
    { h: 'Example' },
    { code: '<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n    <types>\n        <members>*</members>\n        <name>ApexClass</name>\n    </types>\n    <types>\n        <members>Account.Region__c</members>\n        <members>Invoice__c.Status__c</members>\n        <name>CustomField</name>\n    </types>\n    <version>62.0</version>\n</Package>', lang: 'xml' },
    { h: 'Wildcards: where they work and where they do not' },
    { p: 'An asterisk as the member means “all components of this type”. It is accepted for types such as `ApexClass`, `ApexTrigger`, `Flow`, `LightningComponentBundle`, `Layout` and `PermissionSet`. It is not accepted for components that live inside an object, such as `CustomField`, `ValidationRule`, `RecordType` and `ListView`, or for folder-based types such as `Report`, `Dashboard` and `EmailTemplate`. The builder turns the switch off for those types and shows the name format to use instead.' },
    { p: 'One special case is worth remembering: for `CustomObject`, the wildcard returns custom objects only. To retrieve a standard object such as `Account`, add it by name.' },
    { h: 'Choosing the API version' },
    { p: 'The `<version>` element sets the Metadata API version for the operation. Use the version of your project (the `sourceApiVersion` in `sfdx-project.json`) or the version your org is currently on. A version newer than the org supports causes the request to fail.' },
    { h: 'Using the file' },
    { code: '# Retrieve the listed components into your project\nsf project retrieve start --manifest package.xml\n\n# Deploy the listed components from your project\nsf project deploy start --manifest package.xml', lang: 'text' },
    { h: 'Common mistakes' },
    { ul: [
      'Using a label instead of an API name: `Invoice` instead of `Invoice__c`.',
      'Leaving out the object for child components: `Region__c` instead of `Account.Region__c`.',
      'Retrieving a profile alone. Profiles only include permissions for other components in the same manifest.',
      'Expecting the `CustomObject` wildcard to include standard objects.',
    ] },
  ],
  faqs: [
    { q: 'Where do I put package.xml?', a: 'In a Salesforce DX project it usually lives in a `manifest` folder at the project root. The file can be anywhere, as long as you pass its path to the `--manifest` flag.' },
    { q: 'Which API version should I use?', a: 'Use the version your project targets or the version of your org. You can see an org’s version in Setup under Apex Classes, where new classes default to the current version, or in the release information for your instance.' },
    { q: 'Why is the wildcard switch disabled for some types?', a: 'The Metadata API does not accept `*` for those types. Components that belong to an object need `Object.Component` names, and folder-based components need `Folder/Component` names.' },
    { q: 'Can I add a metadata type that is not in the list?', a: 'Yes. Type its exact name in the search box and choose to add it. The Metadata Coverage Report on the Salesforce developer site lists every type.' },
    { q: 'Does this tool connect to my org?', a: 'No. It builds the file from what you select and type. Nothing is sent to Salesforce or to us.' },
    { q: 'Can I use the same file to delete components?', a: 'Deletions use a separate file named `destructiveChanges.xml` with the same structure, deployed together with a `package.xml`. This builder creates the `package.xml` part.' },
  ],
};
