"use client";

import { useEffect, useMemo, useState } from "react";
import { countMissing, type Block } from "@/lib/document";
import { buildCoverPage, NDA_TITLE } from "@/lib/nda/coverPage";
import { defaultNdaFormData, todayIsoDate, type NdaFormData } from "@/lib/nda/form";
import { DocumentPreview } from "./DocumentPreview";
import { NdaForm } from "./NdaForm";

function pdfFileName(form: NdaFormData): string {
  const slug = (s: string) =>
    s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  const companies = form.parties.map((p) => slug(p.company)).filter(Boolean);
  return ["Mutual-NDA", ...companies].join("-") + ".pdf";
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in Safari and Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function NdaCreator({ standardTerms }: { standardTerms: Block[] }) {
  const [form, setForm] = useState<NdaFormData>(defaultNdaFormData);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  // Default the Effective Date to today. Done after mount (not during render)
  // because the page is prerendered at build time, when "today" isn't known.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only default
    setForm((current) => (current.effectiveDate ? current : { ...current, effectiveDate: todayIsoDate() }));
  }, []);

  const coverPage = useMemo(() => buildCoverPage(form), [form]);
  const missing = countMissing(coverPage);

  async function downloadPdf() {
    setStatus("generating");
    try {
      // Loaded on demand: the PDF renderer is large and only needed here.
      const [{ pdf }, { NdaPdf, registerPdfFonts }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./NdaPdf"),
      ]);
      registerPdfFonts((fileName) => new URL(`/fonts/${fileName}`, window.location.origin).href);
      const blob = await pdf(<NdaPdf sections={[coverPage, standardTerms]} title={NDA_TITLE} />).toBlob();
      saveBlob(blob, pdfFileName(form));
      setStatus("idle");
    } catch (error) {
      console.error("Failed to generate PDF", error);
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section aria-label="NDA details">
        <NdaForm data={form} onChange={setForm} />
      </section>

      <section aria-label="NDA preview" className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600" aria-live="polite">
            {missing === 0
              ? "All fields filled in."
              : `${missing} ${missing === 1 ? "field" : "fields"} still to fill in (highlighted).`}
          </p>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={status === "generating"}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
          >
            {status === "generating" ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
        {status === "error" && (
          <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Sorry, the PDF could not be generated. Please try again.
          </p>
        )}
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <DocumentPreview blocks={coverPage} />
          <hr className="my-8 border-dashed border-zinc-300" />
          <DocumentPreview blocks={standardTerms} />
        </div>
      </section>
    </div>
  );
}
