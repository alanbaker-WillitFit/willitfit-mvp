import type { Metadata } from "next";
import Link from "next/link";
import { getWillItFlyArticles } from "@/services/willitflyArticlesRuntime";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Articles",
  description: "Shared WillIt travel articles and practical guidance.",
};

export default async function ArticlesPage() {
  const articles = await getWillItFlyArticles();

  return (
    <main className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Articles</h1>
      <p className="mt-4 font-body text-lg leading-relaxed text-navy-600">
        Travel guidance, reflections and practical information shared across the WillIt family.
      </p>

      {articles.length === 0 ? (
        <p className="mt-8 font-body text-navy-500">No shared articles are currently published.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {articles.map((article) => (
            <article key={article.articleId} className="border-b border-slate-200 pb-6">
              <p className="font-body text-sm text-navy-400">
                {[article.articleType, article.category].filter(Boolean).join(" · ")}
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-navy-700">
                <Link href={`/fly/articles/${article.slug}`}>{article.headline}</Link>
              </h2>
              {article.shortSummary ? (
                <p className="mt-2 font-body leading-relaxed text-navy-600">{article.shortSummary}</p>
              ) : null}
              <Link className="mt-3 inline-flex font-body font-semibold text-navy-700" href={`/fly/articles/${article.slug}`}>
                Read article →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
