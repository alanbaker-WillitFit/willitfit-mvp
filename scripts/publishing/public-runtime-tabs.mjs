import { readFile } from "node:fs/promises";
import { join } from "node:path";

const TRUE_VALUES = new Set(["1", "true", "yes", "y", "active", "live", "published", "approved"]);
const REVIEW_VALUES = new Set(["approved", "published", "live", "reviewed"]);
const LIVE_VALUES = new Set(["active", "live", "published", "approved", "validated", "draft"]);
const clean = (value) => String(value ?? "").trim();
const truthy = (value) => TRUE_VALUES.has(clean(value).toLowerCase());
const reviewOk = (value) => REVIEW_VALUES.has(clean(value).toLowerCase());

export const PUBLIC_RUNTIME_TAB_SPECS = {
  "02_Airlines": { file: "02_Airlines.json", required: true, fields: ["Airline ID","Airline Name","IATA Code","Search Terms","Country","Website URL","Baggage URL","Display Order","Active","Review Status","Last Reviewed","Publish"] },
  "03_Airline Rules": { file: "03_Airline_Rules.json", required: true, fields: ["Rule ID","Airline ID","Fare","Bag Type","Length cm","Width cm","Depth cm","Weight kg","Linear Size cm","Wheels Included","Handles Included","Fits Under Seat","Soft Bag Guidance","Rule Wording","Source Reference","Last Checked","Review Status","Publish","Sizing Method","Limit Operator"] },
  "04.1_Special Baggage Results": { file: "04.1_Special_Baggage_Results.json", required: false, fields: ["Result ID","Result Rank","Result Category","Linked Item IDs","Result Title","Result Summary","Preparation Guidance","Fee Guidance","Policy Link Label","Policy Link Source","Mobility or Medical Result","Review Status","Publish"] },
  "05_FAQs": { file: "05_FAQs.json", required: false, fields: ["FAQ ID","Category","Airline ID","Fare","Bag Type","Question","Answer","Search Terms","Priority","Review Status","Last Reviewed","Publish"] },
  "06_Tips": { file: "06_Tips.json", required: false, fields: ["Tip ID","Category","Airline ID","Fare","Bag Type","Title","Tip / Hint","Context Trigger","Search Terms","Priority","Review Status","Last Reviewed","Publish"] },
  "07.1_Navigation": { file: "07.1_Navigation.json", required: false, fields: ["Link ID","Label","URL","Display Order","Open in New Tab","Active","Publish"] },
  "07_Site Content": { file: "07_Site_Content.json", required: false, fields: ["Content ID","Page","Section","Content Type","Title","Content","Supporting Text","Link Label","Link URL","Display Order","Active","Review Status","Last Reviewed","Publish"] },
  "08_SEO Pages": { file: "08_SEO_Pages.json", required: false, fields: ["SEO ID","Page Type","Parent ID","Slug","Page Title","Meta Title","Meta Description","H1","Intro Copy","Canonical URL","Search Terms","Active","Review Status","Last Reviewed","Publish"] },
  "08.2_Articles": { file: "08.2_Articles.json", required: false, fields: ["Article ID","Article Type","Product Scope","Category","Topic","Slug","Headline","Short Summary","Standfirst","Article Body","Key Takeaways","Traveller Action","Published Date","Display Order","Content Status","Review Status","Active","Publish","Valid Until","Card Image Reference"] },
  "08.2.1_Article_Sections": { file: "08.2.1_Article_Sections.json", required: false, fields: ["Section ID","Article ID","Article Slug","Section Key","Section Type","Heading","Body","Supporting Text","Quote / Callout","List Items","Link Label","Link URL","Image Reference","Display Order","Active","Review Status","Publish"] },
  "08.3_Ask_Questions": { file: "08.3_Ask_Questions.json", required: false, fields: ["Question ID","Public Question","Category","Airline ID","Bag Type","Public Status","Display Order","Active","Publish","Answer Count","Closed to Answers","Last Reviewed"] },
  "08.3.1_Ask_Answers": { file: "08.3.1_Ask_Answers.json", required: false, fields: ["Answer ID","Question ID","Answer Text","Answer Source","Evidence URL","Review Status","Featured Answer","Display Order","Active","Publish","Last Reviewed"] },
  "08.4_Travel_Alerts": { file: "08.4_Travel_Alerts.json", required: false, customEligibility: "travelAlert", fields: ["Alert ID","Linked Article ID","Article Slug","Headline","Display Date / Status","Alert Level","Alert Type","Opacity 0-100","Display From","Display Until","Lifecycle Status","Priority","Home Hero Eligible","Source Publisher","Official Source URL","Source Retrieved Date","Content Status","Review Status","Active"] },
  "09_Affiliate_Placements": { file: "09_Affiliate_Placements.json", required: false, fields: ["Product Name","Product_Ref","Affiliate URL","Affiliate_Programme_ID","Category Key","Merchant","Target_Type","Target_Reference","Slot Position","Subject_Context","Supporting_Line","Product_Description","Image URL","Disclosure","Display_Order","Active","Review_Status","Last_Reviewed","Product_Scope","Publish","Badge"] },
  "10_Lab": { file: "10_Lab.json", required: false, fields: ["Lab ID","Trigger Type","Trigger Value","Destination","Invitation Message","Clue Text","Start Date","End Date","Priority","Active","Review Status","Last Reviewed","Publish"] },
  "10.1_Lab_Game_Catalogue": { file: "10.1_Lab_Game_Catalogue.json", required: false, fields: ["Game ID","Game Name","Game Path","Invitation Destination","Active","Review Status","Publish"] },
  "07_Poll_Questions": { file: "07_Poll_Questions.json", required: false, customEligibility: "statusLive", fields: ["Question","OptionA","OptionB","OptionC","OptionD","Category","Status"] },
  "82_Affiliate_Intent_Map": { file: "82_Affiliate_Intent_Map.json", required: false, customEligibility: "notArchived", fields: ["Intent_ID","Question_ID","Canonical_Intent","Affiliate_Category","Recommendation_Goal","Eligible_Context","Priority","Suppression_Rule","Disclosure_Rule","Status"] },
  "83_Affiliate_Rules": { file: "83_Affiliate_Rules.json", required: false, customEligibility: "enabled", fields: ["Rule_ID","Intent_ID","Result_State","Additional_Condition","Recommendation_Goal","Product_Category","Card_ID","Priority","Enabled","Decision_Outcome"] },
  "84_Recommendation_Cards": { file: "84_Recommendation_Cards.json", required: false, customEligibility: "statusLiveLike", fields: ["Card_ID","Card_Name","Headline_Pattern","CTA_Text","Display_Context","Max_Products","Disclosure_Position","Status"] },
  "09_Affiliate_Products": { file: "09_Affiliate_Products.json", required: false, customEligibility: "statusLive", fields: ["AffiliateID","Brand","Product","Category","AffiliateURL","ImageURL","Status","Region","Product_Attributes","Merchant_Priority","Last_Link_Check"] },
};

