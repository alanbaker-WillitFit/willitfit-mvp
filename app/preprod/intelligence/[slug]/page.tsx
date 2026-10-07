import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DecisionEvidencePage from "@/components/intelligence/DecisionEvidencePage";
import { getPreprodCandidate, getPreprodCandidates } from "@/lib/masterEstatePreprod";

export const dynamicParams = false;
export function generateStaticParams() { return getPreprodCandidates("FIT").map((page) => ({ slug: page.slug })); }
export async function generateMetadata(): Promise<Metadata> { return { robots: { index: false, follow: false } }; }

export default async function MasterEstatePreprodPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const page = getPreprodCandidate("FIT", slug);
  if (!page) return notFound();
  return <DecisionEvidencePage page={page} brand="WillItFit" />;
}
