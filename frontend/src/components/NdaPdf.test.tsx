import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { beforeAll, describe, expect, it } from "vitest";
import { parseStandardTerms } from "@/lib/markdown";
import { buildCoverPage } from "@/lib/nda/coverPage";
import { defaultNdaFormData } from "@/lib/nda/form";
import { readTemplate } from "@/test/templates";
import { NdaPdf, registerPdfFonts } from "./NdaPdf";

beforeAll(() => {
  registerPdfFonts((fileName) => path.join(import.meta.dirname, "../../public/fonts", fileName));
});

describe("NdaPdf", () => {
  it("renders the cover page and standard terms to a PDF with the embedded font", async () => {
    const form = { ...defaultNdaFormData, governingLaw: "Łódź Ελλάδα Москва" };
    const standardTerms = parseStandardTerms(readTemplate("Mutual-NDA.md"));
    const buffer = await renderToBuffer(<NdaPdf sections={[buildCoverPage(form), standardTerms]} title="Mutual NDA" />);

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    // Non-Western characters need the embedded Noto Serif, not a built-in PDF font.
    expect(buffer.toString("latin1")).toContain("NotoSerif");
    expect(buffer.toString("latin1")).not.toMatch(/\/BaseFont \/Times/);
  }, 30_000);
});
