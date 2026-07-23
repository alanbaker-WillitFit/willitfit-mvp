export const REQUIRED_SHEET_HEADERS: Record<string, readonly string[]> = {
  "01_Airlines": [
    "AirlineID", "AirlineName", "Slug", "OfficialBaggageURL", "Status", "LastChecked",
  ],
  "02_Baggage_Rules": [
    "RuleID", "AirlineID", "FareClass", "BagType", "HeightCm", "WidthCm", "DepthCm", "Status",
  ],
  "06_Travel_Tips": [
    "TipID", "Title", "Slug", "Content", "Category", "Status",
  ],
  "07_Poll_Questions": [
    "Question", "OptionA", "OptionB", "Status",
  ],
  "08_SEO_Pages": [
    "PageSlug", "Title", "MetaDescription", "H1", "BodyContent", "Status",
  ],
  "09_Affiliate_Products": [
    "AffiliateID", "Brand", "Product", "Category", "AffiliateURL", "Status",
  ],
  "90_Site_Content": [
    "ContentID", "Module", "Page", "Section", "Content Type", "Title", "Content",
    "Priority", "Active", "Review Status", "Publish",
  ],
  "91_Lab_Config": [
    "ConfigID", "GameID", "Game Name", "Game Path", "Trigger Date",
    "Active", "Review Status", "Publish",
  ],

  "73_QE_Canonical_Map": [
    "Question_ID", "Canonical_Question", "Answer_Object_ID", "Destination_URL", "Pass_3_Status", "Pass_4_Status",
  ],
  "75_QE_Answer_Architecture": [
    "Answer_Object_ID", "Question_ID", "Canonical_Question", "Slug", "Destination_URL", "Quick_Answer", "Detailed_Answer", "Publish_Eligibility",
  ],
  "77_QE_Result_Routing": [
    "Routing_ID", "Question_ID", "Answer_Object_ID", "Show_On_Fit", "Show_On_Close", "Show_On_Fail", "Display_Priority", "Pass_4_Status",
  ],
  "78_QE_Result_Trigger_Matrix": [
    "Trigger_ID", "Input_Field", "Operator", "Applies_To_Result", "Governance_Status",
  ],
  "82_Affiliate_Intent_Map": [
    "Intent_ID", "Question_ID", "Canonical_Intent", "Affiliate_Category", "Recommendation_Goal", "Eligible_Context", "Priority", "Disclosure_Rule", "Status",
  ],
  "83_Affiliate_Rules": [
    "Rule_ID", "Intent_ID", "Result_State", "Recommendation_Goal", "Product_Category", "Card_ID", "Priority", "Enabled", "Decision_Outcome",
  ],
  "84_Recommendation_Cards": [
    "Card_ID", "Card_Name", "Headline_Pattern", "CTA_Text", "Display_Context", "Max_Products", "Disclosure_Position", "Status",
  ],
};

export type HeaderValidation = {
  headers: string[];
  missingHeaders: string[];
  duplicateHeaders: string[];
  valid: boolean;
};

export function validateSheetHeaders(
  tabName: string,
  rawHeaders: readonly unknown[]
): HeaderValidation {
  const headers = rawHeaders.map((header) => String(header ?? "").trim()).filter(Boolean);
  const counts = new Map<string, number>();

  for (const header of headers) {
    counts.set(header, (counts.get(header) ?? 0) + 1);
  }

  const duplicateHeaders = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([header]) => header)
    .sort();

  const required = REQUIRED_SHEET_HEADERS[tabName] ?? [];
  const headerSet = new Set(headers);
  const missingHeaders = required.filter((header) => !headerSet.has(header));

  return {
    headers,
    missingHeaders,
    duplicateHeaders,
    valid: missingHeaders.length === 0 && duplicateHeaders.length === 0,
  };
}
