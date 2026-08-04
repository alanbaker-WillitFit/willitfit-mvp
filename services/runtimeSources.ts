// RC5 canonical runtime tab names.
//
// The isolated RC5 runtime is a full Mother-derived baseline. These canonical
// tabs mirror the approved Mother output names. Core modules must fail closed
// when a required tab is missing or invalid rather than traversing legacy RC4
// compact-runtime aliases.
export const RUNTIME_TABS = {
  airlines: ["02_Airlines"],
  baggageRules: ["03_Airline Rules"],
  specialBaggageResults: ["04.1_Special Baggage Results"],
  tips: ["06_Tips"],
  faqs: ["05_FAQs"],
  siteContent: ["07_Site Content"],
  articles: ["08.2_Articles"],
  articleSections: ["08.2.1_Article_Sections"],
  affiliateProducts: ["09_Affiliate_Placements"],
  labConfig: ["10_Lab"],
} as const;

export const AIRLINE_TABS = RUNTIME_TABS.airlines;
export const BAGGAGE_RULE_TABS = RUNTIME_TABS.baggageRules;
export const SPECIAL_BAGGAGE_RESULT_TABS = RUNTIME_TABS.specialBaggageResults;
export const TIP_TABS = RUNTIME_TABS.tips;
export const FAQ_TABS = RUNTIME_TABS.faqs;
export const SITE_CONTENT_TABS = RUNTIME_TABS.siteContent;
export const ARTICLE_TABS = RUNTIME_TABS.articles;
export const ARTICLE_SECTION_TABS = RUNTIME_TABS.articleSections;
export const AFFILIATE_PRODUCT_TABS = RUNTIME_TABS.affiliateProducts;
export const LAB_CONFIG_TABS = RUNTIME_TABS.labConfig;
