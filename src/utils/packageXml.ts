import { ToolError } from './errors';

export interface PackageTypeSelection {
  name: string;
  members: string[];
  wildcard: boolean;
}

export interface PackageXmlResult {
  xml: string;
  typeCount: number;
  memberCount: number;
  warnings: string[];
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function validateApiVersion(version: string): string | null {
  const v = version.trim();
  if (!v) return 'Enter an API version, for example 62.0.';
  if (!/^\d{1,3}\.0$/.test(v)) return 'The API version must look like 62.0 (a whole number followed by “.0”).';
  const n = parseInt(v, 10);
  if (n < 7) return 'API versions below 7.0 are not supported by the Metadata API.';
  return null;
}

/** Split typed or pasted member names: commas and new lines separate values. */
export function parseMembers(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildPackageXml(selections: PackageTypeSelection[], apiVersion: string): PackageXmlResult {
  const versionError = validateApiVersion(apiVersion);
  if (versionError) throw new ToolError(versionError);

  const warnings: string[] = [];
  const merged = new Map<string, { members: Set<string>; wildcard: boolean }>();
  for (const sel of selections) {
    const name = sel.name.trim();
    if (!name) continue;
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new ToolError(`“${name}” is not a valid metadata type name.`);
    const entry = merged.get(name) ?? { members: new Set<string>(), wildcard: false };
    entry.wildcard = entry.wildcard || sel.wildcard;
    for (const m of sel.members) {
      const member = m.trim();
      if (member === '*') entry.wildcard = true;
      else if (member) entry.members.add(member);
    }
    merged.set(name, entry);
  }

  const usable = [...merged].filter(([name, e]) => {
    if (e.wildcard || e.members.size) return true;
    warnings.push(`${name} was left out because it has no members. Add member names or turn on the wildcard.`);
    return false;
  });
  if (!usable.length) throw new ToolError('Add at least one metadata type with members before generating package.xml.');

  usable.sort(([a], [b]) => a.localeCompare(b));
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'];
  let memberCount = 0;
  for (const [name, e] of usable) {
    lines.push('    <types>');
    if (e.wildcard) {
      lines.push('        <members>*</members>');
      memberCount++;
    }
    for (const member of [...e.members].sort((a, b) => a.localeCompare(b))) {
      lines.push(`        <members>${escapeXml(member)}</members>`);
      memberCount++;
    }
    lines.push(`        <name>${name}</name>`);
    lines.push('    </types>');
  }
  lines.push(`    <version>${apiVersion.trim()}</version>`);
  lines.push('</Package>');

  return { xml: lines.join('\n') + '\n', typeCount: usable.length, memberCount, warnings };
}
