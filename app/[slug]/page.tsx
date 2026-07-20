import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAirlinePageData } from "@/services/airlinePages";
import { getSeoPageBySlug } from "@/services/seoPages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { siteUrl } from "@/lib/utils";
import FAQSection from "@/components/FAQSection";
import AirlinePage from "@/components/AirlinePage";
import { safeJsonLd } from "@/lib/jsonLd";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [airlineData, page] = await Promise.all([
    getAirlinePageData(slug),
    getSeoPageBySlug(slug),
  ]);

  const { airline } = airlineData;

  if (airline && page) {
    return {
      title: "Content unavailable",
      robots: { index: false, follow: false },
    };
  }

  if (airline) {
    const title = `${airline.airlineName} cabin bag size guide`;
    const description = `Check ${airline.airlineName} cabin bag and personal item sizes, then use the free WillitFit bag checker to see if your luggage fits before you fly.`;
    const canonical = siteUrl(`/${airline.slug}`);

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: "WillitFit",
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    };
  }

  if (!page) return {};

  const canonical = siteUrl(`/${page.pageSlug}`);
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical },
    openGraph: { title: page.title, description: page.metaDescription, url: canonical, siteName: "WillitFit", type: "website" },
    twitter: { card: "summary_large_image", title: page.title, description: page.metaDescription },
    robots: { index: true, follow: true },
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const [airlineData, page] = await Promise.all([
    getAirlinePageData(slug),
    getSeoPageBySlug(slug),
  ]);
  const { airline } = airlineData;

  if (airline && page) {
    console.error(`[routing] Blocked slug collision for "${slug}".`);
    return notFound();
  }

  if (airline) {
    return (
      <AirlinePage
        airline={airline}
        airlines={airlineData.airlines}
        relatedAirlines={airlineData.relatedAirlines}
        tips={airlineData.tips}
        source={airlineData.source}
      />
    );
  }

  if (!page) return notFound();

  return (
    <article className="wf-container wf-container--narrow wf-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            [
              faqSchema(page.faq),
              breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: page.h1, path: `/${page.pageSlug}` },
              ]),
            ].filter(Boolean)
          ),
        }}
      />

      <h1 className="font-heading text-3xl font-semibold text-navy-700">{page.h1}</h1>
      <div className="mt-6 whitespace-pre-line font-body leading-relaxed text-navy-600">
        {page.bodyContent}
      </div>

      {page.faq.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-navy-700">Frequently asked</h2>
          <div className="mt-4"><FAQSection items={page.faq} /></div>
        </div>
      )}
    </article>
  );
}
