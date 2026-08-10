import { describe, expect, it } from "vitest";

import {
  WILLITFLY_MAX_CARDS_PER_LAYER,
  WILLITFLY_MAX_LAYER_DEPTH,
  canOpenTargetLayer,
  isPublishableLayerCard,
  resolveLayerVisual,
  resolvePublishedLayerCards,
  type RuntimeLayerCard,
} from "../lib/willitflyLayerEngine";

const baseCard: RuntimeLayerCard = {
  layerCardId: "LC-001",
  layerId: "LAYER_1",
  destinationId: "DEST-JP",
  topicId: "POWER",
  position: 1,
  cardType: "FACT",
  contentRefId: "FACT-001",
  cardTitle: "Power",
  active: true,
  reviewStatus: "APPROVED",
  publish: true,
  displayOrder: 1,
};

describe("WillItFly layer engine", () => {
  it("locks four supported layers and ten cards per layer", () => {
    expect(WILLITFLY_MAX_LAYER_DEPTH).toBe(4);
    expect(WILLITFLY_MAX_CARDS_PER_LAYER).toBe(10);
  });

  it("renders only active, reviewed, publishable cards", () => {
    const unpublished = { ...baseCard, layerCardId: "LC-002", publish: false };
    const unreviewed = { ...baseCard, layerCardId: "LC-003", reviewStatus: "DRAFT" };

    expect(isPublishableLayerCard(baseCard)).toBe(true);
    expect(isPublishableLayerCard(unpublished)).toBe(false);
    expect(isPublishableLayerCard(unreviewed)).toBe(false);
  });

  it("compacts published cards without blank positions", () => {
    const cards: RuntimeLayerCard[] = [
      { ...baseCard, layerCardId: "LC-001", position: 1, displayOrder: 1 },
      { ...baseCard, layerCardId: "LC-002", position: 2, displayOrder: 2, publish: false },
      { ...baseCard, layerCardId: "LC-003", position: 4, displayOrder: 4 },
    ];

    const resolved = resolvePublishedLayerCards(cards, "LAYER_1");

    expect(resolved.map((card) => card.layerCardId)).toEqual(["LC-001", "LC-003"]);
    expect(resolved).toHaveLength(2);
  });

  it("treats FACT and PRODUCT cards as peers in the same sequence", () => {
    const cards: RuntimeLayerCard[] = [
      { ...baseCard, layerCardId: "LC-FACT", position: 1, displayOrder: 1, cardType: "FACT" },
      { ...baseCard, layerCardId: "LC-PRODUCT", position: 2, displayOrder: 2, cardType: "PRODUCT" },
    ];

    expect(resolvePublishedLayerCards(cards, "LAYER_1").map((card) => card.cardType)).toEqual([
      "FACT",
      "PRODUCT",
    ]);
  });

  it("uses the map as visual fallback when no governed graphic exists", () => {
    expect(resolveLayerVisual(baseCard)).toEqual({ mode: "MAP_FALLBACK" });
    expect(resolveLayerVisual({ ...baseCard, visualAssetId: "ASSET-PLUG-A" })).toEqual({
      mode: "DEDICATED_ASSET",
      visualAssetId: "ASSET-PLUG-A",
    });
  });

  it("opens deeper layers only from governed targets", () => {
    expect(canOpenTargetLayer(baseCard)).toBe(false);
    expect(canOpenTargetLayer({ ...baseCard, targetLayerId: "LAYER_2" })).toBe(true);
  });
});
