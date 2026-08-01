import type { Metadata } from "next";
import SizeGuidePage from "@/components/size-guides/SizeGuidePage";
import { getSizeGuide } from "@/services/sizeGuides";
import { getAffiliateSlots } from "@/services/runtimeAffiliates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Personal Item Size Guide by Airline",
  description:
    "Compare common personal item and under-seat bag dimensions by airline. Check your exact allowance with WillItFit before you travel.",
  alternates: { canonical: "/size-guides/personal-item" },
};

export default async function PersonalItemSizeGuidePage() {
  const [{ groups, source }, { slots }] = await Promise.all([
    getSizeGuide("personalItem"),
    getAffiliateSlots(),
  ]);

  return (
    <SizeGuidePage
      title="Personal Item Size Guide"
      intro="Find which airlines use the same personal item dimensions."
      bagImageSrc="/assets/icons/personal-item-photo-rc4.jpg"
      bagImageAlt="White personal item travel bag shown with height, width and depth measurement guides."
      sectionTitle="Most Common Personal Item Sizes"
      bagTypeQuery="personalItem"
      checkerLabel="Check My Personal Item"
      groups={groups}
      affiliateSlots={slots}
      source={source}
    />
  );
}
