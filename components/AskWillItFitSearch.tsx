"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Airline, RuntimeContentRecord, TravelTip } from "@/types";
import type { KnowledgeObject } from "@/services/knowledge";
import type { AskSubmissionType } from "@/services/askWillItFit";
import { scoreSearchFields } from "@/lib/searchRanking";

type SearchResult = {
  key: string;
  href?: string;
  title: string;
  description: string;
  kind: "Airline" | "Answer" | "Tip";
  score: number;
};

type SubmissionOption = {
  type: AskSubmissionType;
  label: string;
  shortLabel: string;
  heading: string;
  helper: string;
  placeholder: string;
  submitLabel: string;
};

const SUBMISSION_OPTIONS: SubmissionOption[] = [
  {
    type: "question",
    label: "Ask a question",
    shortLabel: "Question",
    heading: "What would you like to know?",
    helper: "Search WillItFit's reviewed knowledge first. If there is no useful match, send your question for private review.",
    placeholder: "For example: Do Ryanair include wheels in the bag measurement?",
    submitLabel: "Submit question for review",
  },
  {
    type: "feature",
    label: "Suggest a feature",
    shortLabel: "Feature",
    heading: "What would make WillItFit more useful?",
    helper: "Describe the feature, improvement or new capability you would like us to consider.",
    placeholder: "Describe the feature and how it would help travellers.",
    submitLabel: "Submit feature suggestion",
  },
  {
    type: "problem",
    label: "Report a problem",
    shortLabel: "Problem",
    heading: "What problem did you find?",
    helper: "Tell us what happened, what you expected and which page or feature was involved. Do not include personal booking information.",
    placeholder: "Describe the problem and where you found it.",
    submitLabel: "Submit problem report",
  },
  {
    type: "comment",
    label: "Leave feedback",
    shortLabel: "Feedback",
    heading: "What would you like to tell us?",
    helper: "Share a comment, correction or general feedback. Every submission enters private review.",
    placeholder: "Share your feedback or comment.",
    submitLabel: "Submit feedback",
  },
];

