import Link from "next/link";
import type { Article } from "@/services/articles";

function formatPublishedDate(value: string): string {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function ArticleCard({ article }: { article: Article }) {
  const publishedDate = formatPublishedDate(article.publishedDate);

  return (
    <Link href={`/articles/${article.slug}`} className="wf-card wf-card--compact group p-5">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
        {article.category}
        {publishedDate ? ` · ${publishedDate}` : ""}
      </p>
      <h2 className="mt-2 font-heading text-lg font-semibold text-navy-700 group-hover:text-green-600">
        {article.title}
      </h2>
      {article.summary && (
        <p className="mt-2 line-clamp-3 font-body text-sm text-navy-500">{article.summary}</p>
      )}
      <span className="mt-3 inline-block font-body text-sm font-semibold text-navy-700 group-hover:text-green-600">
        Read article →
      </span>
    </Link>
  );
}
