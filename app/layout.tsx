import type { Metadata } from "next";
import "./globals.css";
import "@/styles/rc5-ku-refinements.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageAtmosphereShell from "@/components/PageAtmosphereShell";
import { siteUrl } from "@/lib/utils";
import { organizationSchema } from "@/lib/schema";
import { getTipCategories } from "@/services/tips";
import { getNavigationItems } from "@/services/navigation";
import { safeJsonLd } from "@/lib/jsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "WillitFit — Know Before You Go",
    template: "%s | WillitFit",
  },
  description:
    "Check whether your cabin bag, backpack, or personal item meets airline baggage size limits in seconds — free, no sign-up.",
  icons: { icon: "/assets/logo/logo.svg" },
  openGraph: {
    type: "website",
    siteName: "WillitFit",
    title: "WillitFit — Know Before You Go",
    description:
      "Check whether your cabin bag, backpack, or personal item meets airline baggage size limits in seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WillitFit — Know Before You Go",
    description: "Check airline cabin baggage size limits in seconds.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [tipCategories, navigationItems] = await Promise.all([
    getTipCategories(),
    getNavigationItems(),
  ]);

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="wf-skip-link">Skip to main content</a>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema()) }}
        />
        <Header tipCategories={tipCategories} navigationItems={navigationItems} />
        <PageAtmosphereShell>
          <main id="main-content">{children}</main>
        </PageAtmosphereShell>
        <Footer />
      </body>
    </html>
  );
}
