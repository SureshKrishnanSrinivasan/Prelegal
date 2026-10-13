/**
 * Renderer-agnostic model of a legal document. The same blocks drive both the
 * on-screen HTML preview and the generated PDF, so the two always match.
 */

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string }
  /** A defined term whose value is set on the Cover Page (e.g. "Purpose"). */
  | { kind: "term"; text: string }
  /** A value entered by the user; `missing` marks an unfilled placeholder. */
  | { kind: "value"; text: string; missing: boolean };

export type ChoiceOption = { selected: boolean; content: Inline[] };

export type PartyRow = { label: string; note?: string; values: [Inline, Inline] };

export type Block =
  | { kind: "title"; text: string }
  | { kind: "heading"; text: string; note?: string }
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "clause"; number: number; content: Inline[] }
  | { kind: "choice"; options: ChoiceOption[] }
  /** Signature table; `intro` is kept on the same page as the table. */
  | { kind: "parties"; intro: Inline[]; headers: [string, string]; rows: PartyRow[] };

export function text(value: string): Inline {
  return { kind: "text", text: value };
}

function blockInlines(block: Block): Inline[] {
  switch (block.kind) {
    case "paragraph":
    case "clause":
      return block.content;
    case "choice":
      return block.options.flatMap((option) => option.content);
    case "parties":
      return block.rows.flatMap((row) => row.values);
    default:
      return [];
  }
}

/** Number of placeholders in the document that the user has not filled in yet. */
export function countMissing(blocks: Block[]): number {
  return blocks
    .flatMap(blockInlines)
    .filter((inline) => inline.kind === "value" && inline.missing).length;
}

/** A filled-in value. */
export function filled(value: string): Inline {
  return { kind: "value", text: value, missing: false };
}

/** A user-entered value, falling back to a bracketed placeholder when blank. */
export function value(entered: string, placeholder: string): Inline {
  const trimmed = entered.trim();
  return trimmed ? filled(trimmed) : { kind: "value", text: `[${placeholder}]`, missing: true };
}
