import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { getArticles } from "@/services/articles";

export const revalidate = 3600;

function articlesEnabled(): boolean {
  return process.env.WILLITFLY_ENABLE_ARTICLES === "true";
}

export const metadata: Metadata = {
  title: "Articles",
  description: "Practical travel guidance from WillItFly.",
  robots: articlesEnabled() ? undefined : { index: false, follow: false },
};

export default async function ArticlesPage() {
  if (!articlesEnabled()) notFound();

  const { articles } = await getArticles();

  return (
    <section className="wf-container wf-section pb-6 sm:pb-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-navy-700">Articles</h1>
        <p className="mt-3 font-body text-navy-500">Clear, practical guidance to help you prepare and travel with confidence.</p>
      </div>

      {articles.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
        </div>
      ) : (
        <div className="wf-card mt-8 p-6">
          <p className="font-body text-navy-500">Articles are not published in RC1.</p>
        </div>
      )}
    </section>
  );
}
