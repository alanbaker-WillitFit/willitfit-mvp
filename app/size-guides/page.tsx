import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SIZE_GUIDE_CONFIG, type SizeGuideKind } from "@/services/sizeGuides";

export const metadata: Metadata = {
  title: "Baggage Size Guides",
  description: "Compare published baggage allowances and get brief guidance for oversized and specialist baggage.",
};

const GUIDES: Array<{
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}> = [
  ...(["personal-item", "cabin-bag", "checked-bag"] as SizeGuideKind[]).map((kind) => ({
    slug: kind,
    title: SIZE_GUIDE_CONFIG[kind].title,
    description: SIZE_GUIDE_CONFIG[kind].description,
    image: SIZE_GUIDE_CONFIG[kind].image,
    imageAlt: SIZE_GUIDE_CONFIG[kind].imageAlt,
  })),
  {
    slug: "oversized-baggage",
    title: "Oversized Baggage Guide",
    description: "Brief preparation guidance for bicycles, golf clubs, buggies, mobility equipment and other specialist baggage.",
    image: "/assets/special-baggage/advanced-oversized-baggage-hero-rc5.webp",
    imageAlt: "Oversized and specialist baggage prepared for air travel",
  },
];

export default function SizeGuidesPage() {
  return (
    <main className="wf-container wf-section">
      <div className="max-w-3xl">
        <p className="font-body text-sm font-bold uppercase tracking-wide text-green-600">WillItFit comparison guides</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-navy-700">Baggage Size Guides</h1>
        <p className="mt-4 font-body text-lg leading-8 text-navy-500">Compare published baggage allowances or open concise guidance for oversized and specialist baggage.</p>
      </div>

      <div className="mt-10 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/size-guides/${guide.slug}`} className="wf-card group flex min-h-[480px] flex-col p-6">
            <div className="flex h-[260px] items-center justify-center overflow-hidden">
              <Image src={guide.image} alt={guide.imageAlt} width={340} height={340} className="max-h-[230px] max-w-full object-contain" />
            </div>
            <h2 className="mt-5 min-h-[58px] font-heading text-xl font-bold text-navy-700 group-hover:text-green-600">{guide.title}</h2>
            <p className="mt-3 flex-1 font-body text-sm leading-6 text-navy-500">{guide.description}</p>
            <span className="mt-5 font-body text-sm font-bold text-green-600">Open guide →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
