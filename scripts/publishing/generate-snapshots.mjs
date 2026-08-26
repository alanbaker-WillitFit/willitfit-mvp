import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.length ? rest.join("=") : "true"];
  }),
);

const inputDir = resolve(args.get("input-dir") ?? "artifacts/runtime-freeze/Runtime_RC6");
const outputDir = resolve(args.get("output-dir") ?? "public/data/v1");
const generatedAt = new Date().toISOString();

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bool(value) {
  const normalised = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "active", "live", "published"].includes(normalised);
}

function numberOrUndefined(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function readTable(fileName) {
  const path = join(inputDir, fileName);
  const raw = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(raw) || raw.length === 0 || !Array.isArray(raw[0])) {
    throw new Error(`${fileName} must be a header-first two-dimensional JSON array.`);
  }
  const [header, ...rows] = raw;
  return rows.map((row) => Object.fromEntries(header.map((column, index) => [column, row[index] ?? ""])));
}

async function writeJson(fileName, value) {
  const path = join(outputDir, fileName);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return path;
}

const [airlinesRaw, rulesRaw, airportsRaw] = await Promise.all([
  readTable("02_Airlines.json"),
  readTable("03_Airline_Rules.json"),
  readTable("runtime_airports.json"),
]);

const airlines = airlinesRaw
  .filter((row) => String(row["Airline ID"] ?? "").trim() && String(row["Airline Name"] ?? "").trim())
  .map((row, index) => ({
    airlineId: String(row["Airline ID"]).trim(),
    airlineName: String(row["Airline Name"]).trim(),
    iataCode: String(row["IATA Code"] ?? "").trim() || undefined,
    searchTerms: String(row["Search Terms"] ?? "").trim() || undefined,
    country: String(row.Country ?? "").trim() || undefined,
    slug: slugify(row.Slug || row["Airline Name"]),
    baggageUrl: String(row["Baggage URL"] ?? "").trim() || undefined,
    displayOrder: numberOrUndefined(row["Display Order"]) ?? index + 1,
    publish: bool(row.Publish) || bool(row.Active),
    lastReviewed: String(row["Last Reviewed"] ?? "").trim() || undefined,
  }))
  .filter((row) => row.slug);

const rules = rulesRaw
  .filter((row) => String(row["Rule ID"] ?? "").trim() && String(row["Airline ID"] ?? "").trim())
  .map((row) => ({
    ruleId: String(row["Rule ID"]).trim(),
    airlineId: String(row["Airline ID"]).trim(),
    fare: String(row.Fare ?? "").trim() || undefined,
    bagType: String(row["Bag Type"] ?? "").trim(),
    lengthCm: numberOrUndefined(row["Length cm"]),
    widthCm: numberOrUndefined(row["Width cm"]),
    depthCm: numberOrUndefined(row["Depth cm"]),
    weightKg: numberOrUndefined(row["Weight kg"]),
    linearSizeCm: numberOrUndefined(row["Linear Size cm"]),
    ruleWording: String(row["Rule Wording"] ?? "").trim() || undefined,
    sourceReference: String(row["Source Reference"] ?? "").trim() || undefined,
    lastChecked: String(row["Last Checked"] ?? "").trim() || undefined,
    sizingMethod: String(row["Sizing Method"] ?? "").trim().toLowerCase(),
    limitOperator: String(row["Limit Operator"] ?? "").trim().toLowerCase() || undefined,
    publish: bool(row.Publish),
  }));

const airports = airportsRaw
  .filter((row) => String(row.Airport_ID ?? "").trim() && String(row.Display_Name ?? row.Canonical_Name ?? "").trim())
  .map((row, index) => ({
    airportId: String(row.Airport_ID).trim(),
    displayName: String(row.Display_Name || row.Canonical_Name).trim(),
    canonicalName: String(row.Canonical_Name ?? "").trim() || undefined,
    slug: slugify(row.IATA_Code || row.Display_Name || row.Canonical_Name),
    iataCode: String(row.IATA_Code ?? "").trim() || undefined,
    icaoCode: String(row.ICAO_Code ?? "").trim() || undefined,
    municipality: String(row.Municipality ?? "").trim() || undefined,
    countryCode: String(row.ISO2 ?? "").trim() || undefined,
    latitude: numberOrUndefined(row.Latitude),
    longitude: numberOrUndefined(row.Longitude),
    scheduledService: bool(row.Scheduled_Service),
    publish: bool(row.Publish),
    displayOrder: numberOrUndefined(row.Display_Order) ?? index + 1,
  }))
  .filter((row) => row.slug);

const errors = [];

function unique(rows, key, label) {
  const seen = new Set();
  for (const row of rows) {
    const value = row[key];
    if (!value) {
      errors.push(`${label}: missing ${key}`);
      continue;
    }
    if (seen.has(value)) errors.push(`${label}: duplicate ${key} ${value}`);
    seen.add(value);
  }
}

unique(airlines, "airlineId", "airlines");
unique(airlines, "slug", "airlines");
unique(rules, "ruleId", "airline rules");
unique(airports, "airportId", "airports");
unique(airports, "slug", "airports");

if (airlines.length !== 114) errors.push(`Expected 114 airlines; received ${airlines.length}.`);
if (rules.length !== 425) errors.push(`Expected 425 airline rules; received ${rules.length}.`);
if (airports.length !== 1500) errors.push(`Expected 1500 airports; received ${airports.length}.`);

for (const rule of rules) {
  if (!new Set(["fixed dimensions", "linear total", "weight only"]).has(rule.sizingMethod)) {
    errors.push(`Rule ${rule.ruleId}: invalid Sizing Method.`);
  }
  if (rule.sizingMethod !== "weight only" && !new Set(["lt", "lte"]).has(rule.limitOperator)) {
    errors.push(`Rule ${rule.ruleId}: invalid Limit Operator.`);
  }
}

const report = {
  generatedAt,
  status: errors.length ? "FAIL" : "PASS",
  counts: { airlines: airlines.length, airlineRules: rules.length, airports: airports.length },
  errors,
};

await writeJson("willitfit-airlines.v1.json", { contractVersion: "1.0.0", generatedAt, rows: airlines });
await writeJson("willitfit-airline-rules.v1.json", { contractVersion: "1.0.0", generatedAt, rows: rules });
await writeJson("willitfit-airports.v1.json", { contractVersion: "1.0.0", generatedAt, rows: airports });
await writeJson("willitfit-commercial.v1.json", { contractVersion: "1.0.0", generatedAt, placements: [] });
await writeJson("snapshot-build-report.json", report);

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
