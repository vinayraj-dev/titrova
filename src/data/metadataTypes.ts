export interface MetadataType {
  name: string;
  label: string;
  /** Whether the Metadata API accepts <members>*</members> for this type. */
  wildcard: boolean;
  /** Shown as the placeholder when adding members. */
  example: string;
  note?: string;
  /** Required by the product spec as a "common" type; listed first. */
  common?: boolean;
}

/**
 * A curated list of frequently deployed metadata types — NOT the complete Metadata API coverage.
 * Salesforce adds types every release; any other type can be added by name in the builder.
 * To maintain: add a row here. Nothing else needs to change.
 */
export const METADATA_TYPES: MetadataType[] = [
  { name: 'ApexClass', label: 'Apex classes', wildcard: true, example: 'AccountService', common: true },
  { name: 'ApexTrigger', label: 'Apex triggers', wildcard: true, example: 'AccountTrigger', common: true },
  { name: 'CustomObject', label: 'Custom objects', wildcard: true, example: 'Invoice__c', common: true, note: 'The wildcard covers custom objects only. Name standard objects (Account, Case…) explicitly.' },
  { name: 'CustomField', label: 'Custom fields', wildcard: false, example: 'Account.Region__c', common: true, note: 'Use Object.Field format.' },
  { name: 'Flow', label: 'Flows', wildcard: true, example: 'Lead_Assignment', common: true },
  { name: 'LightningComponentBundle', label: 'Lightning web components', wildcard: true, example: 'accountList', common: true },
  { name: 'AuraDefinitionBundle', label: 'Aura components', wildcard: true, example: 'AccountPanel', common: true },
  { name: 'Layout', label: 'Page layouts', wildcard: true, example: 'Account-Account Layout', common: true, note: 'Use Object-Layout Name format.' },
  { name: 'Profile', label: 'Profiles', wildcard: true, example: 'Admin', common: true, note: 'A profile only includes permissions for the other components in the same package.xml.' },
  { name: 'PermissionSet', label: 'Permission sets', wildcard: true, example: 'Sales_Manager', common: true },
  { name: 'CustomLabel', label: 'Custom labels (individual)', wildcard: false, example: 'Welcome_Message', common: true, note: 'To retrieve every label, use the CustomLabels type with the wildcard instead.' },
  { name: 'StaticResource', label: 'Static resources', wildcard: true, example: 'jquery', common: true },
  { name: 'ValidationRule', label: 'Validation rules', wildcard: false, example: 'Account.Require_Industry', common: true, note: 'Use Object.RuleName format.' },
  { name: 'ApexPage', label: 'Visualforce pages', wildcard: true, example: 'InvoicePdf' },
  { name: 'ApexComponent', label: 'Visualforce components', wildcard: true, example: 'InvoiceHeader' },
  { name: 'CustomLabels', label: 'Custom labels (all)', wildcard: true, example: 'CustomLabels' },
  { name: 'CustomMetadata', label: 'Custom metadata records', wildcard: true, example: 'Setting.Default' },
  { name: 'CustomTab', label: 'Custom tabs', wildcard: true, example: 'Invoice__c' },
  { name: 'CustomApplication', label: 'Apps', wildcard: true, example: 'Sales_Console' },
  { name: 'CustomPermission', label: 'Custom permissions', wildcard: true, example: 'Can_Approve_Refunds' },
  { name: 'PermissionSetGroup', label: 'Permission set groups', wildcard: true, example: 'Sales_Team' },
  { name: 'FlexiPage', label: 'Lightning pages', wildcard: true, example: 'Account_Record_Page' },
  { name: 'RecordType', label: 'Record types', wildcard: false, example: 'Account.Partner', note: 'Use Object.RecordType format.' },
  { name: 'ListView', label: 'List views', wildcard: false, example: 'Account.My_Accounts', note: 'Use Object.ListView format.' },
  { name: 'CompactLayout', label: 'Compact layouts', wildcard: false, example: 'Account.Summary', note: 'Use Object.LayoutName format.' },
  { name: 'WebLink', label: 'Buttons and links', wildcard: false, example: 'Account.Open_Map', note: 'Use Object.LinkName format.' },
  { name: 'QuickAction', label: 'Quick actions', wildcard: true, example: 'Account.New_Invoice' },
  { name: 'GlobalValueSet', label: 'Global value sets', wildcard: true, example: 'Regions' },
  { name: 'StandardValueSet', label: 'Standard value sets', wildcard: false, example: 'Industry' },
  { name: 'Workflow', label: 'Workflow rules', wildcard: true, example: 'Account' },
  { name: 'ApprovalProcess', label: 'Approval processes', wildcard: true, example: 'Opportunity.Discount_Approval' },
  { name: 'EmailTemplate', label: 'Email templates', wildcard: false, example: 'Sales_Templates/Welcome', note: 'Use Folder/TemplateName format.' },
  { name: 'Report', label: 'Reports', wildcard: false, example: 'Sales_Reports/Pipeline', note: 'Use Folder/ReportName format.' },
  { name: 'Dashboard', label: 'Dashboards', wildcard: false, example: 'Sales_Dashboards/Overview', note: 'Use Folder/DashboardName format.' },
  { name: 'NamedCredential', label: 'Named credentials', wildcard: true, example: 'Billing_API' },
  { name: 'RemoteSiteSetting', label: 'Remote site settings', wildcard: true, example: 'Billing_API' },
  { name: 'Queue', label: 'Queues', wildcard: true, example: 'Support_Tier_1' },
  { name: 'Group', label: 'Public groups', wildcard: true, example: 'All_Sales' },
  { name: 'Role', label: 'Roles', wildcard: true, example: 'CEO' },
  { name: 'SharingRules', label: 'Sharing rules', wildcard: true, example: 'Account' },
  { name: 'Translations', label: 'Translations', wildcard: true, example: 'fr' },
  { name: 'PlatformEventChannel', label: 'Platform event channels', wildcard: true, example: 'Order_Events__chn' },
];

export interface Preset {
  id: string;
  label: string;
  description: string;
  types: { name: string; wildcard: boolean; members: string[] }[];
}

const all = (...names: string[]) => names.map((name) => ({ name, wildcard: true, members: [] }));

export const PRESETS: Preset[] = [
  { id: 'apex', label: 'Apex code', description: 'Classes, triggers, Visualforce pages and components', types: all('ApexClass', 'ApexTrigger', 'ApexPage', 'ApexComponent') },
  { id: 'lightning', label: 'Lightning UI', description: 'LWC, Aura and Lightning pages', types: all('LightningComponentBundle', 'AuraDefinitionBundle', 'FlexiPage') },
  { id: 'automation', label: 'Automation', description: 'Flows, workflow rules and approval processes', types: all('Flow', 'Workflow', 'ApprovalProcess') },
  { id: 'security', label: 'Access and security', description: 'Profiles, permission sets, groups and custom permissions', types: all('Profile', 'PermissionSet', 'PermissionSetGroup', 'CustomPermission') },
  { id: 'data-model', label: 'Data model', description: 'Custom objects, labels, tabs, layouts and value sets', types: all('CustomObject', 'CustomLabels', 'CustomTab', 'Layout', 'GlobalValueSet') },
  { id: 'full-dev', label: 'Typical dev project', description: 'Code, Lightning, flows, objects and permission sets', types: all('ApexClass', 'ApexTrigger', 'LightningComponentBundle', 'AuraDefinitionBundle', 'Flow', 'CustomObject', 'PermissionSet', 'StaticResource', 'CustomLabels') },
];
