"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Something went wrong</h1>
      <p className="mt-3 font-body text-navy-500">
        We couldn&apos;t load this page right now — our data source may be temporarily unavailable.
        It&apos;s not you, it&apos;s us. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-green-500 px-6 py-3 font-body text-sm font-semibold text-white shadow-soft hover:bg-green-600"
      >
        Try again
      </button>
    </section>
  );
}
