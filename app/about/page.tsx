import type { Metadata } from "next";
import { getRuntimeContent } from "@/services/runtimeContent";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our data",
  description: "How WillItFit sources and maintains airline baggage allowance data.",
};

export default async function AboutPage() {
  const { content, source } = await getRuntimeContent({ module: "About", page: "about" });
  const heading = content[0]?.title || "Where our data comes from";

  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">{heading}</h1>
      <div className="mt-6 space-y-6 font-body text-navy-600">
        {content.map((section, index) => (
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
      <p className="mt-8 font-body text-xs text-navy-300">
        Content source: {source === "sheet" ? "governed runtime content" : "bundled fallback"}.
      </p>
    </section>
  );
}
