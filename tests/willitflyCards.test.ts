import { describe, expect, it } from "vitest";
import {
  resolveTopicCard,
  type CardAsset,
  type CardPublicSource,
  type RuntimeCardFieldLink,
  type RuntimeCardSchema,
  type RuntimeDestinationFact,
  type WillItFlyTopicId,
} from "@/lib/willitflyCards";

const schemas: RuntimeCardSchema[] = [
  {
    cardId: "POWER",
    cardType: "PRIMARY_TOPIC",
    topicId: "POWER",
    title: "Power",
    displayOrder: 1,
    componentKey: "TopicSummaryCard",
    interactionMode: "OPEN_DETAIL",
    requiredForRc1: true,
  },
  {
    cardId: "CONNECTIVITY",
    cardType: "PRIMARY_TOPIC",
    topicId: "CONNECTIVITY",
    title: "Connectivity",
    displayOrder: 2,
    componentKey: "TopicSummaryCard",
    interactionMode: "OPEN_DETAIL",
    requiredForRc1: true,
  },
  {
    cardId: "ENTRY",
    cardType: "PRIMARY_TOPIC",
    topicId: "ENTRY",
    title: "Entry",
    displayOrder: 4,
    componentKey: "TopicSummaryCard",
    interactionMode: "OPEN_DETAIL",
    requiredForRc1: true,
  },
];

function link(
  cardId: string,
  slotKey: string,
  factKey: string,
  buildOutput: string,
  resolver = "FACT_LOOKUP",
): RuntimeCardFieldLink {
  return {
    linkId: `${cardId}-${slotKey}`,
    cardId,
    slotKey,
    runtimeTab: "03_Destination_Facts",
    runtimeField: "Fact_Value",
    lookupKey: "Destination_ID + Topic_ID + Fact_Key",
    lookupValueSource: `Destination_ID + ${cardId} + ${factKey}`,
    resolver,
    required: true,
    multiple: resolver === "CONTROLLED_ID_LIST",
    buildOutput,
  };
}

const links: RuntimeCardFieldLink[] = [
  link("POWER", "voltage", "voltage_v", "voltage"),
  link("POWER", "frequency", "frequency_hz", "frequency"),
  link("POWER", "plug_type_ids", "plug_type_ids", "plugTypeIds", "CONTROLLED_ID_LIST"),
  {
    linkId: "P-004",
    cardId: "POWER",
    slotKey: "plug_assets",
    runtimeTab: "06_Assets",
    runtimeField: "Production_Path",
    lookupKey: "Entity_Type + Entity_ID + Topic_ID + Asset_Role",
    lookupValueSource: "PLUG_TYPE + each plug_type_id + POWER + PRIMARY_VISUAL",
    resolver: "ASSET_JOIN",
    required: true,
    multiple: true,
    buildOutput: "plugAssets[]",
  },
  link("POWER", "adapter_implication", "adapter_implication", "adapterImplication"),
  link("POWER", "converter_warning", "converter_warning", "converterWarning"),
  link("CONNECTIVITY", "coverage_status", "coverage_status", "coverageStatus"),
  link("CONNECTIVITY", "sim_esim", "sim_esim", "simEsim"),
  link("ENTRY", "entry_position", "entry_position", "entryPosition"),
  link("ENTRY", "official_handoff", "official_handoff", "officialSourceId", "SOURCE_ID"),
  {
    linkId: "E-003",
    cardId: "ENTRY",
    slotKey: "official_url",
    runtimeTab: "05_Public_Source_Links",
    runtimeField: "URL",
    lookupKey: "Source_ID",
    lookupValueSource: "officialSourceId",
    resolver: "SOURCE_JOIN",
    required: true,
    multiple: false,
    buildOutput: "officialUrl",
  },
];

function fact(
  topicId: WillItFlyTopicId,
  factKey: string,
  factValue: string,
  sourceId = "SRC-1",
  lastReviewed = "2026-08-11",
  overrides: Partial<RuntimeDestinationFact> = {},
): RuntimeDestinationFact {
  return {
    factId: `FACT-${topicId}-${factKey}-${sourceId}`,
    destinationId: "DEST-TEST",
    topicId,
    factKey,
    factValue,
    sourceId,
    lastReviewed,
    ...overrides,
  };
}

function resolve(
  topicId: WillItFlyTopicId,
  facts: RuntimeDestinationFact[],
  assets: CardAsset[] = [],
  publicSources: CardPublicSource[] = [],
) {
  return resolveTopicCard({
    destinationId: "DEST-TEST",
    topicId,
    facts,
    cardSchemas: schemas,
    cardFieldLinks: links,
    assets,
    publicSources,
  });
}

