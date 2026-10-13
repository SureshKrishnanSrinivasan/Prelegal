import type { Block, Inline } from "./document";

/**
 * Matches the inline markup used in Common Paper templates:
 *   **bold**, [text](url) and <span class="...">Defined Term</span>.
 */
const INLINE_PATTERN =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|<span class="[^"]*">(.+?)<\/span>/g;

export function parseInlines(source: string): Inline[] {
  const inlines: Inline[] = [];
  let last = 0;

  for (const match of source.matchAll(INLINE_PATTERN)) {
    if (match.index > last) {
      inlines.push({ kind: "text", text: source.slice(last, match.index) });
    }
    const [, bold, linkText, href, term] = match;
    if (bold !== undefined) inlines.push({ kind: "bold", text: bold });
    else if (linkText !== undefined) inlines.push({ kind: "link", text: linkText, href });
    else inlines.push({ kind: "term", text: term });
    last = match.index + match[0].length;
  }

  if (last < source.length) {
    inlines.push({ kind: "text", text: source.slice(last) });
  }
  return inlines;
}

const CLAUSE_PATTERN = /^(\d+)\.\s+(.*)$/;

/**
 * Parses a Common Paper "Standard Terms" template: a `# Title`, then numbered
 * clauses, then trailing paragraphs (e.g. the license footer).
 */
export function parseStandardTerms(markdown: string): Block[] {
  const blocks: Block[] = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      blocks.push({ kind: "title", text: line.slice(2).trim() });
      continue;
    }

    const clause = CLAUSE_PATTERN.exec(line);
    if (clause) {
      blocks.push({
        kind: "clause",
        number: Number(clause[1]),
        content: parseInlines(clause[2]),
      });
    } else {
      blocks.push({ kind: "paragraph", content: parseInlines(line) });
    }
  }

  return blocks;
}
