# Prelegal frontend

Next.js app for drafting legal agreements. It currently hosts the **Mutual NDA Creator** prototype: fill in a form, see the
Common Paper Mutual NDA update live, and download the completed agreement as a PDF.

## Getting started

Requires Node.js 20.9 or later.

```bash
npm install
npm run dev     # http://localhost:3000
```

| Command         | Purpose                                 |
| --------------- | --------------------------------------- |
| `npm run dev`   | Start the development server            |
| `npm run build` | Production build (prerenders the page)  |
| `npm run start` | Serve the production build              |
| `npm run lint`  | Lint with ESLint                        |
| `npm test`      | Run unit tests with Vitest              |

## How it works

- **Templates are the source of truth.** The Standard Terms are imported from `../templates/Mutual-NDA.md` (the Common
  Paper dataset in the repo root) and bundled as a string at build time, via the `*.md` rule in `next.config.ts`. The
  Turbopack root is the repo root so the app can import from `templates/`; build from within the full repository.
- **One document model, two renderers.** `src/lib/document.ts` defines renderer-agnostic blocks. The template parser
  (`src/lib/markdown.ts`) and cover page builder (`src/lib/nda/coverPage.ts`) produce those blocks, which are rendered
  as HTML by `DocumentPreview` and as a PDF by `NdaPdf` (`@react-pdf/renderer`), so the preview and download match.
- **Everything runs in the browser.** No data entered in the form leaves the user's machine; the PDF is generated
  client-side, and the PDF library is only loaded when the user clicks Download.
- **Embedded font.** PDFs use Noto Serif (`public/fonts`, SIL Open Font License) so names and addresses in Latin, Greek
  and Cyrillic scripts render correctly. CJK scripts are not covered yet.

```
src/
  app/page.tsx                  Loads the Standard Terms and renders the creator
  components/
    NdaCreator.tsx              Form state, live preview, PDF download
    NdaForm.tsx                 The input form
    DocumentPreview.tsx         HTML renderer for document blocks
    NdaPdf.tsx                  PDF renderer for document blocks
  lib/
    document.ts                 Document model (blocks and inline content)
    markdown.ts                 Parser for Common Paper Standard Terms markdown
    nda/form.ts                 Form data type and defaults
    nda/coverPage.ts            Builds the Cover Page from the form data
    nda/standardTerms.ts        The parsed Standard Terms template (server only)
  test/templates.ts             Test helper for reading templates/
```

## License

The agreement text comes from the [Common Paper](https://commonpaper.com) Mutual NDA, used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See `../templates/LICENSE.txt`.
Noto Serif is licensed under the SIL Open Font License 1.1 (`public/fonts/NotoSerif-OFL.txt`).
