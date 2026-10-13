import { describe, expect, it } from "vitest";
import { countMissing, type Block, type Inline } from "../document";
import { buildCoverPage, formatDate } from "./coverPage";
import { defaultNdaFormData, todayIsoDate, type NdaFormData } from "./form";

const filledForm: NdaFormData = {
  ...defaultNdaFormData,
  effectiveDate: "2026-10-13",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  parties: [
    { name: "Ada Lovelace", title: "CEO", company: "Acme Inc.", noticeAddress: "ada@acme.test" },
    { name: "Alan Turing", title: "CTO", company: "Globex LLC", noticeAddress: "alan@globex.test" },
  ],
};

/** Flattens the document's inline content to plain text for easy assertions. */
function plainText(blocks: Block[]): string {
  const inlineText = (inlines: Inline[]) => inlines.map((i) => i.text).join("");
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "title":
        case "heading":
          return block.text;
        case "paragraph":
        case "clause":
          return inlineText(block.content);
        case "choice":
          return block.options.map((o) => `${o.selected ? "[x]" : "[ ]"} ${inlineText(o.content)}`).join("\n");
        case "parties":
          return [
            inlineText(block.intro),
            ...block.rows.map((r) => `${r.label}: ${r.values.map((v) => v.text).join(" | ")}`),
          ].join("\n");
      }
    })
    .join("\n");
}

describe("formatDate", () => {
  it("formats ISO dates in long US style", () => {
    expect(formatDate("2026-10-13")).toBe("October 13, 2026");
    expect(formatDate("2024-02-29")).toBe("February 29, 2024");
  });

  it("returns an empty string for blank or invalid dates", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("2026-02-30")).toBe("");
    expect(formatDate("13/10/2026")).toBe("");
  });
});

describe("todayIsoDate", () => {
  it("uses the local calendar date", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("buildCoverPage", () => {
  it("fills in every value from a complete form", () => {
    const blocks = buildCoverPage(filledForm);
    const text = plainText(blocks);

    expect(countMissing(blocks)).toBe(0);
    expect(text).toContain(defaultNdaFormData.purpose);
    expect(text).toContain("October 13, 2026");
    expect(text).toContain("[x] Expires 1 year from Effective Date.");
    expect(text).toContain("[ ] Continues until terminated");
    expect(text).toContain("[x] 1 year from Effective Date, but in the case of trade secrets");
    expect(text).toContain("Governing Law: Delaware");
    expect(text).toContain("Jurisdiction: New Castle, DE");
    expect(text).toContain("None.");
    expect(text).toContain("By signing this Cover Page");
    expect(text).toContain("Print Name: Ada Lovelace | Alan Turing");
    expect(text).toContain("Company: Acme Inc. | Globex LLC");
  });

  it("shows bracketed placeholders for blank fields and counts them", () => {
    const blocks = buildCoverPage({ ...defaultNdaFormData, purpose: "  " });
    const text = plainText(blocks);

    expect(text).toContain("[Purpose]");
    expect(text).toContain("[Effective Date]");
    expect(text).toContain("Governing Law: [State]");
    const blankTermFields = 4; // purpose, effective date, governing law, jurisdiction
    const blankPartyFields = 4 * 2; // name, title, company and notice address for each party
    expect(countMissing(blocks)).toBe(blankTermFields + blankPartyFields);
  });

  it("selects the alternative term options and pluralizes years", () => {
    const text = plainText(
      buildCoverPage({
        ...filledForm,
        mndaTermType: "untilTerminated",
        mndaTermYears: "3",
        confidentialityTermType: "perpetual",
        modifications: "Section 6 does not apply.",
      }),
    );

    expect(text).toContain("[ ] Expires 3 years from Effective Date.");
    expect(text).toContain("[x] Continues until terminated");
    expect(text).toContain("[x] In perpetuity.");
    expect(text).toContain("Section 6 does not apply.");
  });

  it("treats a non-positive or non-integer year count as missing", () => {
    for (const years of ["", "0", "1.5", "-2", "abc"]) {
      const blocks = buildCoverPage({ ...filledForm, mndaTermYears: years });
      expect(plainText(blocks)).toContain("Expires [number of years] from Effective Date.");
      expect(countMissing(blocks)).toBe(1);
    }
  });
});
