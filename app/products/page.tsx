import type { Metadata } from "next";
import TravelEssentials from "@/components/TravelEssentials";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Travel essentials",
  description: "Practical travel products picked to help your bag pass the sizer and your trip go smoothly.",
};

export default function ProductsIndexPage() {
  return (
    <section className="wf-container wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Travel essentials</h1>
      <p className="mt-3 max-w-2xl font-body text-navy-500">
        Explore the categories we are preparing to help you travel smarter.
      </p>
      <div className="mt-8"><TravelEssentials heading={false} /></div>
    </section>
  );
}
