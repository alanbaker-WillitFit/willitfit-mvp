import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWillItFlyArticleBySlug, getWillItFlyArticles } from "@/services/willitflyArticlesRuntime";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getWillItFlyArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getWillItFlyArticleBySlug(slug);
  if (!result) return { title: "Article" };
  return {
    title: result.article.headline,
    description: result.article.shortSummary || result.article.standfirst,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getWillItFlyArticleBySlug(slug);
  if (!result) notFound();

  const { article, sections } = result;

  return (
    <main className="wf-container wf-container--narrow wf-section">
      <Link href="/fly/articles" className="font-body text-sm font-semibold text-navy-500">← Articles</Link>
      <article className="mt-5">
        <p className="font-body text-sm text-navy-400">
          {[article.articleType, article.category].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy-700">{article.headline}</h1>
        {article.standfirst ? (
          <p className="mt-4 font-body text-lg leading-relaxed text-navy-600">{article.standfirst}</p>
        ) : null}
        {(article.authorName || article.lastReviewed) ? (
          <p className="mt-4 font-body text-sm text-navy-400">
            {article.authorName ? `By ${article.authorName}` : ""}
            {article.authorName && article.lastReviewed ? " · " : ""}
            {article.lastReviewed ? `Reviewed ${article.lastReviewed}` : ""}
          </p>
        ) : null}

        <div className="mt-8 space-y-7 font-body leading-7 text-navy-600">
          {sections.length > 0 ? sections.map((section) => (
            <section key={section.sectionId}>
              {section.heading ? <h2 className="font-heading text-xl font-semibold text-navy-700">{section.heading}</h2> : null}
              {section.body ? <p className={section.heading ? "mt-2" : ""}>{section.body}</p> : null}
              {section.supportingText ? <p className="mt-2 text-sm text-navy-500">{section.supportingText}</p> : null}
              {section.quoteCallout ? <p className="mt-3 font-semibold text-navy-700">{section.quoteCallout}</p> : null}
              {section.listItems.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  {section.listItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
              {section.linkLabel && section.linkUrl ? (
                <p className="mt-3"><a href={section.linkUrl} rel="noopener noreferrer" target="_blank" className="font-semibold text-navy-700">{section.linkLabel} →</a></p>
              ) : null}
            </section>
          )) : article.articleBody ? (
            <p>{article.articleBody}</p>
          ) : null}

          {article.keyTakeaways.length > 0 ? (
            <section>
              <h2 className="font-heading text-xl font-semibold text-navy-700">Key takeaways</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                {article.keyTakeaways.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ) : null}

          {article.travellerAction ? (
            <section>
              <h2 className="font-heading text-xl font-semibold text-navy-700">What to do</h2>
              <p className="mt-2">{article.travellerAction}</p>
            </section>
          ) : null}
        </div>
      </article>
    </main>
  );
}
