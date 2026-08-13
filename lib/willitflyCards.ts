export type WillItFlyTopicId = "POWER" | "CONNECTIVITY" | "MONEY" | "ENTRY" | "WEATHER";

export type RuntimeDestinationFact = {
  factId: string;
  destinationId: string;
  topicId: string;
  factKey: string;
  factValue: string;
  factValue2?: string;
  unit?: string;
  summary?: string;
  detail?: string;
  factClassification?: string;
  preparationState?: string;
  sourceId: string;
  evidenceStatus?: string;
  confidence?: string;
  lastReviewed?: string;
  reviewDue?: string;
  inheritedFromDestinationId?: string;
  inheritanceLevel?: string;
};

export type RuntimeCardSchema = {
  cardId: string;
  cardType: string;
  topicId?: string;
  title: string;
  displayOrder: number;
  componentKey: string;
  interactionMode: string;
  detailRouteKey?: string;
  assetMode?: string;
  visibilityRule?: string;
  safeState?: string;
  schemaVersion?: string;
  requiredForRc1: boolean;
};

export type RuntimeCardFieldLink = {
  linkId: string;
  cardId: string;
  slotKey: string;
  runtimeTab: string;
  runtimeField: string;
  lookupKey: string;
  lookupValueSource: string;
  resolver: string;
  required: boolean;
  multiple: boolean;
  displayRole?: string;
  missingBehaviour?: string;
  buildOutput: string;
};

export type CardAsset = {
  assetId: string;
  entityType?: string;
  entityId?: string;
  topicId?: string;
  productionPath: string;
  altText?: string;
  accessibilityBehaviour?: string;
  fallbackAssetId?: string;
  version?: string;
  assetRole?: string;
};

export type CardPublicSource = {
  sourceId: string;
  sourceName: string;
  url: string;
  urlRole?: string;
  authorityLevel?: string;
};

export type ResolvedFactLineage = {
  factKey: string;
  sourceId: string;
  lastReviewed?: string;
  reviewDue?: string;
  inheritedFromDestinationId?: string;
  inheritanceLevel?: string;
};

export type ResolvedTopicCard = {
  cardId: string;
  topicId: WillItFlyTopicId;
  title: string;
  status: "ready" | "unavailable" | "official-confirmation-required";
  fields: Record<string, string | string[]>;
  assets: CardAsset[];
  sourceIds: string[];
  factLineage: ResolvedFactLineage[];
  publicSource?: CardPublicSource;
  lastReviewed?: string;
  missing: string[];
};

export type ResolveTopicCardInput = {
  destinationId: string;
  topicId: WillItFlyTopicId;
  facts: RuntimeDestinationFact[];
  cardSchemas: RuntimeCardSchema[];
  cardFieldLinks: RuntimeCardFieldLink[];
  assets: CardAsset[];
  publicSources: CardPublicSource[];
};

const CONTROLLED_PLUG_TYPES = new Set("ABCDEFGHIJKLMN".split(""));
const BLOCKING_PREPARATION_STATES = new Set(["NOT_APPLICABLE", "STALE"]);

