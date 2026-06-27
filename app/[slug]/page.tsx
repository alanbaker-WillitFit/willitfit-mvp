import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeoPageBySlug, getAllSeoPages } from "@/services/seoPages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import FAQSection from "@/components/FAQSection";


export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const pages = await getAllSeoPages();

  return pages.map((page) => ({
    slug: page.pageSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPageBySlug(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.metaDescription,
  };
}

export default async function SeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSeoPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
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

      <h1 className="font-heading text-3xl font-semibold text-navy-700">
        {page.h1}
      </h1>

      <div className="mt-6 whitespace-pre-line font-body leading-relaxed text-navy-600">
        {page.bodyContent}
      </div>

      {page.faq.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-navy-700">
            Frequently asked
          </h2>

          <div className="mt-4">
            <FAQSection items={page.faq} />
          </div>
        </div>
      )}
    </article>
  );
}