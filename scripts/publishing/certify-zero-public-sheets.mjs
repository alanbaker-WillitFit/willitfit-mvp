import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const controlledPrefixes = [
  normalize("app/rc6-commercial-preview/"),
  normalize("app/api/rc6-draft/"),
];
const forbidden = new Set([
  normalize("services/googleSheetsAdmin.ts"),
  normalize("services/googleSheetsWrite.ts"),
]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", ".open-next"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (entry.isFile() && extensions.includes(extname(entry.name))) out.push(path);
  }
  return out;
}

function rel(path) { return normalize(path.slice(root.length + 1)); }
function controlled(path) { const r = rel(path); return controlledPrefixes.some((prefix) => r.startsWith(prefix)); }

async function resolveImport(fromPath, specifier) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const base = specifier.startsWith("@/")
    ? resolve(root, specifier.slice(2))
    : resolve(dirname(fromPath), specifier);
  const candidates = [base, ...extensions.map((ext) => `${base}${ext}`), ...extensions.map((ext) => join(base, `index${ext}`))];
  for (const candidate of candidates) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch {}
  }
  return null;
}

const allApp = await walk(resolve(root, "app"));
const entries = allApp.filter((path) => !controlled(path) && /(?:page|route|layout)\.(?:ts|tsx|js|jsx)$/.test(path));
const queue = [...entries];
const visited = new Set();
const parents = new Map();
const violations = [];
const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
const dynamicPattern = /import\(\s*["']([^"']+)["']\s*\)/g;

while (queue.length) {
  const path = queue.shift();
  if (!path || visited.has(path)) continue;
  visited.add(path);
  const r = rel(path);
  if (forbidden.has(r)) {
    const chain = [r];
    let cursor = path;
    while (parents.has(cursor)) { cursor = parents.get(cursor); chain.unshift(rel(cursor)); }
    violations.push(`Forbidden public dependency: ${chain.join(" -> ")}`);
    continue;
  }
  const source = await readFile(path, "utf8");
  if (/https:\/\/sheets\.googleapis\.com|https:\/\/oauth2\.googleapis\.com/.test(source)) {
    violations.push(`Direct Google Sheets/OAuth URL reachable from public graph: ${r}`);
  }
  for (const pattern of [importPattern, dynamicPattern]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) {
      const target = await resolveImport(path, match[1]);
      if (target && !visited.has(target)) {
        if (!parents.has(target)) parents.set(target, path);
        queue.push(target);
      }
    }
  }
}

const directReaderRefs = [];
for (const scope of ["app", "components", "services", "lib"]) {
  let scoped = [];
  try { scoped = await walk(resolve(root, scope)); } catch {}
  for (const path of scoped) {
    const r = rel(path);
    if (r === normalize("services/googleSheetsAdmin.ts") || r === normalize("services/rc6/runtimeBinding.ts")) continue;
    const source = await readFile(path, "utf8");
    if (source.includes("getSheetRowsFromSpreadsheet")) directReaderRefs.push(r);
  }
}
if (directReaderRefs.length) violations.push(`Direct Sheets reader escaped controlled modules: ${directReaderRefs.join(", ")}`);

const result = {
  status: violations.length ? "FAIL" : "PASS",
  publicEntries: entries.length,
  reachableModules: visited.size,
  forbiddenDependencies: violations,
  controlledExceptions: ["services/googleSheetsAdmin.ts via services/rc6/runtimeBinding.ts", "services/googleSheetsWrite.ts (no public imports)"],
};
console.log(JSON.stringify(result, null, 2));
if (violations.length) process.exitCode = 1;
