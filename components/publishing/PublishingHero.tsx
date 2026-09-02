import Link from "next/link";
import type { PublishingHeroV1 } from "@/lib/publishing/contracts";

type PublishingHeroProps = {
  hero: PublishingHeroV1;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  assetUrl: string;
};

export default function PublishingHero({ hero, breadcrumbs = [], assetUrl }: PublishingHeroProps) {
  const overlay =
    hero.overlay === "dark-left"
      ? "linear-gradient(90deg, rgba(13,27,61,.94) 0%, rgba(13,27,61,.76) 33%, rgba(13,27,61,.18) 63%, rgba(13,27,61,0) 78%)"
      : hero.overlay === "light-left"
        ? "linear-gradient(90deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.82) 36%, rgba(255,255,255,.14) 67%, rgba(255,255,255,0) 82%)"
        : "none";

  const darkCopy = hero.overlay === "light-left";

  return (
    <section
      className="relative isolate min-h-[390px] overflow-hidden bg-navy-900 sm:min-h-[440px] lg:min-h-[500px]"
      aria-labelledby="publishing-hero-title"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(assetUrl).slice(1, -1)})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0" style={{ background: overlay }} aria-hidden="true" />

      <div className="wf-container relative z-10 flex min-h-[390px] flex-col py-8 sm:min-h-[440px] lg:min-h-[500px] lg:py-10">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className={`text-sm ${darkCopy ? "text-navy-700" : "text-white/90"}`}>
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">›</span>}
                  {item.href ? (
                    <Link href={item.href} className="underline-offset-4 hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="my-auto max-w-2xl py-10">
          {hero.eyebrow && (
            <p className={`mb-3 text-sm font-semibold uppercase tracking-[0.16em] ${darkCopy ? "text-navy-600" : "text-white/80"}`}>
              {hero.eyebrow}
            </p>
          )}
          <h1
            id="publishing-hero-title"
            className={`font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl ${darkCopy ? "text-navy-800" : "text-white"}`}
          >
            {hero.title}
          </h1>
          {hero.summary && (
            <p className={`mt-5 max-w-xl text-base leading-7 sm:text-lg ${darkCopy ? "text-navy-700" : "text-white/90"}`}>
              {hero.summary}
            </p>
          )}
          {hero.primaryCtaLabel && hero.primaryCtaHref && (
            <Link
              href={hero.primaryCtaHref}
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 font-semibold text-navy-800 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {hero.primaryCtaLabel}
              <span className="ml-3" aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
