import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WillItFly",
  description: "How WillItFly sources, governs and presents practical destination information.",
};

export default function AboutPage() {
  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">About WillItFly</h1>
      <div className="mt-6 space-y-6 font-body text-navy-600">
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">Know Before You Go</h2>
          <p className="mt-2">WillItFly is designed to make practical destination information easier to understand before you travel.</p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">Where our information comes from</h2>
          <p className="mt-2">Published destination information is read from the governed WillItFly Runtime. Source evidence, review state and publication controls sit behind the information shown in the product.</p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">What happens when information is missing</h2>
          <p className="mt-2">WillItFly does not invent missing destination facts. Where approved information is unavailable, the experience is designed to say so or direct you to an appropriate official source.</p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">Independent guidance</h2>
          <p className="mt-2">WillItFly helps organise useful travel information and next steps. Official authorities and service providers remain the final source for requirements that affect your journey.</p>
        </section>
      </div>
    </section>
  );
}
