import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./AnswerPage.module.css";
import { getWillItFlyCardsRuntimeBundle } from "@/services/willitflyCardsRuntime";
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

  const runtime = await getWillItFlyCardsRuntimeBundle();
  const publicSource = runtime.publicSources.find((source) => source.sourceId === page.sourceId);

  return (
    <main className={styles.page}>
      <div className={`wf-container wf-container--narrow ${styles.container}`}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">WillItFly</Link>
          <span aria-hidden="true">/</span>
          <span>Answers</span>
        </nav>

        <article className={styles.article}>
          <p className={styles.eyebrow}>People Often Ask</p>
          <h1>{page.h1}</h1>

          <section className={styles.answer} aria-labelledby="answer-heading">
            <h2 id="answer-heading">Answer</h2>
            <p>{page.answerSummary}</p>
          </section>

          {page.detail ? (
            <section className={styles.detail} aria-labelledby="detail-heading">
              <h2 id="detail-heading">What to know</h2>
              <p>{page.detail}</p>
            </section>
          ) : null}

          <aside className={styles.evidence} aria-label="Answer evidence">
            <div>
              <strong>Governed answer</strong>
              <p>This page is published only from an approved WillIt runtime snapshot.</p>
            </div>
            {publicSource ? (
              <a href={publicSource.url} rel="noreferrer" target="_blank">
                View source: {publicSource.sourceName}
              </a>
            ) : (
              <span>Source reference: {page.sourceId}</span>
            )}
            {page.lastReviewed ? <small>Last reviewed: {page.lastReviewed}</small> : null}
          </aside>

          <div className={styles.actions}>
            <Link href={`/fly/${page.destinationId.toLowerCase()}`}>Explore the destination</Link>
            <Link href="/">Ask another travel question</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
