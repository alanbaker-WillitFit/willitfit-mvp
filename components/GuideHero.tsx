import Image from "next/image";

export default function GuideHero({
  eyebrow,
  title,
  description,
  note,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <section className="grid min-h-[360px] items-center gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex min-h-[280px] flex-col justify-center">
        <p className="font-body text-sm font-bold uppercase tracking-wide text-green-600">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-navy-700">{title}</h1>
        <p className="mt-4 max-w-2xl font-body text-lg leading-8 text-navy-500">{description}</p>
        {note ? <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-navy-400">{note}</p> : null}
      </div>
      <div className="wf-card flex h-[320px] items-center justify-center overflow-hidden p-6">
        <Image src={image} alt={imageAlt} width={420} height={420} className="max-h-[280px] max-w-full object-contain" priority />
      </div>
    </section>
  );
}
