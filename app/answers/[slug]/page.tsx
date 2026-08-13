import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWillItFlyCardsRuntimeBundle } from "@/services/willitflyCardsRuntime";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";
import {
  getAnswerPagesSnapshot,
  getPublishedAnswerPage,
} from "@/services/willitflyAnswerPagesSnapshot";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAnswerPagesSnapshot().pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPublishedAnswerPage(slug);
  if (!page) return { robots: { index: false, follow: false } };

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: page.canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function AnswerPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPublishedAnswerPage(slug);
  if (!page) return notFound();

  const [cardsRuntime, runtime] = await Promise.all([
    getWillItFlyCardsRuntimeBundle(),
    getWillItFlyRuntimeBundle(),
  ]);
  const publicSource = cardsRuntime.publicSources.find((source) => source.sourceId === page.sourceId);
  const destination = runtime.destinations.find((item) => item.destinationId === page.destinationId);

  return (
    <main className="min-h-[70vh] bg-[#f7f9fc] py-14 text-navy-700 sm:py-20">
      <div className="wf-container wf-container--narrow max-w-[820px]">
        <nav className="mb-6 flex items-center gap-2 text-xs font-bold text-[#66738a]" aria-label="Breadcrumb">
          <Link className="text-[#168b2c]" href="/">WillItFly</Link>
          <span aria-hidden="true">/</span>
          <span>Answers</span>
        </nav>

        <article className="rounded-[18px] border border-[#dce3ee] bg-white p-6 shadow-[0_16px_42px_rgba(13,27,61,0.08)] sm:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#168b2c]">People Often Ask</p>
          <h1 className="mt-2 max-w-[720px] text-[clamp(34px,6vw,56px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-navy-700">
            {page.h1}
          </h1>

          <section className="mt-9 rounded-[10px] border-l-[5px] border-l-green-500 bg-[#f2fbf4] p-5 sm:p-6" aria-labelledby="answer-heading">
            <h2 className="text-lg font-extrabold" id="answer-heading">Answer</h2>
            <p className="mt-2 text-[clamp(19px,2.5vw,24px)] font-semibold leading-relaxed text-[#15213d]">
              {page.answerSummary}
            </p>
          </section>

          {page.detail ? (
            <section className="mt-9" aria-labelledby="detail-heading">
              <h2 className="text-lg font-extrabold" id="detail-heading">What to know</h2>
              <p className="mt-2 text-base leading-7 text-[#52617d]">{page.detail}</p>
            </section>
          ) : null}

          <aside className="mt-9 grid gap-2 border-t border-[#e4e9f1] pt-6 text-xs text-[#66738a]" aria-label="Answer evidence">
            <div>
              <strong className="text-[13px] text-navy-700">Governed answer</strong>
              <p className="mt-1">This page is published only from an approved WillIt runtime snapshot.</p>
            </div>
            {publicSource ? (
              <a className="w-fit font-bold text-[#168b2c] underline underline-offset-4" href={publicSource.url} rel="noreferrer" target="_blank">
                View source: {publicSource.sourceName}
              </a>
            ) : (
              <span>Source reference: {page.sourceId}</span>
            )}
            {page.lastReviewed ? <small>Last reviewed: {page.lastReviewed}</small> : null}
          </aside>

          <div className="mt-7 flex flex-wrap gap-2">
            {destination ? (
              <Link className="rounded-lg border border-[#8fd09b] bg-[#f4fbf5] px-4 py-3 text-xs font-bold text-[#117729]" href={`/fly/${destination.slug}`}>
                Explore {destination.displayName}
              </Link>
            ) : null}
            <Link className="rounded-lg border border-[#ccd6e5] px-4 py-3 text-xs font-bold text-navy-700" href="/">
              Ask another travel question
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
