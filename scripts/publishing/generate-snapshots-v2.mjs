import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const inputDir = resolve(args.get("input-dir") ?? "artifacts/runtime-freeze/Runtime_RC6");
const motherDir = resolve(args.get("mother-dir") ?? "artifacts/runtime-freeze/Mother_RC6");
const outputDir = resolve(args.get("output-dir") ?? "public/data/v1");
const scopeFile = resolve(args.get("scope-file") ?? "config/publishing/uk18.v1.json");
const contractFile = resolve(args.get("contract-file") ?? "config/publishing/runtime-generation-contract.v1.json");
const enrichmentFile = args.get("airport-enrichment-file") ? resolve(args.get("airport-enrichment-file")) : null;
const generatedAt = new Date().toISOString();

const slugify = (value) => String(value ?? "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const bool = (value) => ["1", "true", "yes", "y", "active", "live", "published"].includes(String(value ?? "").trim().toLowerCase());
const num = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; };
const text = (value) => String(value ?? "").trim();

async function table(dir, name) {
  const raw = JSON.parse(await readFile(join(dir, name), "utf8"));
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) throw new Error(`${name} must be header-first 2D JSON`);
  const [headers, ...rows] = raw;
  return rows
    .filter((row) => Array.isArray(row) && row.some((value) => text(value)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

async function writeJson(name, value) {
  const path = join(outputDir, name);
  await mkdir(dirname(path), { recursive: true });
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, body);
  return { path, sha256: createHash("sha256").update(body).digest("hex") };
}

async function csvRows(path) {
  if (!path) return [];
  const source = await readFile(path, "utf8");
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const parse = (line) => {
    const out = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
        else quoted = !quoted;
      } else if (char === "," && !quoted) { out.push(current); current = ""; }
      else current += char;
    }
    out.push(current);
    return out;
  };
  const headers = parse(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parse(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

const [airlinesRaw, rulesRaw, motherRulesRaw, airportsRaw, pagesRaw, sectionsRaw, enrichment, scope, contract] = await Promise.all([
  table(inputDir, "02_Airlines.json"),
  table(inputDir, "03_Airline_Rules.json"),
  table(motherDir, "03_Airline_Rules.json"),
  table(inputDir, "runtime_airports.json"),
  table(inputDir, "runtime_pages.json"),
  table(inputDir, "runtime_page_sections.json"),
  csvRows(enrichmentFile),
  JSON.parse(await readFile(scopeFile, "utf8")),
  JSON.parse(await readFile(contractFile, "utf8")),
]);

const errors = [];
const motherRuleById = new Map(motherRulesRaw.filter((row) => text(row["Rule ID"])).map((row) => [text(row["Rule ID"]), row]));
const scopeMap = new Map((scope.airports ?? []).map((item) => [item.iataCode, item]));
const linksByIata = new Map();
for (const row of enrichment) {
  const iata = text(row.iata || row.airport_key).toUpperCase();
  const url = text(row.url);
  if (!iata || !url) continue;
  const values = linksByIata.get(iata) ?? [];
  values.push({ label: text(row.label) || "Official flights", url });
  linksByIata.set(iata, values);
}

const airlines = airlinesRaw
  .filter((row) => text(row["Airline ID"]) && text(row["Airline Name"]))
  .map((row, index) => ({
    airlineId: text(row["Airline ID"]),
    airlineName: text(row["Airline Name"]),
    iataCode: text(row["IATA Code"]) || undefined,
    country: text(row.Country) || undefined,
    slug: slugify(row.Slug || row["Airline Name"]),
    baggageUrl: text(row["Baggage URL"]) || undefined,
    displayOrder: num(row["Display Order"]) ?? index + 1,
    publish: bool(row.Publish) || bool(row.Active),
    lastReviewed: text(row["Last Reviewed"]) || undefined,
  }))
  .filter((row) => row.slug);

const rules = rulesRaw
  .filter((row) => text(row["Rule ID"]) && text(row["Airline ID"]))
  .map((row) => {
    const ruleId = text(row["Rule ID"]);
    const mother = motherRuleById.get(ruleId);
    if (!mother) errors.push(`Rule ${ruleId}: missing authoritative Mother row`);
    return {
      ruleId,
      airlineId: text(row["Airline ID"]),
      fare: text(row.Fare) || undefined,
      bagType: text(row["Bag Type"]),
      lengthCm: num(row["Length cm"]),
      widthCm: num(row["Width cm"]),
      depthCm: num(row["Depth cm"]),
      weightKg: num(row["Weight kg"]),
      linearSizeCm: num(row["Linear Size cm"]),
      ruleWording: text(row["Rule Wording"]) || undefined,
      sourceReference: text(row["Source Reference"]) || undefined,
      lastChecked: text(row["Last Checked"]) || undefined,
      sizingMethod: text(row["Sizing Method"]).toLowerCase(),
      limitOperator: text(row["Limit Operator"]).toLowerCase() || undefined,
      publish: bool(row.Publish),
      entitlementStatus: text(mother?.["Entitlement Status"]) || undefined,
      applicabilityConditions: text(mother?.["Applicability Conditions"]) || undefined,
      weightBasis: text(mother?.["Weight Basis"]) || undefined,
      fareDescription: text(mother?.["Fare Description"]) || undefined,
      weightStatus: text(mother?.["Weight Status"]) || undefined,
      weightGuidance: text(mother?.["Weight Guidance"]) || undefined,
    };
  });

const airports = airportsRaw
  .filter((row) => text(row.Airport_ID) && text(row.Display_Name || row.Canonical_Name))
  .map((row, index) => {
    const iata = text(row.IATA_Code).toUpperCase();
    const governed = scopeMap.get(iata);
    return {
      airportId: text(row.Airport_ID),
      displayName: text(row.Display_Name || row.Canonical_Name),
      canonicalName: text(row.Canonical_Name) || undefined,
      slug: governed?.slug || (iata ? iata.toLowerCase() : `${slugify(row.Display_Name || row.Canonical_Name)}-${slugify(row.Airport_ID).slice(-8)}`),
      iataCode: iata || undefined,
      icaoCode: text(row.ICAO_Code) || undefined,
      municipality: text(row.Municipality) || undefined,
      countryCode: text(row.ISO2) || undefined,
      latitude: num(row.Latitude),
      longitude: num(row.Longitude),
      scheduledService: bool(row.Scheduled_Service),
      publish: Boolean(governed),
      displayOrder: governed?.passengerRankUk ?? 10000 + index,
      passengerRankUk: governed?.passengerRankUk,
      annualPassengers: governed?.annualPassengers,
    };
  });

const refs = airports.filter((airport) => airport.publish).map((airport) => ({
  contractVersion: "1.0.0",
  airportId: airport.airportId,
  displayName: airport.displayName,
  canonicalName: airport.canonicalName,
  iataCode: airport.iataCode,
  icaoCode: airport.icaoCode,
  municipality: airport.municipality,
  countryCode: airport.countryCode,
  latitude: airport.latitude,
  longitude: airport.longitude,
  scheduledService: airport.scheduledService,
  passengerRankUk: airport.passengerRankUk,
  annualPassengers: airport.annualPassengers,
  flightLinks: linksByIata.get(airport.iataCode) ?? [],
  terminals: [], transport: [], parking: [], lounges: [], hotels: [], facilities: [],
  sourceReferences: ["Runtime_RC6/runtime_airports", "UK18 governed passenger ranking"],
  lastCheckedAt: generatedAt,
}));

const pages = pagesRaw.filter((row) => text(row.pageId || row.PageID)).map((row) => ({
  pageId: text(row.pageId || row.PageID),
  pageType: text(row.pageType || row.PageType),
  slug: text(row.slug || row.Slug),
  entityType: text(row.entityType || row.EntityType) || undefined,
  entityId: text(row.entityId || row.EntityID) || undefined,
  title: text(row.title || row.Title) || undefined,
  heroTitle: text(row.heroTitle || row.HeroTitle) || undefined,
  heroSummary: text(row.heroSummary || row.HeroSummary) || undefined,
  metaTitle: text(row.metaTitle || row.MetaTitle) || undefined,
  metaDescription: text(row.metaDescription || row.MetaDescription) || undefined,
  canonicalUrl: text(row.canonicalUrl || row.CanonicalURL) || undefined,
  publicationState: (text(row.publicationState || row.PublicationState) || "draft").toLowerCase(),
  lastReviewedAt: text(row.lastReviewedAt || row.LastReviewedAt) || undefined,
}));

const sections = sectionsRaw
  .filter((row) => text(row.pageSectionId || row.PageSectionID) && text(row.pageId || row.PageID))
  .map((row, index) => ({
    pageId: text(row.pageId || row.PageID),
    sectionId: text(row.pageSectionId || row.PageSectionID),
    sectionType: text(row.sectionType || row.SectionType),
    heading: text(row.heading || row.Heading) || undefined,
    intro: text(row.intro || row.Intro) || undefined,
    dataSourceId: text(row.dataSourceId || row.DataSourceID) || undefined,
    displayOrder: num(row.displayOrder || row.DisplayOrder) ?? index + 1,
    visibility: text(row.status || row.Status).toLowerCase() === "hidden" ? "hidden" : "visible",
    required: bool(row.requiredFlag || row.RequiredFlag),
  }));

function unique(rows, key, label) {
  const seen = new Set();
  for (const row of rows) {
    const value = row[key];
    if (!value) errors.push(`${label}: missing ${key}`);
    else if (seen.has(value)) errors.push(`${label}: duplicate ${key} ${value}`);
    else seen.add(value);
  }
}

unique(airlines, "airlineId", "airlines");
unique(airlines, "slug", "airlines");
unique(rules, "ruleId", "rules");
unique(airports, "airportId", "airports");

const airlineIds = new Set(airlines.map((row) => row.airlineId));
for (const rule of rules) {
  if (!airlineIds.has(rule.airlineId)) errors.push(`Rule ${rule.ruleId}: unknown airlineId ${rule.airlineId}`);
  if (!["fixed dimensions", "linear total", "weight only"].includes(rule.sizingMethod)) errors.push(`Rule ${rule.ruleId}: invalid Sizing Method`);
  if (rule.sizingMethod !== "weight only" && !["lt", "lte"].includes(rule.limitOperator)) errors.push(`Rule ${rule.ruleId}: invalid Limit Operator`);
}

const counts = {
  airlines: airlines.length,
  airlineRules: rules.length,
  airports: airports.length,
  publishingAirports: airports.filter((airport) => airport.publish).length,
  airportReferences: refs.length,
};
for (const [name, minimum] of Object.entries(contract.minimums ?? {})) {
  if ((counts[name] ?? 0) < Number(minimum)) errors.push(`${name}: ${counts[name] ?? 0} below certified minimum ${minimum}`);
}

const manualAliases = JSON.parse(await readFile(resolve("config/publishing/airline-operational-aliases.v1.json"), "utf8"));
const autoAliases = airlines.filter((airline) => airline.iataCode).map((airline) => ({
  airlineId: airline.airlineId,
  operationalCode: airline.iataCode.toUpperCase(),
  codeType: "IATA",
  sourceReference: "Runtime_RC6/02_Airlines",
  lastCheckedAt: airline.lastReviewed || generatedAt.slice(0, 10),
  publicationState: "approved",
}));
const aliasOwners = new Map();
const aliases = [];
for (const alias of [...autoAliases, ...(manualAliases.mappings || [])]) {
  const code = text(alias.operationalCode).toUpperCase();
  const airlineId = text(alias.airlineId);
  if (!code || !airlineId || !alias.sourceReference || !alias.lastCheckedAt) { errors.push(`Alias ${code || "<blank>"}: incomplete governance metadata`); continue; }
  if (!airlineIds.has(airlineId)) { errors.push(`Alias ${code}: unknown airlineId ${airlineId}`); continue; }
  const owner = aliasOwners.get(code);
  if (owner && owner !== airlineId) { errors.push(`Alias ${code}: conflicting airlineIds ${owner}/${airlineId}`); continue; }
  if (owner === airlineId) continue;
  aliasOwners.set(code, airlineId);
  aliases.push({ ...alias, airlineId, operationalCode: code });
}
counts.airlineOperationalAliases = aliases.length;

const outputs = {};
outputs.aliases = await writeJson("willitfit-airline-operational-aliases.v1.json", { contractVersion: "1.0.0", generatedAt, mappings: aliases });
outputs.pages = await writeJson("willitfit-pages.v1.json", { contractVersion: "1.0.0", generatedAt, pages, sections });
outputs.airlines = await writeJson("willitfit-airlines.v1.json", { contractVersion: "1.0.0", generatedAt, rows: airlines });
outputs.rules = await writeJson("willitfit-airline-rules.v1.json", { contractVersion: "2.0.0", generatedAt, rows: rules });
outputs.airports = await writeJson("willitfit-airports.v1.json", { contractVersion: "1.0.0", generatedAt, rows: airports });
outputs.airportReferences = await writeJson("willitfit-airport-reference.v1.json", { contractVersion: "1.0.0", generatedAt, rows: refs });
outputs.commercial = await writeJson("willitfit-commercial.v1.json", { contractVersion: "1.0.0", generatedAt, placements: [], creatives: [] });

const generationSeed = JSON.stringify({ contractVersion: contract.contractVersion, counts, hashes: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, value.sha256])) });
const generationId = `rc6-${createHash("sha256").update(generationSeed).digest("hex").slice(0, 16)}`;
const report = {
  generatedAt,
  generationId,
  contractVersion: contract.contractVersion,
  status: errors.length ? "FAIL" : "PASS",
  counts,
  minimums: contract.minimums,
  outputHashes: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, value.sha256])),
  errors,
};
await writeJson("snapshot-build-report.json", report);
await writeJson("snapshot-generation-manifest.v1.json", report);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
