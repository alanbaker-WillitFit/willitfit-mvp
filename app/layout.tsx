import type { Metadata } from "next";
import "./globals.css";
import WillItFlyHeader from "@/components/fly/WillItFlyHeader";
import WillItFlyFooter from "@/components/fly/WillItFlyFooter";
import { resolvePublishedNavigationRoutes } from "@/lib/willitflyNavigation";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export const metadata: Metadata = {
  ...(configuredSiteUrl ? {
    metadataBase: new URL(configuredSiteUrl),
    alternates: { canonical: "/" },
  } : {}),
  title: {
    default: "WillItFly — Smart Travel Answers | Know Before You Go",
    template: "%s | WillItFly",
  },
  description: "WillItFly gives travellers quick, practical answers about destinations, including power, connectivity, money, entry, weather and everyday travel questions.",
  applicationName: "WillItFly",
  keywords: ["travel questions", "destination information", "travel power", "travel connectivity", "currency", "entry requirements", "weather", "travel advice"],
  openGraph: {
    type: "website",
    siteName: "WillItFly",
    title: "WillItFly — Smart answers for every trip",
    description: "Practical destination answers built from governed travel data. Know Before You Go.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const bundle = await getWillItFlyRuntimeBundle();
  const publishedNavigationRoutes = resolvePublishedNavigationRoutes(bundle.navigationRoutes);

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="wf-skip-link">Skip to main content</a>
        <WillItFlyHeader routes={publishedNavigationRoutes} />
        <main id="main-content">{children}</main>
        <WillItFlyFooter />
      </body>
    </html>
  );
}
