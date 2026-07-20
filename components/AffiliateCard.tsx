import Image from "next/image";
import { AffiliateLink } from "@/types";

export default function AffiliateCard({ link, ctaText = "View product" }: { link: AffiliateLink; ctaText?: string }) {
  return (
    <a
      href={link.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="wf-card wf-card--compact overflow-hidden p-0"
    >
      {link.imageUrl ? (
        <div className="relative h-36 w-full">
          <Image src={link.imageUrl} alt={link.product} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-36 w-full bg-navy-50" />
      )}
      <div className="p-4">
        <span className="font-body text-xs font-semibold uppercase tracking-wide text-navy-300">
          {link.brand}
        </span>
        <h4 className="mt-1 font-heading text-sm font-semibold text-navy-700">{link.product}</h4>
        <span className="mt-2 inline-block font-body text-sm font-semibold text-green-600">
          {ctaText} →
        </span>
      </div>
    </a>
  );
}
