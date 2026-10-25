// Minimal, defensive XML tokenizer for GPX files. Author: A097MPRUS.
//
// GPX files come from the user's disk and are untrusted. This tokenizer:
// - refuses DOCTYPE declarations, so no entity can be defined or expanded (no XXE, no
//   "billion laughs");
// - decodes only the five predefined entities and numeric character references;
// - never builds HTML: callers receive plain strings;
// - limits nesting depth;
// - works without DOMParser, so it runs inside a Web Worker and in Node tests.

export class XmlError extends Error {
  readonly line: number;
  constructor(message: string, line: number) {
    super(line > 0 ? `${message} (line ${line})` : message);
    this.name = 'XmlError';
    this.line = line;
  }
}

export interface XmlHandler {
  open(name: string, attrs: Record<string, string>): void;
  close(name: string): void;
  text(value: string): void;
}

export interface XmlResult {
  /** Elements still open when the input ended, outermost first (empty for complete documents). */
  unclosed: string[];
}

const MAX_DEPTH = 256;

/** The part of a qualified name after the namespace prefix (`gpxtpx:hr` becomes `hr`). */
export function localName(name: string): string {
  const i = name.indexOf(':');
  return i < 0 ? name : name.slice(i + 1);
}

const NAMED: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

export function decodeEntities(value: string): string {
  if (value.indexOf('&') < 0) return value;
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (whole, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      if (
        !Number.isFinite(code) ||
        code <= 0 ||
        code > 0x10ffff ||
        (code >= 0xd800 && code <= 0xdfff)
      )
        return '�';
      return String.fromCodePoint(code);
    }
    return NAMED[ref] ?? whole;
  });
}

function lineAt(input: string, index: number): number {
  let line = 1;
  for (let i = input.indexOf('\n'); i >= 0 && i < index; i = input.indexOf('\n', i + 1)) line++;
  return line;
}

const NAME_END = /[\s/>]/;

/**
 * Streams the elements of `input` to `handler`. Throws XmlError for malformed markup.
 * A document that simply stops (truncated download) is reported through `unclosed`
 * instead of an exception, so callers can keep the data read so far.
 */
export function tokenize(input: string, handler: XmlHandler): XmlResult {
  const stack: string[] = [];
  const n = input.length;
  let i = 0;
  // Byte order mark.
  if (input.charCodeAt(0) === 0xfeff) i = 1;
  let seenRoot = false;

  while (i < n) {
    const lt = input.indexOf('<', i);
    if (lt < 0) {
      if (stack.length && input.slice(i).trim()) handler.text(decodeEntities(input.slice(i)));
      break;
    }
    if (lt > i) {
      const raw = input.slice(i, lt);
      if (stack.length) handler.text(decodeEntities(raw));
      else if (raw.trim())
        throw new XmlError('Text found outside the root element', lineAt(input, i));
    }
    const next = input.charCodeAt(lt + 1);
    if (next === 63 /* ? */) {
      const end = input.indexOf('?>', lt + 2);
      if (end < 0) return { unclosed: stack.slice() };
      i = end + 2;
      continue;
    }
    if (next === 33 /* ! */) {
      if (input.startsWith('<!--', lt)) {
        const end = input.indexOf('-->', lt + 4);
        if (end < 0) return { unclosed: stack.slice() };
        i = end + 3;
        continue;
      }
      if (input.startsWith('<![CDATA[', lt)) {
        const end = input.indexOf(']]>', lt + 9);
        if (end < 0) return { unclosed: stack.slice() };
        if (stack.length) handler.text(input.slice(lt + 9, end));
        i = end + 3;
        continue;
      }
      if (/^<!DOCTYPE/i.test(input.slice(lt, lt + 9)))
        throw new XmlError(
          'DOCTYPE declarations are not accepted in GPX files (they could define entities)',
          lineAt(input, lt),
        );
      throw new XmlError('Unexpected markup declaration', lineAt(input, lt));
    }
    if (next === 47 /* / */) {
      const end = input.indexOf('>', lt + 2);
      if (end < 0) return { unclosed: stack.slice() };
      const name = input.slice(lt + 2, end).trim();
      const open = stack.pop();
      if (open === undefined)
        throw new XmlError(`Closing tag </${name}> without an opening tag`, lineAt(input, lt));
      if (open !== name)
        throw new XmlError(`Expected </${open}> but found </${name}>`, lineAt(input, lt));
      handler.close(name);
      i = end + 1;
      continue;
    }
    // Opening or empty element tag. Attribute values may contain '>' inside quotes.
    let j = lt + 1;
    const nameMatch = NAME_END.exec(input.slice(j, j + 256));
    const nameLength = nameMatch ? nameMatch.index : -1;
    if (nameLength <= 0) {
      if (j >= n) return { unclosed: stack.slice() };
      throw new XmlError('Invalid element name', lineAt(input, lt));
    }
    const name = input.slice(j, j + nameLength);
    j += nameLength;
    const attrs: Record<string, string> = {};
    let selfClosing = false;
    let attrCount = 0;
    for (;;) {
      while (j < n && /\s/.test(input[j] ?? '')) j++;
      if (j >= n) return { unclosed: stack.slice() };
      const c = input[j];
      if (c === '>') {
        j++;
        break;
      }
      if (c === '/' && input[j + 1] === '>') {
        selfClosing = true;
        j += 2;
        break;
      }
      const eq = input.indexOf('=', j);
      if (eq < 0) return { unclosed: stack.slice() };
      const attrName = input.slice(j, eq).trim();
      if (!attrName || /[\s<>"']/.test(attrName))
        throw new XmlError(`Invalid attribute in <${name}>`, lineAt(input, j));
      let k = eq + 1;
      while (k < n && /\s/.test(input[k] ?? '')) k++;
      const quote = input[k];
      if (quote !== '"' && quote !== "'") {
        if (k >= n) return { unclosed: stack.slice() };
        throw new XmlError(`Attribute ${attrName} of <${name}> is not quoted`, lineAt(input, k));
      }
      const close = input.indexOf(quote, k + 1);
      if (close < 0) return { unclosed: stack.slice() };
      if (++attrCount > 128)
        throw new XmlError(`Too many attributes in <${name}>`, lineAt(input, j));
      attrs[localName(attrName)] = decodeEntities(input.slice(k + 1, close));
      j = close + 1;
    }
    if (!stack.length) {
      if (seenRoot) throw new XmlError('More than one root element', lineAt(input, lt));
      seenRoot = true;
    }
    handler.open(name, attrs);
    if (selfClosing) handler.close(name);
    else {
      stack.push(name);
      if (stack.length > MAX_DEPTH)
        throw new XmlError('Elements are nested too deeply', lineAt(input, lt));
    }
    i = j;
  }
  if (!seenRoot) throw new XmlError('The file contains no XML elements', 0);
  return { unclosed: stack.slice() };
}
