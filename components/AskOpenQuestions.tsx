"use client";

import { useState } from "react";
import type { OpenQuestion } from "@/services/askWillItFit";

export default function AskOpenQuestions({ questions }: { questions: OpenQuestion[] }) {
  const [selected, setSelected] = useState<OpenQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setStatus("sending");
    setMessage("");
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "answer", questionId: selected.questionId, answer, website: "" }),
    });
    const payload = await response.json() as { ok?: boolean; id?: string; error?: string };
    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.error || "Your answer could not be submitted.");
      return;
    }
    setStatus("sent");
    setMessage(`Answer ${payload.id} has been received for private review.`);
    setAnswer("");
  }

  if (questions.length === 0) return null;

  return (
    <aside id="open-questions" className="wf-card wf-card--compact self-start scroll-mt-24">
      <h2 className="font-heading text-base font-semibold text-navy-700">Questions awaiting answers</h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-navy-500">
        These questions have been reviewed by WillItFit. Suggested answers remain private until approved.
      </p>
      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {questions.map((question) => (
          <button
            key={question.questionId}
            type="button"
            onClick={() => { setSelected(question); setStatus("idle"); setMessage(""); }}
            className="wf-interactive w-full rounded-xl border border-navy-100 p-3 text-left"
          >
            <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
              {question.category}
            </span>
            <span className="mt-1 block font-body text-sm font-semibold leading-snug text-navy-700">
              {question.question}
            </span>
            <span className="mt-2 block font-body text-xs font-semibold text-green-700">Share an answer →</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="answer-question-title">
          <div className="w-full max-w-xl rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{selected.questionId}</p>
                <h3 id="answer-question-title" className="mt-1 font-heading text-xl font-semibold text-navy-700">{selected.question}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg px-3 py-1 font-body text-sm font-semibold text-navy-500">Close</button>
            </div>
            <p className="mt-3 font-body text-sm leading-relaxed text-navy-500">
              Do not include names, contact details, booking references or other personal information. Nothing is published automatically.
            </p>
            <form onSubmit={submit} className="mt-4">
              <label htmlFor="community-answer" className="font-body text-sm font-semibold text-navy-700">Your suggested answer</label>
              <textarea id="community-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} minLength={20} maxLength={1500} required rows={6} className="wf-input mt-2 w-full p-4 font-body text-base" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {message && <p className={`mt-3 font-body text-sm ${status === "error" ? "text-red-700" : "text-green-700"}`}>{message}</p>}
              <button type="submit" disabled={status === "sending"} className="wf-btn-cta mt-4 px-5 py-2.5 font-body text-sm disabled:opacity-60">
                {status === "sending" ? "Submitting…" : "Submit for review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
