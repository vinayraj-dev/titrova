import { ToolError } from './errors';
import { lineCol } from './position';

interface Attr {
  name: string;
  value: string;
  quote: '"' | "'";
}
export type XTok =
  | { t: 'decl' | 'pi' | 'comment' | 'cdata' | 'doctype'; raw: string }
  | { t: 'open'; name: string; attrs: Attr[] }
  | { t: 'self'; name: string; attrs: Attr[] }
  | { t: 'close'; name: string }
  | { t: 'text'; raw: string };

export interface XmlStats {
  elements: number;
  attributes: number;
  depth: number;
}

const NAME = /^[A-Za-z_:][\w.:\-\u00B7-\uFFFF]*$/;
const ENTITY = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/;

function fail(src: string, at: number, message: string): never {
  const { line, column } = lineCol(src, at);
  throw new ToolError(`Invalid XML at line ${line}, column ${column}: ${message}`);
}

/** Tokenizes and checks well-formedness (matching tags, one root, quoted attributes, valid entities). */
export function parseXml(src: string): { tokens: XTok[]; stats: XmlStats } {
  if (!src.trim()) throw new ToolError('Please enter some input before generating output.');
  const tokens: XTok[] = [];
  const stack: { name: string; at: number }[] = [];
  const stats: XmlStats = { elements: 0, attributes: 0, depth: 0 };
  let rootSeen = false;
  let i = src.charCodeAt(0) === 0xfeff ? 1 : 0;
  const n = src.length;

  const checkText = (text: string, at: number) => {
    for (let k = 0; k < text.length; k++) {
      if (text[k] === '&' && !ENTITY.test(text.slice(k)))
        fail(src, at + k, '“&” must be written as &amp; unless it starts an entity such as &lt;.');
    }
  };

  while (i < n) {
    if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i + 2);
      if (end < 0) fail(src, i, 'A processing instruction “<?” is never closed with “?>”.');
      const raw = src.slice(i, end + 2);
      const isDecl = /^<\?xml[\s?]/i.test(raw);
      if (isDecl && tokens.length) fail(src, i, 'The XML declaration must be the very first thing in the document.');
      tokens.push({ t: isDecl ? 'decl' : 'pi', raw });
      i = end + 2;
    } else if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end < 0) fail(src, i, 'A comment “<!--” is never closed with “-->”.');
      tokens.push({ t: 'comment', raw: src.slice(i, end + 3) });
      i = end + 3;
    } else if (src.startsWith('<![CDATA[', i)) {
      if (!stack.length) fail(src, i, 'A CDATA section can only appear inside an element.');
      const end = src.indexOf(']]>', i);
      if (end < 0) fail(src, i, 'A CDATA section is never closed with “]]>”.');
      tokens.push({ t: 'cdata', raw: src.slice(i, end + 3) });
      i = end + 3;
    } else if (src.startsWith('<!DOCTYPE', i)) {
      if (rootSeen) fail(src, i, 'The DOCTYPE must come before the root element.');
      let j = i + 9;
      let bracket = 0;
      for (; j < n; j++) {
        if (src[j] === '[') bracket++;
        else if (src[j] === ']') bracket--;
        else if (src[j] === '>' && bracket <= 0) break;
      }
      if (j >= n) fail(src, i, 'The DOCTYPE is never closed with “>”.');
      tokens.push({ t: 'doctype', raw: src.slice(i, j + 1) });
      i = j + 1;
    } else if (src.startsWith('</', i)) {
      const m = /^<\/([^\s>]+)\s*>/.exec(src.slice(i));
      if (!m) fail(src, i, 'A closing tag is not written correctly. It should look like </name>.');
      const open = stack.pop();
      if (!open) fail(src, i, `The closing tag </${m[1]}> has no matching opening tag.`);
      if (open.name !== m[1]) {
        const { line } = lineCol(src, open.at);
        fail(src, i, `The closing tag </${m[1]}> does not match <${open.name}>, which was opened on line ${line}.`);
      }
      tokens.push({ t: 'close', name: m[1] });
      i += m[0].length;
    } else if (src[i] === '<') {
      const nm = /^<([^\s/>]+)/.exec(src.slice(i));
      if (!nm) fail(src, i, 'A “<” must start a tag. In text, write it as &lt;.');
      const name = nm[1];
      if (!NAME.test(name)) fail(src, i, `“${name}” is not a valid element name.`);
      if (!stack.length && rootSeen) fail(src, i, `An XML document can only have one root element, but <${name}> is a second one.`);
      let j = i + nm[0].length;
      const attrs: Attr[] = [];
      for (;;) {
        const ws = /^\s*/.exec(src.slice(j))![0].length;
        j += ws;
        if (src.startsWith('/>', j) || src[j] === '>') break;
        if (j >= n) fail(src, i, `The tag <${name}> is never closed with “>”.`);
        if (!ws) fail(src, j, `Attributes in <${name}> must be separated by spaces.`);
        const am = /^([^\s=/>]+)\s*=\s*/.exec(src.slice(j));
        if (!am) fail(src, j, `Each attribute in <${name}> needs a value, for example name="value".`);
        const aname = am[1];
        if (!NAME.test(aname)) fail(src, j, `“${aname}” is not a valid attribute name.`);
        j += am[0].length;
        const q = src[j];
        if (q !== '"' && q !== "'") fail(src, j, `The value of “${aname}” must be in quotes.`);
        const close = src.indexOf(q, j + 1);
        if (close < 0) fail(src, j, `The value of “${aname}” is missing its closing quote.`);
        const value = src.slice(j + 1, close);
        if (value.includes('<')) fail(src, j, `The value of “${aname}” contains “<”. Write it as &lt;.`);
        checkText(value, j + 1);
        if (attrs.some((a) => a.name === aname)) fail(src, j, `<${name}> has the attribute “${aname}” twice.`);
        attrs.push({ name: aname, value, quote: q });
        j = close + 1;
      }
      stats.elements++;
      stats.attributes += attrs.length;
      if (src.startsWith('/>', j)) {
        tokens.push({ t: 'self', name, attrs });
        if (!stack.length) rootSeen = true;
        i = j + 2;
      } else {
        tokens.push({ t: 'open', name, attrs });
        stack.push({ name, at: i });
        rootSeen = true;
        stats.depth = Math.max(stats.depth, stack.length);
        i = j + 1;
      }
    } else {
      let end = src.indexOf('<', i);
      if (end < 0) end = n;
      const raw = src.slice(i, end);
      if (!stack.length && raw.trim()) fail(src, i + raw.search(/\S/), 'Text is not allowed outside the root element.');
      checkText(raw, i);
      tokens.push({ t: 'text', raw });
      i = end;
    }
  }
  if (stack.length) {
    const open = stack[stack.length - 1];
    fail(src, open.at, `<${open.name}> is never closed. Add </${open.name}>.`);
  }
  if (!rootSeen) throw new ToolError('No root element was found. An XML document needs one element that contains everything else.');
  return { tokens, stats };
}