function rowsFrom2d(values, file) {
  if (!Array.isArray(values) || !Array.isArray(values[0])) throw new Error(`${file} must be header-first 2D JSON`);
  const [headers, ...rows] = values;
  return rows.filter((row) => Array.isArray(row) && row.some((value) => clean(value)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [clean(header), row[index] ?? ""])));
}

function defaultEligible(row) {
  const active = clean(row.Active || row["Lifecycle Status"]);
  const publish = clean(row.Publish || row["Runtime Publish Status"] || row.Published || row["Publish Status"]);
  const review = clean(row["Review Status"] || row.Review_Status || row.ReviewStatus || row["Workflow Status"]);
  const status = clean(row.Status || row["Content Status"]);
  if (active && !truthy(active)) return false;
  if (publish && !truthy(publish)) return false;
  if (review && !reviewOk(review)) return false;
  if (!active && !publish && !review && status && !TRUE_VALUES.has(status.toLowerCase())) return false;
  if (!active && !publish && !review && !status) return false;
  return true;
}

function customEligible(kind, row) {
  if (!kind) return defaultEligible(row);
  if (kind === "travelAlert") return truthy(row.Active) && ["live","active"].includes(clean(row["Lifecycle Status"]).toLowerCase()) && ["published","live","approved"].includes(clean(row["Content Status"]).toLowerCase()) && reviewOk(row["Review Status"]);
  if (kind === "statusLive") return ["live","active"].includes(clean(row.Status).toLowerCase());
  if (kind === "notArchived") return clean(row.Status).toLowerCase() !== "archived";
  if (kind === "enabled") return truthy(row.Enabled);
  if (kind === "statusLiveLike") return LIVE_VALUES.has(clean(row.Status).toLowerCase());
  return false;
}

function projectRow(row, fields) {
  const projected = {};
  for (const field of fields) if (Object.prototype.hasOwnProperty.call(row, field)) projected[field] = String(row[field] ?? "").trim();
  return projected;
}

export async function buildPublicRuntimeTabs(inputDir) {
  const tabs = {}, optionalMissing = [], sourceFiles = [];
  for (const [tabName, spec] of Object.entries(PUBLIC_RUNTIME_TAB_SPECS)) {
    const path = join(inputDir, spec.file);
    let values;
    try { values = JSON.parse(await readFile(path, "utf8")); sourceFiles.push(path); }
    catch (error) { if (error?.code === "ENOENT" && !spec.required) { tabs[tabName] = []; optionalMissing.push(tabName); continue; } throw error; }
    tabs[tabName] = rowsFrom2d(values, spec.file).filter((row) => customEligible(spec.customEligibility, row)).map((row) => projectRow(row, spec.fields));
  }
  return { tabs, optionalMissing, sourceFiles };
}
