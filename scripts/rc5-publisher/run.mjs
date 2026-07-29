import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.length ? rest.join('=') : 'true'];
  }),
);

const mode = args.get('mode') ?? 'dry-run';
const contractPath = resolve(
  args.get('contract') ?? 'config/rc5/runtime-contract.v2.json',
);
const inputPath = args.get('input') ? resolve(args.get('input')) : null;
const outputPath = resolve(
  args.get('output') ?? 'artifacts/rc5-publisher/dry-run-report.json',
);

const allowedModes = new Set(['dry-run', 'package']);
if (!allowedModes.has(mode)) {
  throw new Error(`Unsupported publisher mode: ${mode}`);
}

const contract = JSON.parse(await readFile(contractPath, 'utf8'));
const errors = [];
const warnings = [];

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

requireValue(contract.contractId === 'willitfit-rc5-runtime', 'Unexpected contractId.');
requireValue(contract.version === '2.0.0', 'Runtime Contract must be version 2.0.0.');
requireValue(contract.failClosed === true, 'Runtime Contract must fail closed.');
requireValue(contract.publication?.deterministicOutput === true, 'Deterministic output must be enabled.');
requireValue(contract.publication?.manualRuntimeEditing === false, 'Manual Runtime editing must be disabled.');

const expectedBagTypes = ['personal-item', 'cabin-bag', 'checked-bag'];
const bagTypes = Array.isArray(contract.bagTypes) ? contract.bagTypes : [];
for (const bagType of expectedBagTypes) {
  requireValue(
    bagTypes.some((item) => item.id === bagType),
    `Missing required bag type: ${bagType}.`,
  );
}

requireValue(
  contract.advancedBaggage?.enabled === true,
  'Advanced / Oversized baggage must be enabled.',
);
requireValue(
  contract.advancedBaggage?.categoryCount === 14,
  'Advanced / Oversized must declare fourteen governed categories.',
);
requireValue(
  contract.airlineCards?.runtimeDriven === true,
  'Airline cards must be Runtime-driven.',
);

for (const section of ['personal-item', 'cabin-bag', 'checked-bag', 'advanced-oversized']) {
  requireValue(
    contract.airlineCards?.supportedSections?.includes(section),
    `Airline cards are missing section: ${section}.`,
  );
}

let source = { airlineRules: [], advancedBaggage: [] };
if (inputPath) {
  source = JSON.parse(await readFile(inputPath, 'utf8'));
}

const validWeightModes = new Set(contract.weightModes ?? []);
const validBagTypes = new Set(expectedBagTypes);

for (const [index, rule] of (source.airlineRules ?? []).entries()) {
  const prefix = `airlineRules[${index}]`;
  for (const field of contract.airlineRuleRequiredFields ?? []) {
    requireValue(rule[field] !== undefined && rule[field] !== '', `${prefix}.${field} is required.`);
  }
  requireValue(validBagTypes.has(rule.bagType), `${prefix}.bagType is invalid.`);
  if (rule.weightMode !== undefined) {
    requireValue(validWeightModes.has(rule.weightMode), `${prefix}.weightMode is invalid.`);
  }
  if (rule.publish === true && rule.reviewStatus !== 'Approved') {
    errors.push(`${prefix} cannot publish unless reviewStatus is Approved.`);
  }
  if (rule.publish === true && !rule.sourceUrl) {
    errors.push(`${prefix}.sourceUrl is required for published rules.`);
  }
}

for (const [index, item] of (source.advancedBaggage ?? []).entries()) {
  const prefix = `advancedBaggage[${index}]`;
  for (const field of contract.advancedBaggage?.requiredFields ?? []) {
    requireValue(item[field] !== undefined && item[field] !== '', `${prefix}.${field} is required.`);
  }
  if (item.publish === true && item.reviewStatus !== 'Approved') {
    errors.push(`${prefix} cannot publish unless reviewStatus is Approved.`);
  }
}

const sortByStableKey = (items, keys) =>
  [...items].sort((a, b) => {
    const left = keys.map((key) => String(a[key] ?? '')).join('|');
    const right = keys.map((key) => String(b[key] ?? '')).join('|');
    return left.localeCompare(right, 'en');
  });

const runtimePackage = {
  contractId: contract.contractId,
  contractVersion: contract.version,
  generatedBy: 'rc5-publisher',
  bagTypes: sortByStableKey(contract.bagTypes ?? [], ['displayOrder', 'id']),
  airlineRules: sortByStableKey(
    (source.airlineRules ?? []).filter((rule) => rule.publish === true),
    ['airlineId', 'bagType', 'fare', 'ruleId'],
  ),
  advancedBaggage: sortByStableKey(
    (source.advancedBaggage ?? []).filter((item) => item.publish === true),
    ['airlineId', 'categoryId'],
  ),
};

if (!inputPath) {
  warnings.push('No input package supplied; contract-only dry run completed.');
}

const report = {
  mode,
  status: errors.length === 0 ? 'PASS' : 'FAIL',
  contractPath,
  inputPath,
  outputPath,
  counts: {
    airlineRulesRead: source.airlineRules?.length ?? 0,
    airlineRulesPublished: runtimePackage.airlineRules.length,
    advancedBaggageRead: source.advancedBaggage?.length ?? 0,
    advancedBaggagePublished: runtimePackage.advancedBaggage.length,
    errors: errors.length,
    warnings: warnings.length,
  },
  errors,
  warnings,
  runtimePackage: mode === 'package' && errors.length === 0 ? runtimePackage : undefined,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8' }).catch((error) => {
  if (error.code === 'ENOENT') {
    throw new Error(`Output directory does not exist: ${outputPath}`);
  }
  throw error;
});

console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
