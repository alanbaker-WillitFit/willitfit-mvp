import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.length ? rest.join('=') : 'true'];
  }),
);

const mode = args.get('mode') ?? 'dry-run';
const contractPath = resolve(args.get('contract') ?? 'config/rc6/runtime-projection.v1.json');
const inputPath = args.get('input') ? resolve(args.get('input')) : null;
const outputPath = resolve(args.get('output') ?? 'artifacts/rc6-publisher/dry-run-report.json');

if (!new Set(['dry-run', 'package']).has(mode)) {
  throw new Error(`Unsupported RC6 publisher mode: ${mode}`);
}

const contract = JSON.parse(await readFile(contractPath, 'utf8'));
const errors = [];
const warnings = [];

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function text(value) {
  return String(value ?? '').trim();
}

requireValue(contract.contractId === 'willitfit-rc6-runtime-projection', 'Unexpected RC6 projection contractId.');
requireValue(contract.version === '1.0.0', 'RC6 projection contract must be version 1.0.0.');
requireValue(contract.failClosed === true, 'RC6 projection contract must fail closed.');
requireValue(contract.sourceAuthority === 'Mother_RC6', 'RC6 projection source must be Mother_RC6.');
requireValue(contract.targetAuthority === 'Runtime_RC6', 'RC6 projection target must be Runtime_RC6.');

const airlineRuleContract = contract.datasets?.['03_Airline Rules'];
requireValue(Boolean(airlineRuleContract), '03_Airline Rules projection contract is required.');
requireValue(
  airlineRuleContract?.columns?.includes('Sizing Method'),
  '03_Airline Rules must project Sizing Method.',
);
requireValue(
  airlineRuleContract?.columns?.includes('Limit Operator'),
  '03_Airline Rules must project Limit Operator.',
);

let source = {};
if (inputPath) source = JSON.parse(await readFile(inputPath, 'utf8'));
else warnings.push('No input supplied; projection-contract-only dry run completed.');

const outputDatasets = {};

for (const [tabName, datasetContract] of Object.entries(contract.datasets ?? {})) {
  const rows = Array.isArray(source[tabName]) ? source[tabName] : [];
  if (!inputPath) continue;

  if (rows.length !== datasetContract.expectedRows) {
    errors.push(`${tabName} expected ${datasetContract.expectedRows} rows but received ${rows.length}.`);
  }

  const ids = new Set();
  const projected = [];

  for (const [index, row] of rows.entries()) {
    const prefix = `${tabName}[${index}]`;
    const primaryKey = text(row?.[datasetContract.primaryKey]);
    if (!primaryKey) errors.push(`${prefix}.${datasetContract.primaryKey} is required.`);
    else if (ids.has(primaryKey)) errors.push(`${tabName} duplicate ${datasetContract.primaryKey}: ${primaryKey}.`);
    else ids.add(primaryKey);

    const projectedRow = {};
    for (const column of datasetContract.columns ?? []) {
      projectedRow[column] = row?.[column] ?? '';
    }

    if (tabName === '03_Airline Rules') {
      const method = text(projectedRow['Sizing Method']).toLowerCase();
      const operator = text(projectedRow['Limit Operator']).toLowerCase();
      const allowedMethods = new Set(datasetContract.allowedSizingMethods ?? []);
      const allowedOperators = new Set(datasetContract.allowedLimitOperators ?? []);
      const strictIds = new Set(datasetContract.strictLtRuleIds ?? []);

      if (!allowedMethods.has(method)) {
        errors.push(`${prefix}.Sizing Method is invalid or missing.`);
      }
      if (method === 'weight only') {
        if (operator) errors.push(`${prefix}.Limit Operator must be blank for weight-only rules.`);
      } else if (!allowedOperators.has(operator)) {
        errors.push(`${prefix}.Limit Operator is invalid or missing.`);
      }
      if (strictIds.has(primaryKey) && operator !== 'lt') {
        errors.push(`${prefix}.Limit Operator must be lt for governed strict-limit rule ${primaryKey}.`);
      }
      if (!strictIds.has(primaryKey) && method !== 'weight only' && operator !== 'lte') {
        errors.push(`${prefix}.Limit Operator must be lte unless the Rule ID is governed as strict lt.`);
      }
      if (method === 'fixed dimensions') {
        for (const field of ['Length cm', 'Width cm', 'Depth cm']) {
          const value = Number(projectedRow[field]);
          if (!Number.isFinite(value) || value <= 0) errors.push(`${prefix}.${field} must be a positive number for fixed dimensions.`);
        }
      }
      if (method === 'linear total') {
        const value = Number(projectedRow['Linear Size cm']);
        if (!Number.isFinite(value) || value <= 0) errors.push(`${prefix}.Linear Size cm must be a positive number for linear-total rules.`);
      }
      for (const field of datasetContract.requiredSemanticColumns ?? []) {
        if (!text(projectedRow[field])) errors.push(`${prefix}.${field} is required.`);
      }
      const entitlement = text(projectedRow['Entitlement Status']);
      if (!(datasetContract.allowedEntitlementStatuses ?? []).includes(entitlement)) {
        errors.push(`${prefix}.Entitlement Status is invalid or missing.`);
      }
      const weightBasis = text(projectedRow['Weight Basis']);
      if (!(datasetContract.allowedWeightBases ?? []).includes(weightBasis)) {
        errors.push(`${prefix}.Weight Basis is invalid or missing.`);
      }
      const weightStatus = text(projectedRow['Weight Status']);
      if (!(datasetContract.allowedWeightStatuses ?? []).includes(weightStatus)) {
        errors.push(`${prefix}.Weight Status is invalid or missing.`);
      }
    }

    projected.push(projectedRow);
  }

  outputDatasets[tabName] = projected;
}

const report = {
  mode,
  status: errors.length === 0 ? 'PASS' : 'FAIL',
  contractId: contract.contractId,
  contractVersion: contract.version,
  sourceAuthority: contract.sourceAuthority,
  targetAuthority: contract.targetAuthority,
  contractPath,
  inputPath,
  outputPath,
  counts: Object.fromEntries(
    Object.entries(contract.datasets ?? {}).map(([tabName, datasetContract]) => [
      tabName,
      {
        expectedRows: datasetContract.expectedRows,
        inputRows: Array.isArray(source[tabName]) ? source[tabName].length : 0,
        projectedRows: outputDatasets[tabName]?.length ?? 0,
      },
    ]),
  ),
  errors,
  warnings,
  runtimePackage: mode === 'package' && errors.length === 0 ? outputDatasets : undefined,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
