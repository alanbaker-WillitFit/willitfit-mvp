import Link from "next/link";
import type { MasterEstatePageCandidate } from "@/lib/masterEstatePreprod";

export default function DecisionEvidencePage({ page, brand }: { page: MasterEstatePageCandidate; brand: "WillItFit" | "WillItFly" }) {
  return (
    <main className="min-h-[70vh] bg-[#f7f9fc] py-12 text-[#0D1B3D] sm:py-16">
      <div className="mx-auto max-w-[900px] px-5">
        <nav className="mb-5 text-xs font-bold text-[#68758c]" aria-label="Breadcrumb">
          <Link href="/">{brand}</Link> <span aria-hidden="true">/</span> <Link href="/preprod/intelligence">Pre-production intelligence</Link>
        </nav>
        <article className="rounded-[18px] border border-[#dce3ee] bg-white p-6 shadow-[0_16px_42px_rgba(13,27,61,0.08)] sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#168b2c]">{page.family} · Rank {page.rank}</p>
          <h1 className="mt-2 text-[clamp(34px,6vw,54px)] font-extrabold leading-[1.03] tracking-[-0.035em]">{page.title}</h1>
          <p className="mt-4 text-lg leading-8 text-[#52617d]">{page.intent}</p>

          <section className="mt-8 rounded-xl border-l-[5px] border-l-[#F59E0B] bg-[#fff8e8] p-5" aria-labelledby="decision-heading">
            <h2 id="decision-heading" className="text-lg font-extrabold">Pre-production decision</h2>
            <p className="mt-2 leading-7 text-[#3d485d]">{page.decisionSummary}</p>
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Evidence state">
            {[
              ["Publication", page.publicationState],
              ["Readiness", `${page.readinessState} · ${page.readinessScore}/100`],
              ["Evidence", page.evidenceState],
              ["Freshness", page.freshnessClass],
              ["Contradictions", page.contradictionState],
              ["Last verified", page.lastVerified ?? "Not yet verified"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#e2e7ef] bg-[#fafbfd] p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7b8799]">{label}</span>
                <strong className="mt-1 block text-sm">{value}</strong>
              </div>
            ))}
          </section>

          <section className="mt-8" aria-labelledby="validation-heading">
            <h2 id="validation-heading" className="text-lg font-extrabold">Required before publication</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#52617d]">
              {page.requiredValidation.map((item) => <li key={item} className="rounded-lg bg-[#f5f7fa] px-4 py-3">{item}</li>)}
            </ul>
          </section>

          {page.sourceCandidates.length ? (
            <section className="mt-8" aria-labelledby="sources-heading">
              <h2 id="sources-heading" className="text-lg font-extrabold">Source candidates</h2>
              <ul className="mt-3 grid gap-2 text-sm">{page.sourceCandidates.map((source) => <li key={source}><a className="font-bold text-[#168b2c] underline underline-offset-4" href={source} target="_blank" rel="noreferrer">{source}</a></li>)}</ul>
              <p className="mt-2 text-xs text-[#7b8799]">Candidate source presence is not publication approval.</p>
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-[#e3e8ef] pt-6">
            <Link className="rounded-lg bg-[#0D1B3D] px-4 py-3 text-sm font-bold text-white" href={page.actionHref}>{page.actionLabel}</Link>
            <Link className="rounded-lg border border-[#cad4e2] px-4 py-3 text-sm font-bold" href="/preprod/intelligence">Back to cohort</Link>
          </div>
          <p className="mt-6 text-xs leading-5 text-[#7b8799]">Master Estate baseline: 42,526 source instances → 14,819 unique canonical files; 123,289 normalized unique URLs; 371 explicit Q&amp;A pairs. This preview is intentionally noindex.</p>
        </article>
      </div>
    </main>
  );
}
