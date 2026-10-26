import type { FaqItem } from "@/types";

export default function FAQSection({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="wf-card wf-card--compact divide-y divide-navy-100 p-0">
      {items.map((item, i) => (
        <details key={item.question} id={`faq-${i + 1}`} className="group" open={i === 0}>
          <summary className="wf-interactive flex cursor-pointer items-center justify-between px-5 py-4 text-left font-body text-sm font-semibold text-navy-700">
            <span>{item.question}</span>
            <span aria-hidden="true" className="ml-3 text-navy-400 group-open:rotate-180">⌄</span>
          </summary>
          <p className="px-5 pb-4 font-body text-sm text-navy-500">{item.answer}</p>
          <a href={`#faq-${i + 1}`} className="ml-5 mb-4 inline-block font-body text-xs text-green-700 underline">Link to this answer</a>
        </details>
      ))}
    </div>
  );
}
