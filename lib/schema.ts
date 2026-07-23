import { Airline, FaqItem } from "@/types";
import { airlineHasBagType } from "./dimensions";
import { siteUrl } from "./utils";

export function faqSchema(items: FaqItem[]) {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: siteUrl(crumb.path),
    })),
  };
}

export function airlineFaq(airline: Airline): FaqItem[] {
  return [
    ...(airlineHasBagType(airline, "cabinBag") ? [{
      question: `What is ${airline.airlineName}'s cabin bag size limit?`,
      answer: `${airline.airlineName} allows cabin bags up to ${airline.cabinBag.heightCm} × ${airline.cabinBag.widthCm} × ${airline.cabinBag.depthCm} cm.`,
    }] : []),
    ...(airlineHasBagType(airline, "personalItem") ? [{
      question: `What is ${airline.airlineName}'s personal item size limit?`,
      answer: `${airline.airlineName} allows a personal item up to ${airline.personalItem.heightCm} × ${airline.personalItem.widthCm} × ${airline.personalItem.depthCm} cm.`,
    }] : []),
    ...(airline.weightLimitKg && airlineHasBagType(airline, "cabinBag") ? [{
      question: `Is there a weight limit for cabin bags on ${airline.airlineName}?`,
      answer: `The reference allowance lists a cabin bag weight limit of ${airline.weightLimitKg} kg. Confirm the limit shown on your booking before travel.`,
    }] : []),
    ...(airline.fareClasses.length > 1 ? [{
      question: `Does ${airline.airlineName}'s baggage allowance change by fare?`,
      answer: `Yes. ${airline.airlineName} has multiple published fare or option allowances. Select the option that matches your booking when using the checker.`,
    }] : []),
    {
      question: `Do wheels and handles count in ${airline.airlineName}'s bag dimensions?`,
      answer: "Measure the complete packed bag, including wheels, handles and external pockets. The bag may need to fit fully inside an airport sizer.",
    },
  ];
}

export function airlineWebPageSchema(airline: Airline) {
  const url = siteUrl(`/${airline.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${airline.airlineName} cabin bag size guide`,
    description: `Check ${airline.airlineName} cabin bag and personal item sizes before you fly.`,
    url,
    isPartOf: { "@type": "WebSite", name: "WillItFit", url: siteUrl() },
    about: { "@type": "Organization", name: airline.airlineName },
    ...(airline.lastUpdated ? { dateModified: airline.lastUpdated } : {}),
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WillItFit",
    url: siteUrl(),
    slogan: "Know Before You Go",
  };
}
