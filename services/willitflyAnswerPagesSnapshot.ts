import snapshot from "@/data/answer-pages.snapshot.json";
import type { ResolvedAnswerPage } from "@/lib/willitflyAnswerPages";

type AnswerPagesSnapshot = {
  schemaVersion: string;
  generatedAt: string | null;
  source: string;
  pages: ResolvedAnswerPage[];
};

function validPage(page: ResolvedAnswerPage): boolean {
  return Boolean(
    page.pageId
    && page.questionId
    && page.destinationId
    && page.topicId
    && page.slug
    && page.canonicalUrl
    && page.question
    && page.h1
    && page.answerSummary
    && page.sourceId
    && page.metaTitle
    && page.metaDescription,
  );
}

function uniquePublishedPages(pages: ResolvedAnswerPage[]): ResolvedAnswerPage[] {
  const counts = new Map<string, number>();
  for (const page of pages) counts.set(page.slug, (counts.get(page.slug) || 0) + 1);
  return pages.filter((page) => counts.get(page.slug) === 1 && validPage(page));
}

export function getAnswerPagesSnapshot(): AnswerPagesSnapshot {
  const typed = snapshot as AnswerPagesSnapshot;
  if (typed.schemaVersion !== "1.0") {
    return {
      schemaVersion: typed.schemaVersion,
      generatedAt: typed.generatedAt,
      source: typed.source,
      pages: [],
    };
  }

  return {
    ...typed,
    pages: uniquePublishedPages(typed.pages),
  };
}

export function getPublishedAnswerPage(slug: string): ResolvedAnswerPage | null {
  return getAnswerPagesSnapshot().pages.find((page) => page.slug === slug) || null;
}
