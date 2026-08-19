import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Rc6CommercialPageRenderer from "@/components/rc6/Rc6CommercialPageRenderer";
import { rc6CommercialPageBySlug } from "@/services/rc6/commercial";
import { loadRc6DraftCommercialCatalogue } from "@/services/rc6/runtimeBinding";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "RC6 Commercial Preview",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

function previewEnabled(): boolean {
  return process.env.RC6_DRAFT_COMMERCIAL_ENABLED === "true";
}

export default async function Rc6CommercialPreviewPage({ params }: PageProps) {
  if (!previewEnabled()) notFound();

  const catalogue = await loadRc6DraftCommercialCatalogue();
  if (!catalogue) notFound();

  const { slug = [] } = await params;
  const resolvedSlug = slug.join("/");

  if (!resolvedSlug) {
    return (
      <main className="wf-container wf-container--narrow wf-section">
        <div className="rounded-3xl bg-slate-50 px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">RC6 Draft · synthetic commercial Runtime</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700">Commercial page preview</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This route is test-only, non-indexable and disabled unless the RC6 Draft commercial flag is explicitly enabled.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {catalogue.pages.map((page) => (
            <Link
              key={page.pageId}
              href={`/rc6-commercial-preview/${page.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{page.pageType}</p>
              <h2 className="mt-2 font-heading text-lg font-semibold text-navy-700">{page.title}</h2>
              {page.heroSummary ? <p className="mt-2 text-sm leading-6 text-slate-600">{page.heroSummary}</p> : null}
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const resolvedPage = rc6CommercialPageBySlug(catalogue, resolvedSlug);
  if (!resolvedPage) notFound();

  return <Rc6CommercialPageRenderer catalogue={catalogue} resolvedPage={resolvedPage} />;
}