const tag = (t: { name: string; attrs: Attr[] }, self: boolean) =>
  `<${t.name}${t.attrs.map((a) => ` ${a.name}=${a.quote}${a.value}${a.quote}`).join('')}${self ? ' />' : '>'}`;

export interface XmlFormatResult {
  output: string;
  stats: XmlStats;
}

export function formatXml(src: string, options: { indent?: 2 | 4 | 'tab'; mode?: 'format' | 'minify' } = {}): XmlFormatResult {
  const { indent = 4, mode = 'format' } = options;
  const { tokens, stats } = parseXml(src);
  if (mode === 'minify') {
    const out = tokens
      .filter((t) => t.t !== 'text' || t.raw.trim())
      .map((t) => {
        if (t.t === 'open') return tag(t, false);
        if (t.t === 'self') return tag(t, true).replace(' />', '/>');
        if (t.t === 'close') return `</${t.name}>`;
        return t.raw;
      })
      .join('');
    return { output: out, stats };
  }
  const unit = indent === 'tab' ? '\t' : ' '.repeat(indent);
  const lines: string[] = [];
  let level = 0;
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    const pad = unit.repeat(level);
    if (t.t === 'open') {
      // <a>text</a> and <a></a> stay on one line
      const next = tokens[k + 1];
      const after = tokens[k + 2];
      if (next?.t === 'close') {
        lines.push(pad + tag(t, false) + `</${t.name}>`);
        k += 1;
        continue;
      }
      if ((next?.t === 'text' || next?.t === 'cdata') && after?.t === 'close') {
        const inner = next.t === 'text' ? next.raw.trim() : next.raw;
        lines.push(pad + tag(t, false) + inner + `</${t.name}>`);
        k += 2;
        continue;
      }
      lines.push(pad + tag(t, false));
      level++;
    } else if (t.t === 'close') {
      level--;
      lines.push(unit.repeat(level) + `</${t.name}>`);
    } else if (t.t === 'self') lines.push(pad + tag(t, true));
    else if (t.t === 'text') {
      const text = t.raw.trim();
      if (text) lines.push(pad + text);
    } else if ('raw' in t) lines.push(pad + t.raw);
  }
  return { output: lines.join('\n'), stats };
}
