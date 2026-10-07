import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/services/articles";
import { siteUrl } from "@/lib/utils";
import { safeJsonLd } from "@/lib/jsonLd";

export const revalidate = 3600;
export const dynamicParams = false;

interface ArticlePageProps { params: Promise<{ slug: string }>; }

export async function generateStaticParams() {
  const { articles } = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.summary || `Read ${article.title} from WillItFit.`,
    alternates: { canonical: siteUrl(`/articles/${article.slug}`) },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="wf-container wf-container--narrow wf-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.summary,
        datePublished: article.publishedDate || undefined, dateModified: article.lastReviewed || undefined,
        author: { "@type": "Person", name: article.authorName || "WillItFit" },
        publisher: { "@type": "Organization", name: "WillItFit", url: siteUrl() },
        mainEntityOfPage: siteUrl(`/articles/${article.slug}`),
      }) }} />
      <section className="rounded-3xl bg-navy-700 p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-400">{article.category}</p>
        <h1 className="mt-2 font-heading text-4xl font-bold leading-tight">{article.title}</h1>
        <p className="mt-4 text-lg leading-8 text-navy-100">{article.standfirst || article.summary}</p>
        <p className="mt-5 text-xs text-navy-200">By {article.authorName || "WillItFit"}{article.lastReviewed ? ` · reviewed ${article.lastReviewed}` : ""}</p>
      </section>

      <div className="relative mt-6 h-64 overflow-hidden rounded-3xl bg-navy-100 sm:h-80">
        <Image src={article.heroImage || "/assets/hero/airport-luggage.png"} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 900px" />
      </div>

      {(article.keyTakeaways?.length ?? 0) > 0 && (
        <section className="mt-8 wf-card p-6">
          <h2 className="font-heading text-xl font-semibold text-navy-700">Quick answer / key takeaways</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-navy-600">{article.keyTakeaways!.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}

      <div className="mt-8 space-y-8 font-body text-navy-600">
        {article.sections.map((section, index) => (
          <section key={section.contentId} aria-labelledby={`article-section-${index}`}>
            {section.title && <h2 id={`article-section-${index}`} className="font-heading text-2xl font-semibold text-navy-700">{section.title}</h2>}
            {section.body && <p className="mt-3 whitespace-pre-line leading-8">{section.body}</p>}
            {section.supportingText && <p className="mt-3 text-sm text-navy-400">{section.supportingText}</p>}
          </section>
        ))}
      </div>

      {article.travellerAction && (
        <section className="mt-10 rounded-3xl bg-green-50 p-6">
          <h2 className="font-heading text-xl font-semibold text-navy-700">What to do next</h2>
          <p className="mt-2 text-navy-600">{article.travellerAction}</p>
          <div className="mt-4 flex flex-wrap gap-3"><Link href="/" className="wf-btn-cta px-5 py-2.5 text-sm">Check my bag</Link><Link href="/ask" className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700">Ask WillItFit</Link></div>
        </section>
      )}

      <section className="mt-8 text-xs text-navy-400">
        {article.publicationReason && <p>Publication gate: {article.publicationReason}.</p>}
        {article.nextReviewDue && <p className="mt-1">Next review due: {article.nextReviewDue}.</p>}
        {article.officialSourceUrl && <p className="mt-2"><a className="text-green-700 underline" href={article.officialSourceUrl} target="_blank" rel="noopener noreferrer">Official source ↗</a></p>}
      </section>
      <nav className="mt-10 border-t border-navy-100 pt-6"><Link href="/articles" className="font-semibold text-green-700">← All articles</Link></nav>
    </main>
  );
}
