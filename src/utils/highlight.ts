export type Lang = 'soql' | 'apex' | 'json' | 'xml' | 'text';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Rule = [cls: string, re: RegExp];

const RULES: Record<Exclude<Lang, 'text'>, { rules: Rule[]; flags: string }> = {
  soql: {
    flags: 'gi',
    rules: [
      ['str', /'(?:\\.|[^'\\])*'?/],
      ['bind', /:\s*[A-Za-z_][\w.]*/],
      [
        'kw',
        /\b(?:SELECT|FROM|WHERE|AND|OR|NOT|IN|LIKE|INCLUDES|EXCLUDES|ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT|OFFSET|ASC|DESC|NULLS\s+(?:FIRST|LAST)|WITH|TYPEOF|WHEN|THEN|ELSE|END|USING\s+SCOPE|FOR\s+(?:UPDATE|VIEW|REFERENCE)|ALL\s+ROWS|SECURITY_ENFORCED|USER_MODE|SYSTEM_MODE)\b/,
      ],
      ['lit', /\b(?:null|true|false)\b/],
      ['fn', /\b[A-Za-z_]\w*(?=\()/],
      ['num', /\b\d[\d.:\-TZ+]*\b/],
    ],
  },
  apex: {
    flags: 'g',
    rules: [
      ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
      ['str', /'(?:\\.|[^'\\\n])*'?/],
      ['ann', /@\w+/],
      [
        'kw',
        /\b(?:public|private|global|protected|static|final|class|return|new|if|else|for|while|insert|update|delete|void|with|without|sharing|get|set|null|true|false|this|virtual|abstract|override|try|catch|throw|SELECT|FROM|WHERE)\b/,
      ],
      ['type', /\b[A-Z]\w*\b/],
      ['num', /\b\d+(?:\.\d+)?\b/],
    ],
  },
  json: {
    flags: 'g',
    rules: [
      ['key', /"(?:\\.|[^"\\\n])*"(?=\s*:)/],
      ['str', /"(?:\\.|[^"\\\n])*"?/],
      ['num', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
      ['lit', /\b(?:true|false|null)\b/],
    ],
  },
  xml: {
    flags: 'g',
    rules: [
      ['com', /<!--[\s\S]*?-->/],
      ['tag', /<\/?[\w:.-]+|\/?>|<\?\w+|\?>/],
      ['str', /"[^"]*"/],
      ['key', /\b[\w:.-]+(?==")/],
    ],
  },
};

const compiled = new Map<string, RegExp>();

/** Returns HTML with <span class="tk-*"> wrappers. All source text is HTML-escaped. */
export function highlight(code: string, lang: Lang): string {
  if (lang === 'text' || code.length > 60_000) return esc(code);
  const { rules, flags } = RULES[lang];
  let re = compiled.get(lang);
  if (!re) {
    re = new RegExp(rules.map(([, r], i) => `(?<g${i}>${r.source})`).join('|'), flags);
    compiled.set(lang, re);
  }
  re.lastIndex = 0;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    if (!m[0]) continue;
    const idx = m.index ?? 0;
    out += esc(code.slice(last, idx));
    const gi = rules.findIndex((_, i) => m.groups![`g${i}`] !== undefined);
    out += `<span class="tk-${rules[gi][0]}">${esc(m[0])}</span>`;
    last = idx + m[0].length;
  }
  return out + esc(code.slice(last));
}
