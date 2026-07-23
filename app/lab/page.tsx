import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WillItFit Lab",
  description: "Try WillItFit travel games and packing experiments.",
  robots: { index: false, follow: false },
};

export default function LabPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">WillItFit Lab</p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">WillItFly</h1>
      <p className="mt-3 text-slate-700">The original Flappy-style WillItFit game.</p>
      <Link className="mt-6 inline-flex rounded-lg bg-green-600 px-5 py-3 font-semibold text-white" href="/lab/index.html">
        Play WillItFly
      </Link>
    </main>
  );
}
