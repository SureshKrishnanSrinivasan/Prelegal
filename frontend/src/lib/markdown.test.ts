import { describe, expect, it } from "vitest";
import { readTemplate } from "@/test/templates";
import { parseInlines, parseStandardTerms } from "./markdown";

describe("parseInlines", () => {
  it("splits bold, links and defined terms out of plain text", () => {
    expect(
      parseInlines(
        'Use for the <span class="coverpage_link">Purpose</span> (“**MNDA**”), see [CC BY 4.0](https://example.com).',
      ),
    ).toEqual([
      { kind: "text", text: "Use for the " },
      { kind: "term", text: "Purpose" },
      { kind: "text", text: " (“" },
      { kind: "bold", text: "MNDA" },
      { kind: "text", text: "”), see " },
      { kind: "link", text: "CC BY 4.0", href: "https://example.com" },
      { kind: "text", text: "." },
    ]);
  });

  it("returns plain text unchanged", () => {
    expect(parseInlines("No markup here.")).toEqual([{ kind: "text", text: "No markup here." }]);
  });
});

describe("parseStandardTerms", () => {
  it("parses a title, numbered clauses and trailing paragraphs", () => {
    const blocks = parseStandardTerms("# Standard Terms\n\n1. **Intro**. Hello.\r\n\n2. World.\n\nFooter.\n");
    expect(blocks).toEqual([
      { kind: "title", text: "Standard Terms" },
      { kind: "clause", number: 1, content: [{ kind: "bold", text: "Intro" }, { kind: "text", text: ". Hello." }] },
      { kind: "clause", number: 2, content: [{ kind: "text", text: "World." }] },
      { kind: "paragraph", content: [{ kind: "text", text: "Footer." }] },
    ]);
  });

  it("parses the real Mutual NDA template without leaving raw markup", () => {
    const blocks = parseStandardTerms(readTemplate("Mutual-NDA.md"));

    expect(blocks.filter((b) => b.kind === "clause")).toHaveLength(11);
    const allText = JSON.stringify(blocks);
    expect(allText).not.toMatch(/<span|\*\*|\]\(/);
    for (const term of ["Purpose", "Effective Date", "MNDA Term", "Term of Confidentiality", "Governing Law", "Jurisdiction"]) {
      expect(allText).toContain(`{"kind":"term","text":"${term}"}`);
    }
  });
});
