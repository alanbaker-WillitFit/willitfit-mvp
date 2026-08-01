import type { Metadata } from "next";
import SizeGuidePage from "@/components/size-guides/SizeGuidePage";
import { getCheckedSizeGuide } from "@/services/sizeGuides";
import { getAffiliateSlots } from "@/services/runtimeAffiliates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Checked Bag Size Guide by Airline",
  description:
    "Compare fixed checked baggage dimensions and published linear-total size rules by airline. Check your exact allowance with WillItFit before you travel.",
  alternates: { canonical: "/size-guides/checked-bag" },
};

export default async function CheckedBagSizeGuidePage() {
  const [{ groups, source }, { slots }] = await Promise.all([
    getCheckedSizeGuide(),
    getAffiliateSlots(),
  ]);

  return (
    <SizeGuidePage
      title="Checked Bag Size Guide"
      intro="Compare the checked baggage size rules used by different airlines."
      bagImageSrc="/assets/icons/cabin-bag-measurement-rc4.jpg"
      bagImageAlt="Checked suitcase with height, width and depth measurement arrows."
      imageScale="zoomed"
      sectionTitle="Common Checked Bag Size Rules"
      bagTypeQuery="checkedBag"
      checkerLabel="Check My Checked Bag"
      groups={groups}
      affiliateSlots={slots}
      source={source}
    />
  );
}
