import type { Metadata } from "next";
import { getAboutContent } from "@/services/about";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our data",
  description: "How WillItFit sources and maintains airline baggage allowance data.",
};

export default async function AboutPage() {
  const about = await getAboutContent();

  if (!about) {
    return (
      <section className="wf-container wf-container--narrow wf-section">
        <h1 className="font-heading text-3xl font-semibold text-navy-700">Our data</h1>
        <p className="mt-6 font-body text-navy-600">
          This information is temporarily unavailable while its governed content is being reviewed.
        </p>
      </section>
    );
  }

  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">{about.heading}</h1>
      <div className="mt-6 space-y-6 font-body text-navy-600">
        {about.sections.map((section, index) => (
          <section key={section.contentId} aria-labelledby={index > 0 ? `about-section-${index}` : undefined}>
            {index > 0 && (
              <h2 id={`about-section-${index}`} className="font-heading text-xl font-semibold text-navy-700">
                {section.title}
              </h2>
            )}
            <p className={index > 0 ? "mt-2" : ""}>{section.body}</p>
            {section.supportingText && <p className="mt-2 text-sm text-navy-400">{section.supportingText}</p>}
          </section>
        ))}
      </div>
    </section>
  );
}
