import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const repoRoot = process.cwd();
const source = process.argv[2] ||
  "C:\\Users\\alanb\\Documents\\Codex\\WillitFit_Master\\WillitFit_Master New\\WillItFit_Content_Engine_RC15.3_RC3_Certified_Production_Mother.xlsx";
const outputDir = path.join(repoRoot, "artifacts", "rc4");

if (!fs.existsSync(source)) throw new Error(`Mother workbook not found: ${source}`);
fs.mkdirSync(outputDir, { recursive: true });

const mother = XLSX.readFile(source, { cellDates: true });
const invalidLegacySheetNames = mother.SheetNames.filter((name) => name.length > 31);
for (const name of invalidLegacySheetNames) {
  const replacement = name === "64_Audit_04_Relationship_Integrity"
    ? "64_Audit_04_Relationships"
    : name.slice(0, 31);
  mother.Sheets[replacement] = mother.Sheets[name];
  delete mother.Sheets[name];
  mother.SheetNames = mother.SheetNames.map((sheetName) => sheetName === name ? replacement : sheetName);
}
const siteContentHeaders = [
  "ContentID", "Module", "Page", "Section", "Content Type", "Title", "Content",
  "Supporting Text", "Priority", "Active", "Review Status", "Publish", "Notes",
];
const siteContentRows = [
  ["ABOUT-INTRO-001", "About", "about", "Introduction", "Section", "Know before you go", "WillItFit helps travellers compare their bag with published airline allowances.", "", 10, "Active", "Published", "Yes", "Sample governed fallback-equivalent content"],
  ["NOTICE-CABIN-001", "Notices", "checker", "cabinBag-unavailable", "Notice", "Cabin bag data unavailable", "A published cabin-bag allowance is not available for this airline. You can still check the available personal-item allowance.", "", 10, "Active", "Published", "Yes", "No airline dimensions asserted"],
  ["NOTICE-PERSONAL-001", "Notices", "checker", "personalItem-unavailable", "Notice", "Personal-item data unavailable", "A published personal-item allowance is not available for this airline. You can still check the available cabin-bag allowance.", "", 20, "Active", "Published", "Yes", "No airline dimensions asserted"],
  ["HINT-PRECHECK-001", "Hints", "checker", "pre-check", "Hint", "Measure the widest points", "Include wheels, handles and external pockets when measuring.", "", 10, "Active", "Published", "Yes", ""],
  ["FAQ-MISSING-001", "FAQs", "ask", "general", "FAQ", "Why is one baggage type unavailable?", "WillItFit does not invent an allowance. A missing type remains disabled while any verified type stays usable.", "", 10, "Active", "Published", "Yes", ""],
  ["AFFILIATE-PLACEHOLDER-001", "Affiliate Products", "products", "placeholder", "Placeholder", "Recommendation coming soon", "This governed slot is ready for a verified product.", "", 10, "Active", "Published", "Yes", "Contains no product or affiliate claim"],
  ["TIP-SAMPLE-001", "Travel Tips", "tips", "packing", "Tip", "Measure before you leave", "Measure your bag after packing because pockets and soft sides can expand.", "", 10, "Active", "Review", "No", "Sample remains unpublished until approved"],
];
const labHeaders = [
  "ConfigID", "GameID", "Game Name", "Game Path", "Trigger Date",
  "Invitation Title", "Invitation Body", "CTA",
  "Active", "Review Status", "Publish", "Notes",
];
const labRows = [
  [
    "LAB-WILLITFLY-001", "willitfly", "WillItFly", "/lab/index.html", "2026-06-15",
    "Play WillItFly", "Take a one-tap flight through the airport in the original WillIt Lab game.",
    "Play WillItFly", "Active", "Published", "Yes", "Original Flappy-style game",
  ],
];

function replaceSheet(workbook, name, headers, rows) {
  if (workbook.SheetNames.includes(name)) {
    workbook.SheetNames = workbook.SheetNames.filter((sheetName) => sheetName !== name);
    delete workbook.Sheets[name];
  }
  workbook.SheetNames.push(name);
  workbook.Sheets[name] = XLSX.utils.aoa_to_sheet([headers, ...rows]);
}

function ensureColumns(workbook, name, columns) {
  const sheet = workbook.Sheets[name];
  if (!sheet) return;
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (matrix.length === 0) matrix.push([]);
  const headers = matrix[0].map((value) => String(value));
  for (const column of columns) if (!headers.includes(column)) headers.push(column);
  matrix[0] = headers;
  workbook.Sheets[name] = XLSX.utils.aoa_to_sheet(matrix);
}

replaceSheet(mother, "90_Site_Content", siteContentHeaders, siteContentRows);
replaceSheet(mother, "91_Lab_Config", labHeaders, labRows);
replaceSheet(mother, "00_RC4_Migration_Readme",
  ["RC4 migration note", "Value"],
  [
    ["Source Mother", source],
    ["Live Google Sheet modified", "No"],
    ["Legacy tab renamed in this local copy only", "64_Audit_04_Relationship_Integrity → 64_Audit_04_Relationships"],
    ["Canonical new runtime tabs", "90_Site_Content, 91_Lab_Config"],
  ],
);
ensureColumns(mother, "10_Products", [
  "Affiliate Slot ID", "Slot Position", "Product Title", "Merchant", "Affiliate URL",
  "Image URL", "CTA", "Price Text", "Disclosure", "Active", "Review Status", "Publish", "Last Reviewed",
]);
ensureColumns(mother, "09_Affiliate_Products", [
  "Affiliate Slot ID", "Slot Position", "Product Title", "Merchant", "Affiliate URL",
  "Image URL", "CTA", "Price Text", "Disclosure", "Active", "Review Status", "Publish", "Last Reviewed",
]);

const motherOutput = path.join(outputDir, "WillItFit_Mother_RC4_Migration.xlsx");
XLSX.writeFile(mother, motherOutput);

const runtime = XLSX.utils.book_new();
const runtimeTabs = [
  "01_Airlines", "02_Baggage_Rules", "06_Travel_Tips", "07_Poll_Questions",
  "08_SEO_Pages", "09_Affiliate_Products", "82_Affiliate_Intent_Map",
  "83_Affiliate_Rules", "84_Recommendation_Cards", "90_Site_Content", "91_Lab_Config",
];
for (const name of runtimeTabs) {
  if (!mother.Sheets[name]) continue;
  runtime.SheetNames.push(name);
  runtime.Sheets[name] = mother.Sheets[name];
}
const runtimeOutput = path.join(outputDir, "WillItFit_Runtime_RC4_Template.xlsx");
XLSX.writeFile(runtime, runtimeOutput);

console.log(JSON.stringify({ source, motherOutput, runtimeOutput, liveSheetModified: false }, null, 2));
