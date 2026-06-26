import { Airline, FaqItem } from "@/types";
import { siteUrl } from "./utils";

export function faqSchema(items: FaqItem[]) {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
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
    {
      question: `What is ${airline.airlineName}'s cabin bag size limit?`,
      answer: `${airline.airlineName} allows cabin bags up to ${airline.cabinBag.heightCm} × ${airline.cabinBag.widthCm} × ${airline.cabinBag.depthCm} cm.`,
    },
    {
      question: `What is ${airline.airlineName}'s personal item size limit?`,
      answer: `${airline.airlineName} allows a personal item up to ${airline.personalItem.heightCm} × ${airline.personalItem.widthCm} × ${airline.personalItem.depthCm} cm.`,
    },
    ...(airline.weightLimitKg
      ? [
          {
            question: `Is there a weight limit for cabin bags on ${airline.airlineName}?`,
            answer: `Yes — ${airline.airlineName} enforces a cabin bag weight limit of ${airline.weightLimitKg} kg.`,
          },
        ]
      : []),
  ];
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
