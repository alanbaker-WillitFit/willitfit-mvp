export type RuntimeDestinationQuestion = {
  questionId: string;
  destinationId: string;
  topicId: string;
  question: string;
  answerSummary: string;
  detail?: string;
  sourceId: string;
  factClassification?: string;
  preparationState?: string;
  lastReviewed?: string;
  slug: string;
  indexable: boolean;
};

export type RuntimeSeoPage = {
  pageId: string;
  pageType: string;
  destinationId: string;
  topicId: string;
  slug: string;
  canonicalUrl: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  indexable: boolean;
  structuredDataType?: string;
  lastReviewed?: string;
};

export type ResolvedAnswerPage = {
  pageId: string;
  questionId: string;
  destinationId: string;
  topicId: string;
  slug: string;
  canonicalUrl: string;
  question: string;
  h1: string;
  answerSummary: string;
  detail?: string;
  sourceId: string;
  metaTitle: string;
  metaDescription: string;
  structuredDataType?: string;
  lastReviewed?: string;
};

function uniqueBySlug<T extends { slug: string }>(rows: T[]): Map<string, T | null> {
  const result = new Map<string, T | null>();
  for (const row of rows) {
    const existing = result.get(row.slug);
    result.set(row.slug, existing === undefined ? row : null);
  }
  return result;
}

function latestDate(...dates: Array<string | undefined>): string | undefined {
  return dates.filter((value): value is string => Boolean(value)).sort().at(-1);
}

export function resolvePublishedAnswerPages(
  questions: RuntimeDestinationQuestion[],
  seoPages: RuntimeSeoPage[],
): ResolvedAnswerPage[] {
  const questionBySlug = uniqueBySlug(questions.filter((row) => row.indexable));
  const seoBySlug = uniqueBySlug(seoPages.filter((row) => row.indexable));
  const resolved: ResolvedAnswerPage[] = [];

  for (const [slug, question] of questionBySlug) {
    const seo = seoBySlug.get(slug);
    if (!question || !seo) continue;
    if (!question.question || !question.answerSummary || !question.sourceId) continue;
    if (!seo.metaTitle || !seo.metaDescription || !seo.h1 || !seo.canonicalUrl) continue;
    if (question.destinationId !== seo.destinationId) continue;
    if (question.topicId !== seo.topicId) continue;
    if (!seo.pageType.toUpperCase().includes("ANSWER")) continue;

    resolved.push({
      pageId: seo.pageId,
      questionId: question.questionId,
      destinationId: question.destinationId,
      topicId: question.topicId,
      slug,
      canonicalUrl: seo.canonicalUrl,
      question: question.question,
      h1: seo.h1,
      answerSummary: question.answerSummary,
      detail: question.detail,
      sourceId: question.sourceId,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      structuredDataType: seo.structuredDataType,
      lastReviewed: latestDate(question.lastReviewed, seo.lastReviewed),
    });
  }

  return resolved.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function resolveAnswerPageBySlug(
  slug: string,
  questions: RuntimeDestinationQuestion[],
  seoPages: RuntimeSeoPage[],
): ResolvedAnswerPage | null {
  return resolvePublishedAnswerPages(questions, seoPages).find((page) => page.slug === slug) || null;
}
