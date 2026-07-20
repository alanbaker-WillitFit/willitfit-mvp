"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wf-container wf-container--narrow wf-section flex flex-col items-center text-center">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Something went wrong</h1>
      <p className="mt-3 font-body text-navy-500">
        We couldn&apos;t load this page right now — our data source may be temporarily unavailable.
        It&apos;s not you, it&apos;s us. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="wf-btn-cta mt-6 px-6 py-3 font-body text-sm"
      >
        Try again
      </button>
    </section>
  );
}
