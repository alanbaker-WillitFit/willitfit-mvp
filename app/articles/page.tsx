import type { Metadata } from "next";
import ArticleCard from "@/components/ArticleCard";
import { getArticles } from "@/services/articles";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Articles",
  description: "Practical baggage and travel guidance from WillItFit.",
};

export default async function ArticlesPage() {
  const { articles, source } = await getArticles();

  return (
    <section className="wf-container wf-section pb-6 sm:pb-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-navy-700">Articles</h1>
        <p className="mt-3 font-body text-navy-500">
          Clear, practical guidance to help you prepare, pack and travel with confidence.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
        </div>
      ) : (
        <div className="wf-card mt-8 p-6">
          <p className="font-body text-navy-500">No published articles are currently available.</p>
        </div>
      )}

      <p className="mt-6 font-body text-xs text-navy-300">
        Content source: {source === "sheet" ? "governed runtime content" : "bundled fallback"}.
      </p>
    </section>
  );
}
