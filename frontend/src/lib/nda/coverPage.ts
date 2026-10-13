import { filled, text, value, type Block, type Inline, type PartyRow } from "../document";
import { parseInlines } from "../markdown";
import type { NdaFormData, Party } from "./form";

/*
 * Builds the MNDA Cover Page from the form data. Wording follows
 * templates/Mutual-NDA-coverpage.md (Common Paper Mutual NDA v1.0, CC BY 4.0).
 */

export const NDA_TITLE = "Mutual Non-Disclosure Agreement";

const INTRO =
  "This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“**Cover Page**”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 (“**Standard Terms**”) identical to those posted at [commonpaper.com/standards/mutual-nda/1.0](https://commonpaper.com/standards/mutual-nda/1.0). Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.";

const LICENSE =
  "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).";

/** Formats a YYYY-MM-DD date as e.g. "October 13, 2026"; "" if invalid. */
export function formatDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "";
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Renders a year count such as "2 years"; a placeholder if not a positive integer. */
function years(raw: string): Inline {
  const trimmed = raw.trim();
  const count = /^\d+$/.test(trimmed) ? Number(trimmed) : 0;
  return count > 0 ? filled(`${count} ${count === 1 ? "year" : "years"}`) : value("", "number of years");
}

function partyRows(parties: [Party, Party]): PartyRow[] {
  const row = (label: string, pick: (p: Party) => string, placeholder: string, note?: string): PartyRow => ({
    label,
    note,
    values: [value(pick(parties[0]), placeholder), value(pick(parties[1]), placeholder)],
  });
  const blank: [Inline, Inline] = [text(""), text("")];

  return [
    { label: "Signature", values: blank },
    row("Print Name", (p) => p.name, "Name"),
    row("Title", (p) => p.title, "Title"),
    row("Company", (p) => p.company, "Company"),
    row("Notice Address", (p) => p.noticeAddress, "Email or postal address", "Use either email or postal address"),
    { label: "Date", values: blank },
  ];
}

export function buildCoverPage(form: NdaFormData): Block[] {
  const modifications = form.modifications.trim();

  return [
    { kind: "title", text: NDA_TITLE },
    { kind: "heading", text: "Using This Mutual Non-Disclosure Agreement" },
    { kind: "paragraph", content: parseInlines(INTRO) },

    { kind: "heading", text: "Purpose", note: "How Confidential Information may be used" },
    { kind: "paragraph", content: [value(form.purpose, "Purpose")] },

    { kind: "heading", text: "Effective Date" },
    { kind: "paragraph", content: [value(formatDate(form.effectiveDate), "Effective Date")] },

    { kind: "heading", text: "MNDA Term", note: "The length of this MNDA" },
    {
      kind: "choice",
      options: [
        {
          selected: form.mndaTermType === "expires",
          content: [text("Expires "), years(form.mndaTermYears), text(" from Effective Date.")],
        },
        {
          selected: form.mndaTermType === "untilTerminated",
          content: [text("Continues until terminated in accordance with the terms of the MNDA.")],
        },
      ],
    },

    { kind: "heading", text: "Term of Confidentiality", note: "How long Confidential Information is protected" },
    {
      kind: "choice",
      options: [
        {
          selected: form.confidentialityTermType === "years",
          content: [
            years(form.confidentialityTermYears),
            text(
              " from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
            ),
          ],
        },
        { selected: form.confidentialityTermType === "perpetual", content: [text("In perpetuity.")] },
      ],
    },

    { kind: "heading", text: "Governing Law & Jurisdiction" },
    { kind: "paragraph", content: [text("Governing Law: "), value(form.governingLaw, "State")] },
    { kind: "paragraph", content: [text("Jurisdiction: "), value(form.jurisdiction, "City or county and state")] },

    { kind: "heading", text: "MNDA Modifications" },
    { kind: "paragraph", content: [modifications ? filled(modifications) : text("None.")] },

    {
      kind: "parties",
      intro: [text("By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.")],
      headers: ["Party 1", "Party 2"],
      rows: partyRows(form.parties),
    },
    { kind: "paragraph", content: parseInlines(LICENSE) },
  ];
}
