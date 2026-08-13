import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/services/articles";

export const revalidate = 3600;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function articlesEnabled(): boolean {
  return process.env.WILLITFLY_ENABLE_ARTICLES === "true";
}

export async function generateStaticParams() {
  if (!articlesEnabled()) return [];
  const { articles } = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  if (!articlesEnabled()) {
    return { title: "Article not available", robots: { index: false, follow: false } };
  }

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };

  return {
    title: article.title,
    description: article.summary || `Read ${article.title} from WillItFly.`,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  if (!articlesEnabled()) notFound();

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="wf-container wf-container--narrow wf-section">
      <Link href="/articles" className="font-body text-sm font-semibold text-green-700 hover:text-green-600">
        ← Back to Articles
      </Link>
      <h1 className="mt-5 font-heading text-3xl font-semibold text-navy-700">{article.title}</h1>
      {article.summary && <p className="mt-3 font-body text-lg text-navy-500">{article.summary}</p>}

      <div className="mt-8 space-y-7 font-body text-navy-600">
        {article.sections.map((section, index) => (
          <section key={section.contentId} aria-labelledby={index > 0 ? `article-section-${index}` : undefined}>
            {index > 0 && section.title && (
              <h2 id={`article-section-${index}`} className="font-heading text-xl font-semibold text-navy-700">
                {section.title}
              </h2>
            )}
            {section.body && <p className={index > 0 ? "mt-2 whitespace-pre-line" : "whitespace-pre-line"}>{section.body}</p>}
            {section.supportingText && index > 0 && (
              <p className="mt-2 text-sm text-navy-400">{section.supportingText}</p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
