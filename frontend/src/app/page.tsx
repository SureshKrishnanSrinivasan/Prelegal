import { NdaCreator } from "@/components/NdaCreator";
import { standardTerms } from "@/lib/nda/standardTerms";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Mutual NDA Creator</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Fill in the details to generate a Common Paper Mutual Non-Disclosure Agreement, then download it as a PDF.
        </p>
      </header>
      <NdaCreator standardTerms={standardTerms} />
    </main>
  );
}
