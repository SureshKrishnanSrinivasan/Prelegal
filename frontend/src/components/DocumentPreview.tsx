import type { Block, Inline } from "@/lib/document";

function InlineContent({ inlines }: { inlines: Inline[] }) {
  return inlines.map((inline, i) => {
    switch (inline.kind) {
      case "text":
        return <span key={i}>{inline.text}</span>;
      case "bold":
        return <strong key={i}>{inline.text}</strong>;
      case "link":
        return (
          <a key={i} href={inline.href} target="_blank" rel="noopener noreferrer" className="underline">
            {inline.text}
          </a>
        );
      case "term":
        return (
          <span key={i} className="font-medium underline decoration-dotted underline-offset-2">
            {inline.text}
          </span>
        );
      case "value":
        return (
          <mark
            key={i}
            className={
              inline.missing
                ? "rounded bg-amber-100 px-0.5 text-amber-800"
                : "rounded bg-sky-50 px-0.5 font-medium text-inherit"
            }
          >
            {inline.text}
          </mark>
        );
    }
  });
}

function BlockContent({ block }: { block: Block }) {
  switch (block.kind) {
    case "title":
      return <h2 className="mt-8 mb-4 text-center text-xl font-bold first:mt-0">{block.text}</h2>;
    case "heading":
      return (
        <div className="mt-5 mb-1">
          <h3 className="font-semibold">{block.text}</h3>
          {block.note && <p className="text-xs text-zinc-500">{block.note}</p>}
        </div>
      );
    case "paragraph":
      return (
        <p className="my-2">
          <InlineContent inlines={block.content} />
        </p>
      );
    case "clause":
      return (
        <p className="my-3">
          {block.number}. <InlineContent inlines={block.content} />
        </p>
      );
    case "choice":
      return (
        <ul className="my-2 space-y-1">
          {block.options.map((option, i) => (
            <li key={i} className={`flex gap-2 ${option.selected ? "" : "text-zinc-400"}`}>
              <span aria-hidden>{option.selected ? "☒" : "☐"}</span>
              <span>
                <span className="sr-only">{option.selected ? "Selected: " : "Not selected: "}</span>
                <InlineContent inlines={option.content} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "parties":
      return (
        <>
          <p className="my-2">
            <InlineContent inlines={block.intro} />
          </p>
          <table className="my-4 w-full table-fixed border-collapse text-xs">
            <thead>
              <tr>
                <th scope="col" className="w-1/4 border border-zinc-300 p-2">
                  <span className="sr-only">Field</span>
                </th>
                {block.headers.map((header) => (
                  <th key={header} scope="col" className="border border-zinc-300 p-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="border border-zinc-300 p-2 text-left font-medium">
                    {row.label}
                    {row.note && <span className="block font-normal text-zinc-500">{row.note}</span>}
                  </th>
                  {row.values.map((cell, i) => (
                    <td key={i} className="h-10 border border-zinc-300 p-2 break-words">
                      <InlineContent inlines={[cell]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
  }
}

export function DocumentPreview({ blocks }: { blocks: Block[] }) {
  return (
    <article className="font-serif text-sm leading-relaxed text-zinc-900">
      {blocks.map((block, i) => (
        <BlockContent key={i} block={block} />
      ))}
    </article>
  );
}
