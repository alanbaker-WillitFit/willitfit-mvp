import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const currentDir = args.get("current-dir") ? resolve(args.get("current-dir")) : null;
const previousDir = args.get("previous-dir") ? resolve(args.get("previous-dir")) : null;
const outputRoot = resolve(args.get("output-root") ?? "public/data");
if (!currentDir || !previousDir) throw new Error("--current-dir and --previous-dir are required; production builds must contain two real certified generations");

async function loadManifest(dir) {
  const path = join(dir, "snapshot-generation-manifest.v1.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (manifest.status !== "PASS" || !manifest.generationId || !manifest.outputHashes) {
    throw new Error(`${path}: generation is not certified PASS`);
  }
  return manifest;
}

async function verifyHashes(dir, manifest) {
  const failures = [];
  const knownNames = {
    aliases: "willitfit-airline-operational-aliases.v1.json",
    pages: "willitfit-pages.v1.json",
    airlines: "willitfit-airlines.v1.json",
    rules: "willitfit-airline-rules.v1.json",
    airports: "willitfit-airports.v1.json",
    airportReferences: "willitfit-airport-reference.v1.json",
    commercial: "willitfit-commercial.v1.json",
  };
  for (const [key, expected] of Object.entries(manifest.outputHashes)) {
    const name = knownNames[key];
    if (!name) continue;
    const body = await readFile(join(dir, name));
    const actual = createHash("sha256").update(body).digest("hex");
    if (actual !== expected) failures.push(`${name}: ${actual} != ${expected}`);
  }
  if (failures.length) throw new Error(`Snapshot hash verification failed:\n${failures.join("\n")}`);
}

const current = await loadManifest(currentDir);
const previous = await loadManifest(previousDir);
if (current.generationId === previous.generationId) {
  throw new Error("CURRENT and PREVIOUS must be different certified generation IDs");
}
await Promise.all([verifyHashes(currentDir, current), verifyHashes(previousDir, previous)]);

for (const slot of ["current", "previous"]) await rm(join(outputRoot, slot), { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(currentDir, join(outputRoot, "current", "v1"), { recursive: true });
await cp(previousDir, join(outputRoot, "previous", "v1"), { recursive: true });

const release = {
  contractVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  current: { generationId: current.generationId, source: basename(currentDir) },
  previous: { generationId: previous.generationId, source: basename(previousDir) },
  fallbackOrder: ["current", "previous", "fail_closed"],
  sheetsFallbackAllowed: false,
};
await writeFile(join(outputRoot, "release-snapshot-manifest.v1.json"), `${JSON.stringify(release, null, 2)}\n`);
console.log(JSON.stringify(release, null, 2));
