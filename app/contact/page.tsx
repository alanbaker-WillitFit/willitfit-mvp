import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the WillitFit team.",
};

export default function ContactPage() {
  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Get in touch</h1>
      <p className="mt-6 font-body text-navy-600">
        Spotted an airline allowance that&apos;s out of date, or want to suggest a feature? Email{" "}
        <a href="mailto:hello@willitfit.com" className="text-green-600 underline">
          hello@willitfit.com
        </a>{" "}
        and we&apos;ll get back to you.
      </p>
    </section>
  );
}
