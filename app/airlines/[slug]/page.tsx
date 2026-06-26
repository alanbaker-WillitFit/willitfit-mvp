import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAirlineBySlug, getAirlines, getAllAirlineSlugs } from "@/services/airlines";
import { airlineFaq, breadcrumbSchema, faqSchema } from "@/lib/schema";
import DimensionForm from "@/components/DimensionForm";
import FAQSection from "@/components/FAQSection";

export async function generateStaticParams() {
  const slugs = await getAllAirlineSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { airline } = await getAirlineBySlug(params.slug);
  if (!airline) return {};

  const title = `${airline.airlineName} cabin bag size limit`;
  const description = `${airline.airlineName} cabin bag allowance is ${airline.cabinBag.heightCm}×${airline.cabinBag.widthCm}×${airline.cabinBag.depthCm} cm. Check your bag against this limit for free.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function AirlinePage({ params }: { params: { slug: string } }) {
  const { airline } = await getAirlineBySlug(params.slug);
  if (!airline) notFound();

  const { airlines } = await getAirlines();
  const faq = airlineFaq(airline);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [
              faqSchema(faq),
              breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Airlines", path: "/airlines" },
                { name: airline.airlineName, path: `/airlines/${airline.slug}` },
              ]),
            ].filter(Boolean)
          ),
        }}
      />

      <nav className="font-body text-sm text-navy-300">
        <a href="/airlines" className="hover:text-green-600">
          Airlines
        </a>{" "}
        / {airline.airlineName}
      </nav>

      <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700">
        {airline.airlineName} cabin bag size limit
      </h1>

      <p className="mt-3 font-body text-navy-500">
        Here&apos;s {airline.airlineName}&apos;s current baggage allowance — checked against their
        published policy. Allowances change, so always confirm on{" "}
        <a
          href={airline.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 underline"
        >
          {airline.airlineName}&apos;s own site
        </a>{" "}
        before you fly.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-navy-100 bg-white p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Cabin bag</h2>
          <p className="mt-2 font-mono text-lg text-navy-700">
            {airline.cabinBag.heightCm} × {airline.cabinBag.widthCm} ×{" "}
            {airline.cabinBag.depthCm} cm
          </p>
          {airline.weightLimitKg && (
            <p className="mt-1 font-body text-sm text-navy-400">
              Max weight: {airline.weightLimitKg} kg
            </p>
          )}
        </div>

        <div className="rounded-card border border-navy-100 bg-white p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Personal item</h2>
          <p className="mt-2 font-mono text-lg text-navy-700">
            {airline.personalItem.heightCm} × {airline.personalItem.widthCm} ×{" "}
            {airline.personalItem.depthCm} cm
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-navy-700">
          Check your bag against {airline.airlineName}
        </h2>
        <div className="mt-4">
          <DimensionForm airlines={airlines} initialAirline={airline} />
        </div>
      </div>

      {faq.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-navy-700">Frequently asked</h2>
          <div className="mt-4">
            <FAQSection items={faq} />
          </div>
        </div>
      )}
    </section>
  );
}