function factKeyFromLookup(link: RuntimeCardFieldLink): string | null {
  if (link.runtimeTab !== "03_Destination_Facts") return null;
  const parts = link.lookupValueSource.split("+").map((value) => value.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return parts[parts.length - 1] || null;
}

function parseControlledPlugIds(value: string): string[] | null {
  const ids = value.split(/[|,;]/).map((item) => item.trim().toUpperCase()).filter(Boolean);
  if (ids.length === 0 || ids.some((id) => !CONTROLLED_PLUG_TYPES.has(id))) return null;
  return ids;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function inheritanceRank(fact: RuntimeDestinationFact): number | null {
  const level = String(fact.inheritanceLevel || "").trim().toUpperCase();
  const inheritedFrom = String(fact.inheritedFromDestinationId || "").trim();

  if (!level && !inheritedFrom) return 0;
  if (!level || !inheritedFrom) return null;
  if (level === "COUNTRY") return 1000000;

  const parentMatch = /^PARENT_(\d+)$/.exec(level);
  if (!parentMatch) return null;
  const depth = Number(parentMatch[1]);
  if (!Number.isInteger(depth) || depth < 1) return null;
  return depth;
}

function isBlockingFact(fact: RuntimeDestinationFact): boolean {
  return BLOCKING_PREPARATION_STATES.has(String(fact.preparationState || "").trim().toUpperCase());
}

function resolveFactCandidate(
  facts: RuntimeDestinationFact[],
  factKey: string,
): RuntimeDestinationFact | null {
  const candidates = facts.filter((fact) => fact.factKey === factKey);
  if (candidates.length === 0) return null;

  const ranked = candidates.map((fact) => ({ fact, rank: inheritanceRank(fact) }));
  if (ranked.some((candidate) => candidate.rank === null)) return null;

  const valid = ranked as { fact: RuntimeDestinationFact; rank: number }[];
  valid.sort((a, b) => a.rank - b.rank);
  const nearestRank = valid[0]?.rank;
  if (nearestRank === undefined) return null;

  const nearest = valid.filter((candidate) => candidate.rank === nearestRank);
  if (nearest.length !== 1) return null;
  const selected = nearest[0];
  if (!selected) return null;
  if (isBlockingFact(selected.fact)) return null;
  return selected.fact;
}

export function resolveTopicCard(input: ResolveTopicCardInput): ResolvedTopicCard {
  const schema = input.cardSchemas.find((item) => item.cardId === input.topicId && item.topicId === input.topicId);
  const base: ResolvedTopicCard = {
    cardId: input.topicId,
    topicId: input.topicId,
    title: schema?.title || input.topicId,
    status: "unavailable",
    fields: {},
    assets: [],
    sourceIds: [],
    factLineage: [],
    missing: [],
  };

  if (!schema) {
    base.missing.push("card_schema");
    return base;
  }

  const links = input.cardFieldLinks.filter((link) => link.cardId === schema.cardId);
  if (links.length === 0) {
    base.missing.push("card_field_links");
    return base;
  }

  const topicFacts = input.facts.filter(
    (fact) => fact.destinationId === input.destinationId && fact.topicId === input.topicId,
  );
  const selectedFacts: RuntimeDestinationFact[] = [];

  for (const link of links.filter((item) => item.runtimeTab === "03_Destination_Facts")) {
    const factKey = factKeyFromLookup(link);
    if (!factKey) {
      if (link.required) base.missing.push(link.slotKey);
      continue;
    }
    const fact = resolveFactCandidate(topicFacts, factKey);
    if (!fact || !fact.factValue) {
      if (link.required) base.missing.push(link.slotKey);
      continue;
    }

    if (link.resolver === "CONTROLLED_ID_LIST") {
      const ids = parseControlledPlugIds(fact.factValue);
      if (!ids) {
        if (link.required) base.missing.push(link.slotKey);
        continue;
      }
      base.fields[link.buildOutput] = ids;
    } else {
      base.fields[link.buildOutput] = fact.factValue;
    }

    selectedFacts.push(fact);
    base.sourceIds.push(fact.sourceId);
    base.factLineage.push({
      factKey: fact.factKey,
      sourceId: fact.sourceId,
      lastReviewed: fact.lastReviewed,
      reviewDue: fact.reviewDue,
      inheritedFromDestinationId: fact.inheritedFromDestinationId,
      inheritanceLevel: fact.inheritanceLevel,
    });
  }

  if (input.topicId === "POWER") {
    const plugIds = base.fields.plugTypeIds;
    if (!Array.isArray(plugIds) || plugIds.length === 0) {
      base.missing.push("plug_assets");
    } else {
      for (const plugId of plugIds) {
        const matches = input.assets.filter((asset) =>
          asset.entityType === "PLUG_TYPE"
          && asset.entityId === plugId
          && asset.topicId === "POWER"
          && asset.assetRole === "PRIMARY_VISUAL"
          && Boolean(asset.productionPath),
        );
        const match = matches.length === 1 ? matches[0] : undefined;
        if (!match) {
          base.missing.push(`plug_asset:${plugId}`);
        } else {
          base.assets.push(match);
        }
      }
    }
  }

  if (input.topicId === "ENTRY") {
    const sourceId = typeof base.fields.officialSourceId === "string" ? base.fields.officialSourceId : "";
    const source = input.publicSources.find((item) => item.sourceId === sourceId && Boolean(item.url));
    if (!source) {
      base.missing.push("official_url");
    } else {
      base.publicSource = source;
      base.fields.officialUrl = source.url;
    }
  }

  base.sourceIds = unique(base.sourceIds);
  const reviewedDates = selectedFacts.map((fact) => fact.lastReviewed || "").filter(Boolean).sort();
  base.lastReviewed = reviewedDates.at(-1);
  base.missing = unique(base.missing);

  if (base.missing.length > 0) return base;
  base.status = input.topicId === "ENTRY" ? "official-confirmation-required" : "ready";
  return base;
}
