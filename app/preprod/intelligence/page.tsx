import type { Metadata } from "next";
import Link from "next/link";
import { getPreprodCandidates, MASTER_ESTATE_BASELINE } from "@/lib/masterEstatePreprod";

export const metadata: Metadata = { title: "Master Estate V1 pre-production cohort", robots: { index: false, follow: false } };

export default function MasterEstatePreprodIndex() {
  const pages = getPreprodCandidates("FIT");
  return (
    <main className="min-h-[70vh] bg-[#f7f9fc] py-12 text-[#0D1B3D]">
      <div className="mx-auto max-w-[1000px] px-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#168b2c]">WillItFit · Master Estate V1</p>
        <h1 className="mt-2 text-4xl font-extrabold">Pre-production decision cohort</h1>
        <p className="mt-3 max-w-[760px] leading-7 text-[#52617d]">These routes prove the shared entity/evidence/page contract. Nothing in this cohort is indexable until source, contradiction and freshness validation passes.</p>
        <div className="mt-6 rounded-xl border border-[#dce3ee] bg-white p-5 text-sm">
          <strong>{MASTER_ESTATE_BASELINE.uniqueCanonicalFiles.toLocaleString()} unique canonical files</strong> from {MASTER_ESTATE_BASELINE.sourceInstances.toLocaleString()} source instances · {MASTER_ESTATE_BASELINE.uniqueUrls.toLocaleString()} normalized URLs · {MASTER_ESTATE_BASELINE.explicitQaPairs} explicit Q&amp;A pairs.
        </div>
        <div className="mt-8 grid gap-3">
          {pages.map((page) => (
            <Link key={page.pageId} href={`/preprod/intelligence/${page.slug}`} className="rounded-xl border border-[#dce3ee] bg-white p-5 hover:border-[#9fb2c8]">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong>{page.rank}. {page.title}</strong><span className="text-xs font-bold text-[#9a6700]">{page.publicationState}</span></div>
              <p className="mt-2 text-sm text-[#66738a]">{page.family} · {page.readinessState} · {page.readinessScore}/100</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
