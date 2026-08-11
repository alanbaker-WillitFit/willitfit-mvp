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

export type ResolvedTopicCard = {
  cardId: string;
  topicId: WillItFlyTopicId;
  title: string;
  status: "ready" | "unavailable" | "official-confirmation-required";
  fields: Record<string, string | string[]>;
  assets: CardAsset[];
  sourceIds: string[];
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

  for (const link of links.filter((item) => item.runtimeTab === "03_Destination_Facts")) {
    const factKey = factKeyFromLookup(link);
    if (!factKey) {
      if (link.required) base.missing.push(link.slotKey);
      continue;
    }
    const fact = topicFacts.find((item) => item.factKey === factKey && item.factValue);
    if (!fact) {
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
    base.sourceIds.push(fact.sourceId);
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
  const reviewedDates = topicFacts.map((fact) => fact.lastReviewed || "").filter(Boolean).sort();
  base.lastReviewed = reviewedDates.at(-1);
  base.missing = unique(base.missing);

  if (base.missing.length > 0) return base;
  base.status = input.topicId === "ENTRY" ? "official-confirmation-required" : "ready";
  return base;
}
