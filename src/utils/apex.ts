/** Words that cannot be used as identifiers in Apex (compared case-insensitively). */
export const APEX_RESERVED = new Set(
  `abstract activate and any array as asc autonomous begin bigdecimal blob boolean break bulk by byte case cast
  catch char class collect commit const continue currency date datetime decimal default delete desc do double else
  end enum exception exit export extends false final finally float for from global goto group having hint if
  implements import in inner insert instanceof int integer interface into join like limit list long loop map merge
  new not null nulls number object of on or outer override package parallel pragma private protected public
  retrieve return rollback select set short sobject sort static string super switch synchronized system testmethod
  then this throw time transaction trigger true try undelete update upsert using virtual void webservice when
  where while`
    .split(/\s+/)
    .filter(Boolean),
);

/** Type names that would be confusing or illegal as generated inner-class names. */
const SYSTEM_TYPE_NAMES = new Set(
  `string integer long decimal double boolean date datetime time id blob object list set map sobject system test
  json type math database schema exception`
    .split(/\s+/)
    .filter(Boolean),
);

export function isReservedWord(name: string): boolean {
  return APEX_RESERVED.has(name.toLowerCase());
}

export function isSystemTypeName(name: string): boolean {
  return SYSTEM_TYPE_NAMES.has(name.toLowerCase());
}

/** Apex identifier rules: starts with a letter, letters/digits/underscores, no "__", no trailing "_". */
export function isValidApexIdentifier(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(name) && !name.includes('__') && !name.endsWith('_') && name.length <= 255;
}

/** sObject / field API names may contain "__" (namespaces, __c, __r). */
export function isValidApiName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(name) && !/___/.test(name) && !/_$/.test(name);
}

/** Escape text for use inside an Apex single-quoted string literal. */
export function apexString(value: string): string {
  return (
    "'" +
    value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t') +
    "'"
  );
}
