import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SIZE_GUIDE_CONFIG, type SizeGuideKind } from "@/services/sizeGuides";

export const metadata: Metadata = {
  title: "Baggage Size Guides",
  description: "Compare published personal-item, cabin-bag and checked-bag allowances by airline.",
};

const GUIDES: SizeGuideKind[] = ["personal-item", "cabin-bag", "checked-bag"];

export default function SizeGuidesPage() {
  return (
    <main className="wf-container wf-section">
      <div className="max-w-3xl">
        <p className="font-body text-sm font-bold uppercase tracking-wide text-green-600">WillItFit comparison guides</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-navy-700">Baggage Size Guides</h1>
        <p className="mt-4 font-body text-lg leading-8 text-navy-500">
          Compare the most common published baggage allowances, then check your exact airline and fare in the WillItFit checker.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {GUIDES.map((kind) => {
          const guide = SIZE_GUIDE_CONFIG[kind];
          return (
            <Link key={kind} href={`/size-guides/${kind}`} className="wf-card group flex flex-col p-6">
              <div className="flex min-h-[220px] items-center justify-center">
                <Image src={guide.image} alt={guide.imageAlt} width={260} height={320} className="max-h-[220px] w-auto object-contain" />
              </div>
              <h2 className="mt-5 font-heading text-xl font-bold text-navy-700 group-hover:text-green-600">{guide.title}</h2>
              <p className="mt-3 flex-1 font-body text-sm leading-6 text-navy-500">{guide.description}</p>
              <span className="mt-5 font-body text-sm font-bold text-green-600">Open guide →</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
