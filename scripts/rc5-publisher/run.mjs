import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

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

function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

function toTrimmedString(value) {
  return String(value ?? '').trim();
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalised = toTrimmedString(value).toLowerCase();
  if (['true', 'yes', 'y', '1', 'publish', 'published', 'active'].includes(normalised)) return true;
  if (['false', 'no', 'n', '0', 'inactive', 'draft', ''].includes(normalised)) return false;
  return null;
}

function toInteger(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const normalised = toTrimmedString(value);
  if (!/^-?\d+$/.test(normalised)) return null;
  return Number.parseInt(normalised, 10);
}

function safeHttpsUrl(value) {
  const input = toTrimmedString(value);
  if (!input) return '';
  try {
    const url = new URL(input);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function firstValue(row, ...names) {
  for (const name of names) {
    const value = row?.[name];
    if (isPresent(value)) return value;
  }
  return '';
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
requireValue(contract.affiliates?.enabled === true, 'Affiliate publication must be enabled.');
requireValue(
  contract.affiliates?.slotsPerCategory === 10,
  'Affiliate publication must declare ten slots per category.',
);
requireValue(
  contract.affiliates?.publicationRules?.badgeControlsRouting === false,
  'Affiliate badges must not control routing.',
);

for (const section of ['personal-item', 'cabin-bag', 'checked-bag', 'advanced-oversized']) {
  requireValue(
    contract.airlineCards?.supportedSections?.includes(section),
    `Airline cards are missing section: ${section}.`,
  );
}

let source = { airlineRules: [], advancedBaggage: [], affiliates: [] };
if (inputPath) {
  source = {
    ...source,
    ...JSON.parse(await readFile(inputPath, 'utf8')),
  };
}

const validWeightModes = new Set(contract.weightModes ?? []);
const validBagTypes = new Set(expectedBagTypes);

for (const [index, rule] of (source.airlineRules ?? []).entries()) {
  const prefix = `airlineRules[${index}]`;
  for (const field of contract.airlineRuleRequiredFields ?? []) {
    requireValue(isPresent(rule[field]), `${prefix}.${field} is required.`);
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
    requireValue(isPresent(item[field]), `${prefix}.${field} is required.`);
  }
  if (item.publish === true && item.reviewStatus !== 'Approved') {
    errors.push(`${prefix} cannot publish unless reviewStatus is Approved.`);
  }
}

const affiliateConfig = contract.affiliates ?? {};
const affiliateRequiredFields = affiliateConfig.requiredFields ?? [];
const validAffiliateCategories = new Set(affiliateConfig.categoryKeys ?? []);
const validAffiliateBadges = new Set(affiliateConfig.badgeValues ?? []);
const slotsPerCategory = affiliateConfig.slotsPerCategory ?? 10;

function normaliseAffiliate(row, index) {
  const prefix = `affiliates[${index}]`;
  const publishValue = toBoolean(firstValue(row, 'publish', 'Publish'));
  const activeValue = toBoolean(firstValue(row, 'active', 'Active'));
  const slotPosition = toInteger(
    firstValue(row, 'slotPosition', 'Slot Position', 'Target_Position', 'Position'),
  );
  const categoryKey = toTrimmedString(
    firstValue(row, 'categoryKey', 'Category Key', 'Runtime Category Key', 'Category'),
  ).toLowerCase();
  const badge = toTrimmedString(firstValue(row, 'badge', 'Badge'));
  const affiliateUrlInput = firstValue(
    row,
    'affiliateUrl',
    'Affiliate URL',
    'Destination URL',
    'AffiliateURL',
    'URL',
  );
  const imageUrlInput = firstValue(row, 'imageUrl', 'Image URL', 'Image Reference', 'ImageURL');

  const affiliate = {
    affiliateId: toTrimmedString(firstValue(row, 'affiliateId', 'Affiliate ID', 'Affiliate Slot ID')),
    productRef: toTrimmedString(firstValue(row, 'productRef', 'Product Ref', 'Product_Ref')),
    productName: toTrimmedString(firstValue(row, 'productName', 'Product Name', 'Product')),
    categoryKey,
    slotPosition,
    merchant: toTrimmedString(firstValue(row, 'merchant', 'Merchant', 'Brand')),
    productDescription: toTrimmedString(
      firstValue(row, 'productDescription', 'Product Description', 'Description', 'Supporting Line'),
    ),
    imageUrl: safeHttpsUrl(imageUrlInput),
    affiliateUrl: safeHttpsUrl(affiliateUrlInput),
    cta: toTrimmedString(firstValue(row, 'cta', 'CTA', 'CTA Text')) || 'View product',
    priceText: toTrimmedString(firstValue(row, 'priceText', 'Price Text', 'Price')),
    disclosure: toTrimmedString(firstValue(row, 'disclosure', 'Disclosure')) || 'Affiliate link',
    badge,
    active: activeValue,
    reviewStatus: toTrimmedString(firstValue(row, 'reviewStatus', 'Review Status', 'Review_Status')),
    lastReviewed: toTrimmedString(firstValue(row, 'lastReviewed', 'Last Reviewed', 'Last_Reviewed')),
    notes: toTrimmedString(firstValue(row, 'notes', 'Notes')),
    publish: publishValue,
  };

  if (!affiliate.affiliateId && categoryKey && slotPosition !== null) {
    affiliate.affiliateId = `${categoryKey}-${String(slotPosition).padStart(2, '0')}`;
  }

  if (publishValue === null) errors.push(`${prefix}.publish must be a recognised boolean value.`);
  if (activeValue === null) errors.push(`${prefix}.active must be a recognised boolean value.`);

  for (const field of affiliateRequiredFields) {
    if (!isPresent(affiliate[field])) errors.push(`${prefix}.${field} is required.`);
  }

  if (!validAffiliateCategories.has(categoryKey)) {
    errors.push(`${prefix}.categoryKey is invalid.`);
  }
  if (slotPosition === null || slotPosition < 1 || slotPosition > slotsPerCategory) {
    errors.push(`${prefix}.slotPosition must be an integer from 1 to ${slotsPerCategory}.`);
  }
  if (affiliateUrlInput && !affiliate.affiliateUrl) {
    errors.push(`${prefix}.affiliateUrl must be a valid HTTPS URL.`);
  }
  if (imageUrlInput && !affiliate.imageUrl) {
    errors.push(`${prefix}.imageUrl must be a valid HTTPS URL when supplied.`);
  }
  if (badge && !validAffiliateBadges.has(badge)) {
    errors.push(`${prefix}.badge is invalid.`);
  }
  if (publishValue === true && activeValue !== true) {
    errors.push(`${prefix} cannot publish unless active is true.`);
  }
  if (publishValue === true && affiliate.reviewStatus !== affiliateConfig.publicationRules?.approvedReviewStatus) {
    errors.push(
      `${prefix} cannot publish unless reviewStatus is ${affiliateConfig.publicationRules?.approvedReviewStatus ?? 'Approved'}.`,
    );
  }
  if (publishValue === true && !affiliate.affiliateUrl) {
    errors.push(`${prefix}.affiliateUrl is required for published affiliates.`);
  }

  return affiliate;
}

const normalisedAffiliates = (source.affiliates ?? []).map(normaliseAffiliate);
const publishableAffiliates = normalisedAffiliates.filter(
  (item) => item.publish === true && item.active === true,
);

const occupiedAffiliateSlots = new Map();
for (const [index, affiliate] of publishableAffiliates.entries()) {
  const key = `${affiliate.categoryKey}:${affiliate.slotPosition}`;
  if (occupiedAffiliateSlots.has(key)) {
    errors.push(
      `Duplicate publishable affiliate slot ${key} at affiliates[${occupiedAffiliateSlots.get(key)}] and affiliates[${index}].`,
    );
  } else {
    occupiedAffiliateSlots.set(key, index);
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
  affiliates: sortByStableKey(publishableAffiliates, [
    'categoryKey',
    'slotPosition',
    'productRef',
    'affiliateId',
  ]),
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
    affiliatesRead: source.affiliates?.length ?? 0,
    affiliatesNormalised: normalisedAffiliates.length,
    affiliatesPublished: runtimePackage.affiliates.length,
    errors: errors.length,
    warnings: warnings.length,
  },
  errors,
  warnings,
  runtimePackage: mode === 'package' && errors.length === 0 ? runtimePackage : undefined,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8' });

console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
