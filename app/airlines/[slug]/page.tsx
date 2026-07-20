import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyAirlinePage({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/${slug}`);
}
