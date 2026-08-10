import type { Metadata } from "next";
import "./globals.css";
import WillItFlyHeader from "@/components/fly/WillItFlyHeader";
import WillItFlyFooter from "@/components/fly/WillItFlyFooter";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";

export const metadata: Metadata = {
  title: {
    default: "WillItFly — Know Before You Go",
    template: "%s | WillItFly",
  },
  description: "Practical destination guidance for travellers. Know before you go.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const bundle = await getWillItFlyRuntimeBundle();

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="wf-skip-link">Skip to main content</a>
        <WillItFlyHeader routes={bundle.navigationRoutes} />
        <main id="main-content">{children}</main>
        <WillItFlyFooter />
      </body>
    </html>
  );
}
