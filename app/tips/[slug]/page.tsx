import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTipBySlug } from "@/services/tips";
import { breadcrumbSchema } from "@/lib/schema";
import { safeJsonLd } from "@/lib/jsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";


export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tip } = await getTipBySlug(slug);

  if (!tip) {
    return {};
  }

  return {
    title: tip.title,
    description: tip.content.slice(0, 155),
  };
}

export default async function TipPage({ params }: PageProps) {
  const { slug } = await params;
  const { tip } = await getTipBySlug(slug);

  if (!tip) {
    return notFound();
  }

  const current = tip;

  return (
    <article className="wf-container wf-container--narrow wf-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Travel tips", path: "/tips" },
              { name: current.title, path: `/tips/${current.slug}` },
            ])
          ),
        }}
      />

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Travel tips", href: "/tips" }, { label: current.title }]} />

      <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700">
        {current.title}
      </h1>

      <p className="mt-6 font-body text-lg leading-relaxed text-navy-600">
        {current.content}
      </p>

      {current.cta && (
        <Link
          href="/#checker"
          className="wf-btn-cta mt-8 inline-flex px-6 py-3 font-body text-sm"
        >
          {current.cta}
        </Link>
      )}
    </article>
  );
}
