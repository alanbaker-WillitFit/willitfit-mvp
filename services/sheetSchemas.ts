export const REQUIRED_SHEET_HEADERS: Record<string, readonly string[]> = {
  "02_Airlines": [
    "Airline ID", "Airline Name", "IATA Code", "Search Terms", "Country",
    "Website URL", "Baggage URL", "Logo Reference", "Display Order", "Active",
    "Review Status", "Last Reviewed", "Publish", "Notes", "WillItFit RC4",
    "WillItFit RC5", "WillItFly RC1", "Slug",
  ],
  "03_Airline Rules": [
    "Rule ID", "Airline ID", "Fare", "Bag Type", "Length cm", "Width cm",
    "Depth cm", "Weight kg", "Sizing Method", "Linear Size cm", "Limit Operator",
    "Wheels Included", "Handles Included", "Fits Under Seat", "Soft Bag Guidance",
    "Rule Wording", "Source Reference", "Last Checked", "Review Status", "Publish",
    "Notes", "Entitlement Status", "Applicability Conditions", "Weight Basis",
  ],
  "05_FAQs": [
    "FAQ ID", "Category", "Airline ID", "Fare", "Bag Type", "Question", "Answer",
    "Search Terms", "Source Reference", "Priority", "Review Status", "Last Reviewed",
    "Publish", "Notes", "WillItFit RC4", "WillItFit RC5", "WillItFly RC1",
  ],
  "06_Tips": [
    "Tip ID", "Category", "Airline ID", "Fare", "Bag Type", "Title", "Tip / Hint",
    "Context Trigger", "Search Terms", "Source Reference", "Priority", "Review Status",
    "Last Reviewed", "Publish", "Notes", "WillItFit RC4", "WillItFit RC5", "WillItFly RC1",
  ],
  "07_Site Content": [
    "Content ID", "Page", "Section", "Content Type", "Title", "Content", "Supporting Text",
    "Link Label", "Link URL", "Display Order", "Active", "Review Status", "Last Reviewed",
    "Publish", "Notes", "WillItFit RC4", "WillItFit RC5", "WillItFly RC1",
  ],
  "08_SEO Pages": [
    "SEO ID", "Page Type", "Parent ID", "Slug", "Page Title", "Meta Title",
    "Meta Description", "H1", "Intro Copy", "Canonical URL", "Search Terms", "Active",
    "Review Status", "Last Reviewed", "Publish", "Notes",
  ],
  "09_Affiliate_Placements": [
    "Product Name", "Affiliate ID", "Destination URL", "Affiliate_Programme_ID", "Category",
    "Merchant", "Target_Type", "Target_Reference", "Slot Position", "Subject_Context",
    "Supporting_Line", "Product_Description", "Image URL", "Disclosure", "Display Order",
    "Active", "Review Status", "Last_Reviewed", "Product_Scope", "Notes", "Publish", "Badge",
  ],
  "10_Lab": [
    "Lab ID", "Trigger Type", "Trigger Value", "Destination", "Invitation Message", "Clue Text",
    "Start Date", "End Date", "Priority", "Active", "Review Status", "Last Reviewed", "Publish",
    "Notes", "WillItFit RC4", "WillItFit RC5", "WillItFly RC1",
  ],
};

export type HeaderValidation = {
  headers: string[];
  missingHeaders: string[];
  duplicateHeaders: string[];
  unexpectedHeaders: string[];
  knownTab: boolean;
  valid: boolean;
};

export function validateSheetHeaders(
  tabName: string,
  rawHeaders: readonly unknown[]
): HeaderValidation {
  const headers = rawHeaders.map((header) => String(header ?? "").trim()).filter(Boolean);
  const counts = new Map<string, number>();

  for (const header of headers) counts.set(header, (counts.get(header) ?? 0) + 1);

  const duplicateHeaders = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([header]) => header)
    .sort();

  const required = REQUIRED_SHEET_HEADERS[tabName];
  const knownTab = Boolean(required);
  const headerSet = new Set(headers);
  const missingHeaders = required ? required.filter((header) => !headerSet.has(header)) : [];
  const requiredSet = new Set(required ?? []);
  const unexpectedHeaders = required ? headers.filter((header) => !requiredSet.has(header)) : headers;

  return {
    headers,
    missingHeaders,
    duplicateHeaders,
    unexpectedHeaders,
    knownTab,
    valid: knownTab && headers.length > 0 && missingHeaders.length === 0 && duplicateHeaders.length === 0,
  };
}
