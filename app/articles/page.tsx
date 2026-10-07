import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getArticles } from "@/services/articles";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Travel articles and baggage guides",
  description: "Evidence-led travel guides, baggage explainers and human travel stories from WillItFit.",
  alternates: { canonical: siteUrl("/articles") },
};

export default async function ArticlesPage() {
  const { articles } = await getArticles();
  return (
    <main className="wf-container wf-section">
      <section className="rounded-3xl bg-navy-700 p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-400">WillItFit articles</p>
        <h1 className="mt-2 font-heading text-4xl font-bold">Useful answers, deeper guides and real travel stories</h1>
        <p className="mt-4 max-w-3xl text-navy-100">Each published article is built around a clear traveller need, evidence, review information and useful next steps.</p>
      </section>
      {articles.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <article key={article.slug} className="wf-card overflow-hidden">
              <div className="relative h-40 overflow-hidden bg-navy-100">
                <Image src={article.heroImage || "/assets/hero/airport-luggage.png"} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{article.category}</p>
                <h2 className="mt-2 font-heading text-xl font-semibold text-navy-700"><Link href={`/articles/${article.slug}`}>{article.title}</Link></h2>
                <p className="mt-3 text-sm leading-6 text-navy-500">{article.summary}</p>
                {article.lastReviewed && <p className="mt-4 text-xs text-navy-400">Reviewed {article.lastReviewed}</p>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="wf-card mt-8 p-6"><p className="font-body text-navy-500">No published articles are currently available.</p></div>
      )}
    </main>
  );
}
