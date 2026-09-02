import type { ReactNode } from "react";

export type FactCardItem = {
  id: string;
  title: string;
  value?: string;
  summary?: string;
  icon?: ReactNode;
  meta?: string;
};

type FactCardGridProps = {
  items: FactCardItem[];
};

export default function FactCardGrid({ items }: FactCardGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            {item.icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy-800" aria-hidden="true">
                {item.icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-heading text-base font-semibold text-navy-800">{item.title}</h3>
              {item.value && <p className="mt-1 text-2xl font-bold tracking-tight text-navy-900">{item.value}</p>}
              {item.summary && <p className="mt-2 text-sm leading-6 text-navy-600">{item.summary}</p>}
              {item.meta && <p className="mt-2 text-xs text-navy-500">{item.meta}</p>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
