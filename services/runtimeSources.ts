// RC5 canonical runtime tab names.
//
// Core RC5 development reads only the isolated MVP runtime tabs. The RC4-era
// Mother and compact-runtime aliases are intentionally not traversed for these
// modules: a missing or invalid canonical tab must fail closed instead of
// silently loading data from an older contract.
export const RUNTIME_TABS = {
  airlines: ["01_Airlines"],
  baggageRules: ["02_Baggage_Rules"],
  tips: ["06_Travel_Tips"],

  // Deferred modules retain their existing sources until each module receives
  // an approved RC5 runtime contract and is enabled in 00_Runtime_Control.
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
