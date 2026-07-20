import type { ReactNode } from "react";

export default function PolicyPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <article className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">{title}</h1>
      <p className="mt-4 font-body text-lg leading-relaxed text-navy-600">{intro}</p>
      <div className="mt-8 space-y-6 font-body leading-7 text-navy-600">{children}</div>
    </article>
  );
}
