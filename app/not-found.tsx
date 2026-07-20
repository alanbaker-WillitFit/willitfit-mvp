import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wf-container wf-container--narrow wf-section flex flex-col items-center text-center">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">We couldn&apos;t find that page</h1>
      <p className="mt-3 font-body text-navy-500">
        The airline or tip you&apos;re looking for may have been renamed or removed.
      </p>
      <Link
        href="/"
        className="wf-btn-cta mt-6 px-6 py-3 font-body text-sm"
      >
        Back to the bag checker
      </Link>
    </section>
  );
}
