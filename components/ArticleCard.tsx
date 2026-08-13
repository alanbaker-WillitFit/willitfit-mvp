import Link from "next/link";
import type { Article } from "@/services/articles";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="wf-card wf-card--compact group p-5">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
        Article
      </span>
      <h2 className="mt-2 font-heading text-lg font-semibold text-navy-700 group-hover:text-green-600">
        {article.title}
      </h2>
      {article.summary && (
        <p className="mt-2 line-clamp-3 font-body text-sm text-navy-500">{article.summary}</p>
      )}
      <span className="mt-3 inline-block font-body text-sm font-semibold text-navy-700">Click more →</span>
    </Link>
  );
}
