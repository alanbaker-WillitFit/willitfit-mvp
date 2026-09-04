import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));
const motherDir = resolve(args.get("mother-dir") ?? "artifacts/runtime-freeze/Mother_RC6");
const contractFile = resolve(args.get("contract-file") ?? "config/publishing/runtime-generation-contract.v1.json");
const outputFile = resolve(args.get("output-file") ?? "artifacts/certification/rc6-rule-semantic-coverage.json");
const text = (value) => String(value ?? "").trim();

const raw = JSON.parse(await readFile(join(motherDir, "03_Airline_Rules.json"), "utf8"));
if (!Array.isArray(raw) || !Array.isArray(raw[0])) throw new Error("03_Airline_Rules.json must be header-first 2D JSON");
const [headers, ...sourceRows] = raw;
const rows = sourceRows
  .filter((row) => Array.isArray(row) && row.some((value) => text(value)))
  .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
const contract = JSON.parse(await readFile(contractFile, "utf8"));
const required = contract.requiredRuleSemantics ?? [];
const governedRows = rows.filter((row) => text(row["Rule ID"]));
const publishedRows = governedRows.filter((row) => text(row.Publish).toLowerCase() === "yes" && text(row["Review Status"]).toLowerCase() === "approved");
const errors = [];
const coverage = {};

for (const field of required) {
  const columnPresent = headers.includes(field);
  const governedPopulated = governedRows.filter((row) => text(row[field])).length;
  const publishedPopulated = publishedRows.filter((row) => text(row[field])).length;
  coverage[field] = {
    releaseRequirement: "REQUIRED",
    columnPresent,
    governedPopulated,
    governedTotal: governedRows.length,
    publishedPopulated,
    publishedTotal: publishedRows.length,
    publishedMissing: publishedRows.length - publishedPopulated,
  };
  if (!columnPresent) errors.push(`Required semantic column missing: ${field}`);
  if (publishedPopulated !== publishedRows.length) {
    errors.push(`Required semantic incomplete: ${field} ${publishedPopulated}/${publishedRows.length}`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  contractVersion: contract.contractVersion,
  status: errors.length ? "FAIL" : "PASS",
  governedRules: governedRows.length,
  publishedRules: publishedRows.length,
  coverage,
  errors,
  note: "All six RC6 fare semantics are mandatory and completeness is release-gating. Runtime remains the governed publication projection for this slow-moving core dataset; immutable snapshots are generated from the certified publication state and are the only public serving source.",
};
await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
