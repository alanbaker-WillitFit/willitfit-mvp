import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Airline Baggage Size Guides",
  description:
    "Compare personal item, cabin bag and checked baggage size rules by airline, then check your exact allowance with WillItFit.",
  alternates: { canonical: "/size-guides" },
};

const GUIDES = [
  {
    title: "Personal Item Size Guide",
    description: "Compare common under-seat and personal item dimensions by airline.",
    href: "/size-guides/personal-item",
    image: "/assets/icons/personal-item-photo-rc4.jpg",
    alt: "White personal item travel bag.",
  },
  {
    title: "Cabin Bag Size Guide",
    description: "Find which airlines use the same cabin bag dimensions.",
    href: "/size-guides/cabin-bag",
    image: "/assets/icons/cabin-bag-photo-rc4.jpg",
    alt: "White cabin suitcase.",
  },
  {
    title: "Checked Bag Size Guide",
    description: "Compare fixed dimensions and published linear-total checked baggage rules.",
    href: "/size-guides/checked-bag",
    image: "/assets/icons/cabin-bag-photo-rc4.jpg",
    alt: "White checked suitcase.",
  },
] as const;

export default function SizeGuidesLandingPage() {
  return (
    <div className="wf-container" style={{ padding: "3rem 0 4rem" }}>
      <header style={{ maxWidth: "48rem", margin: "0 auto 2rem", textAlign: "center" }}>
        <p style={{ margin: "0 0 .5rem", color: "#22c55e", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>Size Guides</p>
        <h1 style={{ margin: 0, color: "#0d1b3d", fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: .98, textTransform: "uppercase" }}>Airline Baggage Size Guides</h1>
        <p style={{ margin: "1rem auto 0", color: "#475569", fontSize: "1.1rem" }}>Browse common baggage dimensions by bag type, then use the checker to confirm your exact airline and fare.</p>
      </header>

      <section aria-label="Available baggage size guides" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {GUIDES.map((guide) => (
          <Link key={guide.href} href={guide.href} className="wf-card" style={{ display: "grid", gridTemplateRows: "12rem auto", overflow: "hidden", textDecoration: "none" }}>
            <span style={{ position: "relative", display: "block", background: "#f8fafc" }}>
              <Image src={guide.image} alt={guide.alt} fill sizes="(max-width: 767px) 90vw, 33vw" style={{ objectFit: "contain", padding: "1rem" }} />
            </span>
            <span style={{ display: "block", padding: "1.1rem" }}>
              <strong style={{ display: "block", color: "#0d1b3d", fontSize: "1.1rem" }}>{guide.title}</strong>
              <small style={{ display: "block", marginTop: ".45rem", color: "#475569", fontSize: ".9rem", lineHeight: 1.45 }}>{guide.description}</small>
              <span style={{ display: "inline-block", marginTop: ".8rem", color: "#15803d", fontWeight: 800 }}>View guide →</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
