import { readRc6Dataset, type Rc6TabReader } from "./runtimeReader";

type RuntimeRow = Record<string, string>;

export type Rc6SpecialBaggageReferenceItem = Readonly<{
  itemId: string;
  rank: number;
  category: string;
  itemName: string;
  subtype: string;
  typicalShape: string;
  handlingClassification: string;
  specialHandlingGuidance: string;
  advanceNotificationUsuallyRequired: boolean;
  specialPackagingUsuallyRequired: boolean;
  batteryOrDangerousGoodsConsideration: boolean;
  mobilityOrMedicalEquipment: boolean;
  airlineLevelValidationRequired: boolean;
  resultCategory: string;
  reviewStatus: string;
  published: boolean;
  notes: string;
}>;

export type Rc6SpecialBaggageResult = Readonly<{
  resultId: string;
  rank: number;
  category: string;
  linkedItemIds: readonly string[];
  title: string;
  summary: string;
  preparationGuidance: string;
  feeGuidance: string;
  policyLinkLabel: string;
  policyLinkSource: readonly string[];
  mobilityOrMedical: boolean;
  reviewStatus: string;
  published: boolean;
  notes: string;
}>;

function text(row: RuntimeRow, field: string): string {
  return String(row[field] ?? "").trim();
}

function truthy(value: string): boolean {
  return ["yes", "true", "1", "active", "approved", "published", "live"].includes(value.trim().toLowerCase());
}

function approved(value: string): boolean {
  return ["approved", "published", "live"].includes(value.trim().toLowerCase());
}

function list(value: string): string[] {
  return value.split(/[;,|]/).map((entry) => entry.trim()).filter(Boolean);
}

function rank(row: RuntimeRow, field: string): number {
  const value = Number.parseInt(text(row, field), 10);
  return Number.isFinite(value) ? value : 999;
}

export async function getRc6SpecialBaggageReferenceItems(reader: Rc6TabReader): Promise<Rc6SpecialBaggageReferenceItem[]> {
  const result = await readRc6Dataset<RuntimeRow>("specialBaggageAll", reader);
  if (result.state !== "READY_WITH_ROWS") return [];

  const items = result.rows
    .map((row) => ({
      itemId: text(row, "Item ID"),
      rank: rank(row, "Item Rank"),
      category: text(row, "Category"),
      itemName: text(row, "Item Name"),
      subtype: text(row, "Item Subtype"),
      typicalShape: text(row, "Typical Shape"),
      handlingClassification: text(row, "Handling Classification"),
      specialHandlingGuidance: text(row, "Special Handling Guidance"),
      advanceNotificationUsuallyRequired: truthy(text(row, "Advance Notification Usually Required")),
      specialPackagingUsuallyRequired: truthy(text(row, "Special Packaging Usually Required")),
      batteryOrDangerousGoodsConsideration: truthy(text(row, "Battery or Dangerous Goods Consideration")),
      mobilityOrMedicalEquipment: truthy(text(row, "Mobility or Medical Equipment")),
      airlineLevelValidationRequired: truthy(text(row, "Airline-Level Validation Required")),
      resultCategory: text(row, "Result Category"),
      reviewStatus: text(row, "Review Status"),
      published: truthy(text(row, "Publish")) && approved(text(row, "Review Status")),
      notes: text(row, "Notes"),
    }))
    .filter((item) => item.itemId && item.itemName && item.resultCategory)
    .sort((a, b) => a.rank - b.rank || a.itemId.localeCompare(b.itemId));

  const ids = new Set<string>();
  return items.filter((item) => {
    if (ids.has(item.itemId)) return false;
    ids.add(item.itemId);
    return true;
  });
}

export async function getRc6SpecialBaggageResults(reader: Rc6TabReader): Promise<Rc6SpecialBaggageResult[]> {
  const result = await readRc6Dataset<RuntimeRow>("specialBaggageResults", reader);
  if (result.state !== "READY_WITH_ROWS") return [];

  const mapped = result.rows
    .filter((row) => truthy(text(row, "Publish")) && approved(text(row, "Review Status")))
    .map((row) => ({
      resultId: text(row, "Result ID").toUpperCase(),
      rank: rank(row, "Result Rank"),
      category: text(row, "Result Category"),
      linkedItemIds: list(text(row, "Linked Item IDs")),
      title: text(row, "Result Title"),
      summary: text(row, "Result Summary"),
      preparationGuidance: text(row, "Preparation Guidance"),
      feeGuidance: text(row, "Fee Guidance"),
      policyLinkLabel: text(row, "Policy Link Label"),
      policyLinkSource: list(text(row, "Policy Link Source")),
      mobilityOrMedical: truthy(text(row, "Mobility or Medical Result")),
      reviewStatus: text(row, "Review Status"),
      published: true,
      notes: text(row, "Notes"),
    }))
    .filter((entry) => entry.resultId && entry.category && entry.title && entry.summary && entry.linkedItemIds.length > 0)
    .sort((a, b) => a.rank - b.rank || a.resultId.localeCompare(b.resultId));

  const resultIds = new Set<string>();
  const ranks = new Set<number>();
  for (const entry of mapped) {
    if (resultIds.has(entry.resultId) || ranks.has(entry.rank)) return [];
    resultIds.add(entry.resultId);
    ranks.add(entry.rank);
  }

  if (mapped.length !== 21) return [];
  if (mapped.some((entry, index) => entry.rank !== index + 1)) return [];

  return mapped;
}
