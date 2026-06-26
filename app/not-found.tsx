import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">We couldn&apos;t find that page</h1>
      <p className="mt-3 font-body text-navy-500">
        The airline or tip you&apos;re looking for may have been renamed or removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-green-500 px-6 py-3 font-body text-sm font-semibold text-white shadow-soft hover:bg-green-600"
      >
        Back to the bag checker
      </Link>
    </section>
  );
}