export default function AskWillItFitSearch({
  items = [],
  airlines = [],
  faqs = [],
  tips = [],
}: {
  items?: KnowledgeObject[];
  airlines?: Airline[];
  faqs?: RuntimeContentRecord[];
  tips?: TravelTip[];
}) {
  const [intent, setIntent] = useState<AskSubmissionType | null>(null);
  const [query, setQuery] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");

  const selectedOption = SUBMISSION_OPTIONS.find((option) => option.type === intent) ?? null;

  const results = useMemo(() => {
    const faqResults: SearchResult[] = faqs.map((faq) => ({
      key: faq.contentId,
      title: faq.title,
      description: faq.body,
      kind: "Answer",
      score: query.trim()
        ? scoreSearchFields(query, [
            { value: faq.title, weight: 3 },
            { value: faq.body, weight: 2 },
            { value: faq.supportingText, weight: 1 },
          ])
        : Math.max(0, 1000 - faq.displayOrder),
    }));

    const tipResults: SearchResult[] = tips.map((tip) => ({
      key: tip.tipId,
      href: `/travel-tips/${tip.slug}`,
      title: tip.title,
      description: tip.content,
      kind: "Tip",
      score: query.trim()
        ? scoreSearchFields(query, [
            { value: tip.title, weight: 3 },
            { value: tip.content, weight: 2 },
            { value: tip.seoKeyword, weight: 1 },
          ])
        : 0,
    }));

    const knowledge: SearchResult[] = items.map((item) => ({
      key: item.knowledgeId,
      href: `/ask/${item.slug}`,
      title: item.primaryQuestion,
      description: item.quickAnswer,
      kind: "Answer",
      score: query.trim()
        ? scoreSearchFields(query, [
            { value: item.primaryQuestion, weight: 3 },
            { value: item.alternativeQuestions.join(" "), weight: 2 },
            { value: item.searchTerms.join(" "), weight: 1 },
          ])
        : item.priority / 100,
    }));

    const airlineResults: SearchResult[] = query.trim()
      ? airlines.map((airline) => ({
          key: airline.airlineId,
          href: `/${airline.slug}`,
          title: airline.airlineName,
          description: `View baggage allowances for ${airline.airlineName}.`,
          kind: "Airline",
          score: scoreSearchFields(query, [
            { value: airline.airlineName, weight: 4 },
            { value: airline.country, weight: 1 },
          ]),
        }))
      : [];

    return [...airlineResults, ...faqResults, ...tipResults, ...knowledge]
      .filter((result) => !query.trim() || result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [airlines, faqs, items, query, tips]);

  const hasUsefulMatch =
    intent === "question" &&
    query.trim().length > 0 &&
    results.some((result) => result.score >= 2);

  const canSubmit =
    Boolean(intent) &&
    query.trim().length >= 12 &&
    !hasUsefulMatch &&
    submissionStatus !== "sending" &&
    submissionStatus !== "sent";

  function selectIntent(nextIntent: AskSubmissionType) {
    setIntent(nextIntent);
    setQuery("");
    setSubmissionStatus("idle");
    setSubmissionMessage("");
  }

  function updateQuery(value: string) {
    setQuery(value);
    setSubmissionStatus("idle");
    setSubmissionMessage("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!intent || !canSubmit) return;

    setSubmissionStatus("sending");
    setSubmissionMessage("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: intent,
          question: query,
          website: "",
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setSubmissionStatus("error");
        setSubmissionMessage(payload.error || "Your submission could not be received.");
        return;
      }

      setSubmissionStatus("sent");
      setSubmissionMessage(
        `${selectedOption?.shortLabel ?? "Submission"} ${payload.id} has been received for private review.`,
      );
    } catch {
      setSubmissionStatus("error");
      setSubmissionMessage("Your submission could not be received. Please try again.");
    }
  }

  return (
    <div className="wf-card wf-card--large">
      <fieldset>
        <legend className="font-heading text-xl font-semibold text-navy-700">
          What would you like to do today?
        </legend>
        <p className="mt-2 font-body text-sm leading-relaxed text-navy-500">
          Choose the option that best describes your message. Nothing is published automatically.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {SUBMISSION_OPTIONS.map((option) => {
            const selected = intent === option.type;

            return (
              <button
                key={option.type}
                type="button"
                aria-pressed={selected}
                onClick={() => selectIntent(option.type)}
                className={`wf-interactive rounded-2xl border p-4 text-left ${
                  selected
                    ? "border-green-500 bg-green-50 shadow-soft"
                    : "border-navy-100 bg-white"
                }`}
              >
                <span className="block font-body text-xs font-semibold uppercase tracking-wide text-green-700">
                  {option.shortLabel}
                </span>
                <span className="mt-1 block font-heading text-base font-semibold text-navy-700">
                  {option.label}
                </span>
              </button>
            );
          })}

          <Link
            href="#open-questions"
            className="wf-interactive rounded-2xl border border-navy-100 bg-white p-4 text-left sm:col-span-2"
          >
            <span className="block font-body text-xs font-semibold uppercase tracking-wide text-green-700">
              Answer
            </span>
            <span className="mt-1 block font-heading text-base font-semibold text-navy-700">
              Answer an existing question
            </span>
            <span className="mt-1 block font-body text-sm leading-relaxed text-navy-500">
              View moderated community questions that are currently open for suggested answers.
            </span>
          </Link>
        </div>
      </fieldset>

      {!selectedOption && (
        <div className="mt-6 rounded-2xl border border-navy-100 bg-navy-50 p-5">
          <p className="font-body text-sm font-semibold text-navy-700">
            Select an option to continue.
          </p>
        </div>
      )}

      {selectedOption && (
        <form onSubmit={submit} className="mt-7 border-t border-navy-100 pt-7">
          <label
            htmlFor="ask-willitfit"
            className="font-heading text-xl font-semibold text-navy-700"
          >
            {selectedOption.heading}
          </label>

          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-navy-500">
            {selectedOption.helper}
          </p>

          {intent === "question" ? (
            <input
              id="ask-willitfit"
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={selectedOption.placeholder}
              autoComplete="off"
              aria-controls="ask-willitfit-results"
              className="wf-input mt-5 min-h-14 w-full border border-navy-200 bg-white px-4 py-3 font-body text-base text-navy-700 shadow-soft outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          ) : (
            <textarea
              id="ask-willitfit"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={selectedOption.placeholder}
              minLength={12}
              maxLength={500}
              required
              rows={6}
              className="wf-input mt-5 w-full border border-navy-200 bg-white p-4 font-body text-base text-navy-700 shadow-soft outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          )}

          {intent === "question" && (
            <div id="ask-willitfit-results" className="mt-5" aria-live="polite">
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-navy-400">
                {query.trim() ? "Suggested results" : "Popular questions"}
              </p>

              {results.length > 0 ? (
                <div className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
                  {results.map((result) =>
                    result.href ? (
                      <Link
                        key={`${result.kind}-${result.key}`}
                        href={result.href}
                        className="wf-interactive block p-4 hover:bg-navy-50"
                      >
                        <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
                          {result.kind}
                        </span>
                        <span className="mt-1 block font-body font-semibold text-navy-700">
                          {result.title}
                        </span>
                        <span className="mt-1 block line-clamp-3 font-body text-sm leading-relaxed text-navy-500">
                          {result.description}
                        </span>
                      </Link>
                    ) : (
                      <article key={`${result.kind}-${result.key}`} className="p-4">
                        <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
                          {result.kind}
                        </span>
                        <h2 className="mt-1 font-body font-semibold text-navy-700">
                          {result.title}
                        </h2>
                        <p className="mt-1 font-body text-sm leading-relaxed text-navy-500">
                          {result.description}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              ) : query.trim() ? (
                <div className="mt-3 rounded-2xl border border-navy-100 bg-navy-50 p-5">
                  <p className="font-body font-semibold text-navy-700">
                    We do not have that exact answer yet.
                  </p>
                  <p className="mt-1 font-body text-sm text-navy-500">
                    You can send the question to WillItFit for private review.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {hasUsefulMatch && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="font-body text-sm font-semibold text-navy-700">
                A reviewed result may already answer this question.
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-navy-500">
                Open the most relevant result above before sending a duplicate question.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="font-body text-sm leading-relaxed text-navy-500">
              Your submission enters a private moderation queue. Please remove names,
              contact details, booking references and other personal information.
            </p>

            {submissionMessage && (
              <p
                className={`mt-3 font-body text-sm ${
                  submissionStatus === "error" ? "text-red-700" : "text-green-700"
                }`}
                role="status"
              >
                {submissionMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="wf-btn-cta mt-4 px-5 py-2.5 font-body text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submissionStatus === "sending"
                ? "Submitting..."
                : submissionStatus === "sent"
                  ? "Submitted"
                  : selectedOption.submitLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
