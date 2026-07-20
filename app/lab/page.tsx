import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WillIt Lab",
  description: "Optional travel experiments from WillitFit, isolated from the cabin bag checker.",
  robots: { index: false, follow: true },
};

export default function LabPage() {
  return (
    <section className="wf-container wf-container--narrow wf-section">
      <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-700">WillIt Lab</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">A small space for travel experiments.</h1>
      <p className="mt-5 font-body text-lg leading-relaxed text-navy-600">Lab experiences are optional and run separately from the cabin bag checker. Playing cannot change an allowance, result, search entry or airline record.</p>
      <div className="wf-card mt-8">
        <h2 className="font-heading text-2xl font-semibold text-navy-700">WillItFly</h2>
        <p className="font-body leading-relaxed text-navy-600">A free one-tap airport game with a device-only personal best and local leaderboard. No account, email or network score registration.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/lab/index.html" prefetch={false} className="wf-btn-cta inline-flex min-h-12 items-center justify-center px-6 py-3 font-body text-sm">Play WillItFly</Link>
          <Link href="/#checker" className="wf-interactive inline-flex min-h-12 items-center justify-center rounded-xl border border-navy-100 px-6 py-3 font-body text-sm font-semibold text-navy-700">Return to the checker</Link>
        </div>
        <p className="font-body text-xs leading-relaxed text-navy-400">Scores and theme choice stay on this device. Clearing browser storage removes them.</p>
      </div>
    </section>
  );
}
