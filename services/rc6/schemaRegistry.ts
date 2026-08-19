import type { Rc6DatasetName } from "./runtimeContract";

export type Rc6Schema = Readonly<{
  requiredHeaders: readonly string[];
  optionalHeaders?: readonly string[];
}>;

export const RC6_SCHEMA_REGISTRY: Readonly<Partial<Record<Rc6DatasetName, Rc6Schema>>> = Object.freeze({
  settings: {
    requiredHeaders: ["Review Status", "Control Field", "Value", "Source Rule"],
    optionalHeaders: ["Publish", "Active", "Footer Label", "Runtime Target"],
  },
  airlines: {
    requiredHeaders: [
      "Airline ID",
      "Airline Name",
      "IATA Code",
      "Search Terms",
      "Country",
      "Website URL",
      "Baggage URL",
      "Display Order",
      "Active",
      "Review Status",
      "Last Reviewed",
      "Publish",
    ],
    optionalHeaders: ["Logo Reference", "Notes"],
  },
  airlineRules: {
    requiredHeaders: [
      "Rule ID",
      "Airline ID",
      "Fare",
      "Bag Type",
      "Length cm",
      "Width cm",
      "Depth cm",
      "Weight kg",
      "Linear Size cm",
      "Source Reference",
      "Last Checked",
      "Review Status",
      "Publish",
      "Sizing Method",
      "Limit Operator",
    ],
    optionalHeaders: [
      "Wheels Included",
      "Handles Included",
      "Fits Under Seat",
      "Soft Bag Guidance",
      "Rule Wording",
      "Notes",
    ],
  },
  navigation: {
    requiredHeaders: ["Link ID", "Label", "URL", "Display Order", "Open in New Tab", "Active", "Publish"],
    optionalHeaders: ["Notes"],
  },
  seoPages: {
    requiredHeaders: ["SEO ID", "Page Type", "Parent ID", "Slug", "Page Title", "Meta Title", "Meta Description", "H1", "Canonical URL", "Active", "Review Status", "Publish"],
    optionalHeaders: ["Intro Copy", "Search Terms", "Last Reviewed", "Notes"],
  },
  specialBaggageAll: {
    requiredHeaders: [
      "Item ID",
      "Item Rank",
      "Category",
      "Item Name",
      "Handling Classification",
      "Special Handling Guidance",
      "Advance Notification Usually Required",
      "Special Packaging Usually Required",
      "Battery or Dangerous Goods Consideration",
      "Mobility or Medical Equipment",
      "Airline-Level Validation Required",
      "Result Category",
      "Review Status",
      "Publish",
    ],
    optionalHeaders: ["Item Subtype", "Typical Shape", "Last Reviewed", "Notes"],
  },
  specialBaggageResults: {
    requiredHeaders: [
      "Result ID",
      "Result Rank",
      "Result Category",
      "Linked Item IDs",
      "Result Title",
      "Result Summary",
      "Preparation Guidance",
      "Fee Guidance",
      "Policy Link Label",
      "Policy Link Source",
      "Mobility or Medical Result",
      "Review Status",
      "Publish",
    ],
    optionalHeaders: ["Notes"],
  },
  countries: {
    requiredHeaders: ["Country_ID", "Country_Name", "Country_Slug", "ISO2_Code", "ISO3_Code", "Region", "Subregion"],
    optionalHeaders: ["Flag_Code", "Search_Terms", "Page_Title", "Meta_Title", "Meta_Description", "Intro_Text"],
  },
  countryFacts: {
    requiredHeaders: ["Country_ID"],
    optionalHeaders: ["Power_Title", "Connectivity_Title", "Money_Title", "Entry_Title", "Weather_Title", "Language_Title", "Driving_Title", "Time_Title", "Insurance_Title"],
  },
  redirects: {
    requiredHeaders: ["Redirect ID", "Old Path", "New Path", "Redirect Type", "Reason", "Active", "Review Status"],
    optionalHeaders: ["Last Reviewed", "Notes"],
  },
});

export function validateRc6Headers(name: Rc6DatasetName, headers: readonly string[]): { valid: boolean; missing: string[] } {
  const schema = RC6_SCHEMA_REGISTRY[name];
  if (!schema) return { valid: true, missing: [] };
  const present = new Set(headers.map((header) => header.trim()));
  const missing = schema.requiredHeaders.filter((header) => !present.has(header));
  return { valid: missing.length === 0, missing };
}
