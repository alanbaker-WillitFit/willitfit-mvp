import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the WillItFly team.",
};

export default function ContactPage() {
  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Get in touch</h1>
      <p className="mt-6 font-body text-navy-600">
        If you spot destination information that needs review or want to suggest a WillItFly improvement, use the published contact channel for the service.
      </p>
    </section>
  );
}
