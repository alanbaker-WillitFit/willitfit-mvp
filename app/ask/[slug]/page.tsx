import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AskWillItFitSearch from "@/components/AskWillItFitSearch";
import { KNOWLEDGE_OBJECTS, getKnowledgeBySlug, getRelatedKnowledge } from "@/services/knowledge";
import Breadcrumbs from "@/components/Breadcrumbs";

export function generateStaticParams() {
  return KNOWLEDGE_OBJECTS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getKnowledgeBySlug(slug);
  if (!item) return {};
  return { title: item.primaryQuestion, description: item.quickAnswer };
}

export default async function KnowledgeAnswerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getKnowledgeBySlug(slug);
  if (!item) return notFound();
  const related = getRelatedKnowledge(item);

  return (
    <>
      <section className="bg-navy-700">
        <div className="wf-container py-10 sm:py-12">
          <div className="[&_a]:text-green-400 [&_span]:text-navy-200">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Ask WillitFit", href: "/ask" }, { label: item.primaryQuestion }]} />
          </div>
          <h1 className="mt-3 max-w-4xl font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">{item.primaryQuestion}</h1>
        </div>
      </section>
      <div className="wf-container wf-layout-home -mt-6 grid gap-8">
        <article className="wf-card wf-card--large min-w-0">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">Quick answer</p>
          <p className="mt-2 font-heading text-xl font-semibold leading-relaxed text-navy-700">{item.quickAnswer}</p>
          <h2 className="mt-8 font-heading text-2xl font-semibold text-navy-700">What to know</h2>
          <p className="mt-3 font-body leading-7 text-navy-600">{item.detailedAnswer}</p>
          <div className="mt-8 rounded-2xl bg-navy-50 p-5">
            <p className="font-body text-sm font-semibold text-navy-700">Evidence and review</p>
            <p className="mt-1 font-body text-sm text-navy-500">{item.sourceLabel}</p>
            <p className="mt-1 font-body text-xs text-navy-400">Reviewed: {item.reviewedDate}</p>
          </div>
          {related.length > 0 && (
            <section className="mt-8">
              <h2 className="font-heading text-xl font-semibold text-navy-700">Related questions</h2>
              <div className="mt-3 grid gap-3">
                {related.map((candidate) => (
                  <Link key={candidate.knowledgeId} href={`/ask/${candidate.slug}`} className="wf-interactive rounded-2xl border border-navy-100 p-4 font-body font-semibold text-navy-700 hover:bg-navy-50">
                    {candidate.primaryQuestion}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
        <aside className="space-y-6">
          <AskWillItFitSearch items={KNOWLEDGE_OBJECTS} />
          <div className="wf-card wf-card--compact">
            <h2 className="font-heading text-base font-semibold text-navy-700">Check your own bag</h2>
            <p className="mt-2 font-body text-sm text-navy-500">Compare your measurements with an airline allowance.</p>
            <Link href="/#checker" className="wf-btn-cta mt-4 inline-block px-5 py-2.5 font-body text-sm">Check my bag</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
