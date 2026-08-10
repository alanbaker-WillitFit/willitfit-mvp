export const WILLITFLY_MAX_LAYER_DEPTH = 4;
export const WILLITFLY_MAX_CARDS_PER_LAYER = 10;

export type WillItFlyLayerId = "LAYER_1" | "LAYER_2" | "LAYER_3" | "LAYER_4";
export type WillItFlyCardType = "FACT" | "PRODUCT";
export type WillItFlyVisualMode = "DEDICATED_ASSET" | "MAP_FALLBACK";

export type RuntimeLayerCard = {
  layerCardId: string;
  layerId: WillItFlyLayerId;
  destinationId: string;
  topicId?: string;
  position: number;
  cardType: WillItFlyCardType;
  contentRefId: string;
  cardTitle: string;
  summary?: string;
  visualAssetId?: string;
  targetLayerId?: WillItFlyLayerId;
  targetRouteKey?: string;
  active: boolean;
  reviewStatus: string;
  publish: boolean;
  displayOrder: number;
};

export type LayerVisualDecision =
  | { mode: "DEDICATED_ASSET"; visualAssetId: string }
  | { mode: "MAP_FALLBACK" };

const PUBLISHABLE_REVIEW_STATUSES = new Set(["APPROVED", "REVIEWED"]);

export function isPublishableLayerCard(card: RuntimeLayerCard): boolean {
  return (
    card.active &&
    card.publish &&
    PUBLISHABLE_REVIEW_STATUSES.has(card.reviewStatus.trim().toUpperCase()) &&
    Number.isInteger(card.position) &&
    card.position >= 1 &&
    card.position <= WILLITFLY_MAX_CARDS_PER_LAYER &&
    Number.isFinite(card.displayOrder)
  );
}

export function resolvePublishedLayerCards(
  cards: RuntimeLayerCard[],
  layerId: WillItFlyLayerId,
): RuntimeLayerCard[] {
  return cards
    .filter((card) => card.layerId === layerId && isPublishableLayerCard(card))
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      if (a.position !== b.position) {
        return a.position - b.position;
      }

      return a.layerCardId.localeCompare(b.layerCardId);
    })
    .slice(0, WILLITFLY_MAX_CARDS_PER_LAYER);
}

export function resolveLayerVisual(card: RuntimeLayerCard): LayerVisualDecision {
  const visualAssetId = card.visualAssetId?.trim();

  if (visualAssetId) {
    return { mode: "DEDICATED_ASSET", visualAssetId };
  }

  return { mode: "MAP_FALLBACK" };
}

export function canOpenTargetLayer(card: RuntimeLayerCard): boolean {
  return Boolean(card.targetLayerId || card.targetRouteKey?.trim());
}
