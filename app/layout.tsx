import type { Metadata } from "next";
import { Poppins, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteUrl } from "@/lib/utils";
import { organizationSchema } from "@/lib/schema";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "WillItFit — Know Before You Go",
    template: "%s | WillItFit",
  },
  description:
    "Check whether your cabin bag, backpack, or personal item meets airline baggage size limits in seconds — free, no sign-up.",
  openGraph: {
    type: "website",
    siteName: "WillItFit",
    title: "WillItFit — Know Before You Go",
    description:
      "Check whether your cabin bag, backpack, or personal item meets airline baggage size limits in seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WillItFit — Know Before You Go",
    description: "Check airline cabin baggage size limits in seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
