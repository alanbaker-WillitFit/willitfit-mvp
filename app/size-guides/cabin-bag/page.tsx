import type { Metadata } from "next";
import SizeGuidePage from "@/components/size-guides/SizeGuidePage";
import { getSizeGuide } from "@/services/sizeGuides";
import { getAffiliateSlots } from "@/services/runtimeAffiliates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cabin Bag Size Guide by Airline",
  description:
    "Compare common cabin bag dimensions and see which airlines use each size. Check your exact allowance with WillItFit before you travel.",
  alternates: { canonical: "/size-guides/cabin-bag" },
};

export default async function CabinBagSizeGuidePage() {
  const [{ groups, source }, { slots }] = await Promise.all([
    getSizeGuide("cabinBag"),
    getAffiliateSlots(),
  ]);

  return (
    <SizeGuidePage
      title="Cabin Bag Size Guide"
      intro="Find which airlines use the same cabin bag dimensions."
      bagImageSrc="/assets/icons/cabin-bag-measurement-rc4.jpg"
      bagImageAlt="Cabin suitcase with height, width and depth measurement arrows."
      sectionTitle="Most Common Cabin Bag Sizes"
      bagTypeQuery="cabinBag"
      checkerLabel="Check My Cabin Bag"
      groups={groups}
      affiliateSlots={slots}
      source={source}
    />
  );
}