describe("resolveTopicCard", () => {
  it("marks Connectivity ready only when both required facts exist", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "MOBILE_COVERAGE_AVAILABLE_VARIES_BY_OPERATOR_LOCATION", "SRC-COV", "2026-08-10"),
      fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM", "2026-08-11"),
    ]);

    expect(result.status).toBe("ready");
    expect(result.fields.coverageStatus).toBe("MOBILE_COVERAGE_AVAILABLE_VARIES_BY_OPERATOR_LOCATION");
    expect(result.fields.simEsim).toBe("SIM_AND_ESIM_AVAILABLE");
    expect(result.sourceIds).toEqual(["SRC-COV", "SRC-SIM"]);
    expect(result.lastReviewed).toBe("2026-08-11");
    expect(result.missing).toEqual([]);
  });

  it("fails Connectivity closed when a required fact is missing", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "MOBILE_COVERAGE_AVAILABLE_VARIES_BY_OPERATOR_LOCATION"),
    ]);

    expect(result.status).toBe("unavailable");
    expect(result.missing).toContain("sim_esim");
  });

  it("prefers a direct destination fact over inherited parent and country candidates", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "DIRECT", "SRC-DIRECT"),
      fact("CONNECTIVITY", "coverage_status", "PARENT", "SRC-PARENT", "2026-08-10", {
        inheritedFromDestinationId: "DEST-PARENT",
        inheritanceLevel: "PARENT_1",
      }),
      fact("CONNECTIVITY", "coverage_status", "COUNTRY", "SRC-COUNTRY", "2026-08-09", {
        inheritedFromDestinationId: "DEST-COUNTRY",
        inheritanceLevel: "COUNTRY",
      }),
      fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM"),
    ]);

    expect(result.status).toBe("ready");
    expect(result.fields.coverageStatus).toBe("DIRECT");
    expect(result.sourceIds).toContain("SRC-DIRECT");
    expect(result.sourceIds).not.toContain("SRC-PARENT");
    expect(result.sourceIds).not.toContain("SRC-COUNTRY");
  });

  it("uses the nearest explicit parent before farther parent and country fallback", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "NEAREST_PARENT", "SRC-P1", "2026-08-11", {
        inheritedFromDestinationId: "DEST-PARENT-1",
        inheritanceLevel: "PARENT_1",
      }),
      fact("CONNECTIVITY", "coverage_status", "FAR_PARENT", "SRC-P2", "2026-08-10", {
        inheritedFromDestinationId: "DEST-PARENT-2",
        inheritanceLevel: "PARENT_2",
      }),
      fact("CONNECTIVITY", "coverage_status", "COUNTRY", "SRC-COUNTRY", "2026-08-09", {
        inheritedFromDestinationId: "DEST-COUNTRY",
        inheritanceLevel: "COUNTRY",
      }),
      fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM"),
    ]);

    expect(result.status).toBe("ready");
    expect(result.fields.coverageStatus).toBe("NEAREST_PARENT");
    expect(result.factLineage.find((item) => item.factKey === "coverage_status")).toMatchObject({
      sourceId: "SRC-P1",
      inheritedFromDestinationId: "DEST-PARENT-1",
      inheritanceLevel: "PARENT_1",
    });
  });

  it("uses country fallback only when no direct or parent candidate exists", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "COUNTRY", "SRC-COUNTRY", "2026-08-09", {
        inheritedFromDestinationId: "DEST-COUNTRY",
        inheritanceLevel: "COUNTRY",
      }),
      fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM"),
    ]);

    expect(result.status).toBe("ready");
    expect(result.fields.coverageStatus).toBe("COUNTRY");
    expect(result.factLineage.find((item) => item.factKey === "coverage_status")).toMatchObject({
      sourceId: "SRC-COUNTRY",
      inheritanceLevel: "COUNTRY",
    });
  });

  it("fails closed when the nearest inheritance rank is ambiguous", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "PARENT_A", "SRC-P1A", "2026-08-11", {
        inheritedFromDestinationId: "DEST-PARENT-A",
        inheritanceLevel: "PARENT_1",
      }),
      fact("CONNECTIVITY", "coverage_status", "PARENT_B", "SRC-P1B", "2026-08-11", {
        inheritedFromDestinationId: "DEST-PARENT-B",
        inheritanceLevel: "PARENT_1",
      }),
      fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM"),
    ]);

    expect(result.status).toBe("unavailable");
    expect(result.missing).toContain("coverage_status");
  });

  it("blocks deeper fallback when the nearer candidate is stale or not applicable", () => {
    for (const preparationState of ["STALE", "NOT_APPLICABLE"]) {
      const result = resolve("CONNECTIVITY", [
        fact("CONNECTIVITY", "coverage_status", "BLOCKER", "SRC-P1", "2026-08-11", {
          inheritedFromDestinationId: "DEST-PARENT-1",
          inheritanceLevel: "PARENT_1",
          preparationState,
        }),
        fact("CONNECTIVITY", "coverage_status", "COUNTRY", "SRC-COUNTRY", "2026-08-09", {
          inheritedFromDestinationId: "DEST-COUNTRY",
          inheritanceLevel: "COUNTRY",
        }),
        fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM"),
      ]);

      expect(result.status).toBe("unavailable");
      expect(result.missing).toContain("coverage_status");
    }
  });

  it("fails closed for unknown or incomplete inheritance lineage", () => {
    const result = resolve("CONNECTIVITY", [
      fact("CONNECTIVITY", "coverage_status", "UNKNOWN", "SRC-UNKNOWN", "2026-08-11", {
        inheritedFromDestinationId: "DEST-PARENT",
        inheritanceLevel: "PARENT",
      }),
      fact("CONNECTIVITY", "coverage_status", "COUNTRY", "SRC-COUNTRY", "2026-08-09", {
        inheritedFromDestinationId: "DEST-COUNTRY",
        inheritanceLevel: "COUNTRY",
      }),
      fact("CONNECTIVITY", "sim_esim", "SIM_AND_ESIM_AVAILABLE", "SRC-SIM"),
    ]);

    expect(result.status).toBe("unavailable");
    expect(result.missing).toContain("coverage_status");
  });

  it("returns official-confirmation-required for Entry only when the public source join resolves", () => {
    const result = resolve(
      "ENTRY",
      [
        fact("ENTRY", "entry_position", "CHECK_OFFICIAL_REQUIREMENTS", "SRC-ENTRY"),
        fact("ENTRY", "official_handoff", "SRC-ENTRY", "SRC-ENTRY"),
      ],
      [],
      [{ sourceId: "SRC-ENTRY", sourceName: "Official immigration", url: "https://example.gov/entry" }],
    );

    expect(result.status).toBe("official-confirmation-required");
    expect(result.fields.officialUrl).toBe("https://example.gov/entry");
    expect(result.publicSource?.sourceId).toBe("SRC-ENTRY");
  });

  it("fails Entry closed rather than inventing an official URL", () => {
    const result = resolve("ENTRY", [
      fact("ENTRY", "entry_position", "CHECK_OFFICIAL_REQUIREMENTS", "SRC-ENTRY"),
      fact("ENTRY", "official_handoff", "SRC-ENTRY", "SRC-ENTRY"),
    ]);

    expect(result.status).toBe("unavailable");
    expect(result.missing).toContain("official_url");
    expect(result.fields.officialUrl).toBeUndefined();
  });

  it("keeps Power unavailable when facts are complete but a required plug visual is absent", () => {
    const result = resolve("POWER", [
      fact("POWER", "voltage_v", "230", "SRC-POWER"),
      fact("POWER", "frequency_hz", "50", "SRC-POWER"),
      fact("POWER", "plug_type_ids", "G", "SRC-POWER"),
      fact("POWER", "adapter_implication", "MAY_NEED_ADAPTER", "SRC-POWER"),
      fact("POWER", "converter_warning", "CHECK_DEVICE_VOLTAGE_MAY_NEED_TRANSFORMER", "SRC-POWER"),
    ]);

    expect(result.status).toBe("unavailable");
    expect(result.missing).toContain("plug_asset:G");
  });

  it("marks Power ready only when each controlled plug ID has exactly one governed primary visual", () => {
    const facts = [
      fact("POWER", "voltage_v", "230", "SRC-POWER"),
      fact("POWER", "frequency_hz", "50", "SRC-POWER"),
      fact("POWER", "plug_type_ids", "C|F", "SRC-POWER"),
      fact("POWER", "adapter_implication", "MAY_NEED_ADAPTER", "SRC-POWER"),
      fact("POWER", "converter_warning", "CHECK_DEVICE_VOLTAGE_MAY_NEED_TRANSFORMER", "SRC-POWER"),
    ];
    const assets: CardAsset[] = [
      { assetId: "PLUG-C", entityType: "PLUG_TYPE", entityId: "C", topicId: "POWER", assetRole: "PRIMARY_VISUAL", productionPath: "/assets/plugs/c.webp" },
      { assetId: "PLUG-F", entityType: "PLUG_TYPE", entityId: "F", topicId: "POWER", assetRole: "PRIMARY_VISUAL", productionPath: "/assets/plugs/f.webp" },
    ];

    const result = resolve("POWER", facts, assets);

    expect(result.status).toBe("ready");
    expect(result.fields.plugTypeIds).toEqual(["C", "F"]);
    expect(result.assets.map((asset) => asset.assetId)).toEqual(["PLUG-C", "PLUG-F"]);
    expect(result.missing).toEqual([]);
  });

  it("rejects invalid plug taxonomy IDs", () => {
    const result = resolve("POWER", [
      fact("POWER", "voltage_v", "230"),
      fact("POWER", "frequency_hz", "50"),
      fact("POWER", "plug_type_ids", "G|Z"),
      fact("POWER", "adapter_implication", "MAY_NEED_ADAPTER"),
      fact("POWER", "converter_warning", "CHECK_DEVICE_VOLTAGE_MAY_NEED_TRANSFORMER"),
    ]);

    expect(result.status).toBe("unavailable");
    expect(result.missing).toContain("plug_type_ids");
  });
});
