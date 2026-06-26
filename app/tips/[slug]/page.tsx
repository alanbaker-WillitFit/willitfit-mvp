import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTipBySlug, getTravelTips } from "@/services/tips";
import { breadcrumbSchema } from "@/lib/schema";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { tips } = await getTravelTips();
  return tips.map((tip) => ({ slug: tip.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { tip } = await getTipBySlug(params.slug);
  if (!tip) return {};
  return {
    title: tip.title,
    description: tip.content.slice(0, 155),
  };
}

export default async function TipPage({ params }: { params: { slug: string } }) {
  const { tip } = await getTipBySlug(params.slug);
  if (!tip) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Travel tips", path: "/tips" },
              { name: tip.title, path: `/tips/${tip.slug}` },
            ])
          ),
        }}
      />

      <nav className="font-body text-sm text-navy-300">
        <a href="/tips" className="hover:text-green-600">Travel tips</a> / {tip.category}
      </nav>

      <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700">{tip.title}</h1>
      <p className="mt-6 font-body text-lg leading-relaxed text-navy-600">{tip.content}</p>

      {tip.cta && (
        <a
          href="/#checker"
          className="mt-8 inline-flex rounded-full bg-green-500 px-6 py-3 font-body text-sm font-semibold text-white shadow-soft hover:bg-green-600"
        >
          {tip.cta}
        </a>
      )}
    </article>
  );
}
