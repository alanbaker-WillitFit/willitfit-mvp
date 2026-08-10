import { describe, expect, it } from "vitest";

import {
  WILLITFLY_DESKTOP_VISIBLE_CARD_MAX,
  WILLITFLY_MAX_CARDS_PER_LAYER,
  WILLITFLY_MAX_LAYER_DEPTH,
  canOpenTargetLayer,
  isPublishableLayerCard,
  resolveDesktopCardRail,
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
  it("locks four supported layers, ten cards per layer and five visible desktop cards", () => {
    expect(WILLITFLY_MAX_LAYER_DEPTH).toBe(4);
    expect(WILLITFLY_MAX_CARDS_PER_LAYER).toBe(10);
    expect(WILLITFLY_DESKTOP_VISIBLE_CARD_MAX).toBe(5);
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

  it("preserves governed left-to-right order and scrolls desktop overflow after five cards", () => {
    const cards: RuntimeLayerCard[] = Array.from({ length: 7 }, (_, index) => ({
      ...baseCard,
      layerCardId: `LC-${index + 1}`,
      position: index + 1,
      displayOrder: index + 1,
    }));

    const published = resolvePublishedLayerCards(cards, "LAYER_1");
    const rail = resolveDesktopCardRail(published);

    expect(rail.orderedCards.map((card) => card.layerCardId)).toEqual([
      "LC-1",
      "LC-2",
      "LC-3",
      "LC-4",
      "LC-5",
      "LC-6",
      "LC-7",
    ]);
    expect(rail.visibleCardCount).toBe(5);
    expect(rail.horizontallyScrollable).toBe(true);
  });

  it("does not force scrolling when five or fewer desktop cards are published", () => {
    const cards: RuntimeLayerCard[] = Array.from({ length: 3 }, (_, index) => ({
      ...baseCard,
      layerCardId: `LC-${index + 1}`,
      position: index + 1,
      displayOrder: index + 1,
    }));

    const rail = resolveDesktopCardRail(resolvePublishedLayerCards(cards, "LAYER_1"));

    expect(rail.visibleCardCount).toBe(3);
    expect(rail.horizontallyScrollable).toBe(false);
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
