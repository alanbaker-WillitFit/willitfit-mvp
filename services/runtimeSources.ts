// Canonical runtime tab names must remain first. Later entries are legacy aliases
// tried only when the preceding tab cannot be read. An accessible empty canonical
// tab remains authoritative and stops alias traversal.
export const RUNTIME_TABS = {
  airlines: ["02_Airlines", "01_Airlines"],
  baggageRules: ["03_Airline Rules", "02_Baggage_Rules"],
  tips: ["06_Tips", "06_Travel_Tips", "Content Engine"],
  faqs: ["05_FAQs"],
  siteContent: ["07_Site Content", "90_Site_Content", "Site Content", "10_Site_Content"],
  affiliateProducts: ["09_Affiliates", "09_Affiliate_Products", "Affiliate Products"],
  labConfig: ["10_Lab", "91_Lab_Config", "Lab configuration"],
} as const;

export const AIRLINE_TABS = RUNTIME_TABS.airlines;
export const BAGGAGE_RULE_TABS = RUNTIME_TABS.baggageRules;
export const TIP_TABS = RUNTIME_TABS.tips;
export const FAQ_TABS = RUNTIME_TABS.faqs;
export const SITE_CONTENT_TABS = RUNTIME_TABS.siteContent;
export const AFFILIATE_PRODUCT_TABS = RUNTIME_TABS.affiliateProducts;
export const LAB_CONFIG_TABS = RUNTIME_TABS.labConfig;
