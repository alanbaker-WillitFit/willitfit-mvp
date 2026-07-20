import { cache } from "react";
import type { FitResult } from "@/types";
import { getSheetRows, isLive } from "./googleSheets";
import { getResultQuestions } from "./knowledge";

export type RecommendationProduct = {
  affiliateId: string;
  brand: string;
  product: string;
  category: string;
  affiliateUrl: string;
  imageUrl: string;
  region: string;
  attributes: string;
  merchantPriority: number;
};

export type RecommendationDecision = {
  intentId: string;
  questionId: string;
  ruleId: string;
  cardId: string;
  cardName: string;
  headline: string;
  ctaText: string;
  disclosure: string;
  products: RecommendationProduct[];
};

type IntentRow = {
  Intent_ID?: string;
  Question_ID?: string;
  Canonical_Intent?: string;
  Affiliate_Category?: string;
  Recommendation_Goal?: string;
  Eligible_Context?: string;
  Priority?: string;
  Suppression_Rule?: string;
  Disclosure_Rule?: string;
  Status?: string;
};

type RuleRow = {
  Rule_ID?: string;
  Intent_ID?: string;
  Result_State?: string;
  Additional_Condition?: string;
  Recommendation_Goal?: string;
  Product_Category?: string;
  Card_ID?: string;
  Priority?: string;
  Enabled?: string;
  Decision_Outcome?: string;
};

type CardRow = {
  Card_ID?: string;
  Card_Name?: string;
  Headline_Pattern?: string;
  CTA_Text?: string;
  Display_Context?: string;
  Max_Products?: string;
  Disclosure_Position?: string;
  Status?: string;
};

type ProductRow = {
  AffiliateID?: string;
  Brand?: string;
  Product?: string;
  Category?: string;
  AffiliateURL?: string;
  ImageURL?: string;
  Status?: string;
  Region?: string;
  Product_Attributes?: string;
  Merchant_Priority?: string;
  Last_Link_Check?: string;
};

type CommercialRows = {
  intents: IntentRow[];
  rules: RuleRow[];
  cards: CardRow[];
  products: ProductRow[];
};

function clean(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function resultState(result: FitResult): "Fit" | "Close" | "Fail" {
  if (result.verdict === "fits") return "Fit";
  if (result.verdict === "close") return "Close";
  return "Fail";
}

function stateMatches(ruleState: string, state: string): boolean {
  const normalised = ruleState.toLowerCase();
  return normalised === "any" || normalised.split("/").map((part) => part.trim()).includes(state.toLowerCase());
}

function categoryMatches(productCategory: string, ruleCategory: string): boolean {
  const product = productCategory.toLowerCase();
  return ruleCategory
    .split("/")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((category) => product === category || product.includes(category) || category.includes(product));
}

function mapProduct(row: ProductRow): RecommendationProduct | null {
  const affiliateUrl = clean(row.AffiliateURL);
  const affiliateId = clean(row.AffiliateID);
  const brand = clean(row.Brand);
  const product = clean(row.Product);
  const category = clean(row.Category);

  if (!isLive(row.Status) || !affiliateId || !brand || !product || !category || !isHttpsUrl(affiliateUrl)) {
    return null;
  }

  const imageUrl = clean(row.ImageURL);
  return {
    affiliateId,
    brand,
    product,
    category,
    affiliateUrl,
    imageUrl: isHttpsUrl(imageUrl) ? imageUrl : "",
    region: clean(row.Region) || "UK",
    attributes: clean(row.Product_Attributes),
    merchantPriority: numberValue(row.Merchant_Priority, 99),
  };
}

export function buildRecommendationDecision(
  result: FitResult,
  rows: CommercialRows
): RecommendationDecision | null {
  const state = resultState(result);
  const eligibleQuestionIds = new Set(
    getResultQuestions(result, 12)
      .filter((question) => question.affiliateEligible !== "No")
      .map((question) => question.questionId)
  );

  const intents = rows.intents
    .filter((intent) => clean(intent.Status).toLowerCase() !== "archived")
    .filter((intent) => eligibleQuestionIds.has(clean(intent.Question_ID)))
    .sort((a, b) => numberValue(a.Priority, 999) - numberValue(b.Priority, 999));

  const products = rows.products.map(mapProduct).filter((item): item is RecommendationProduct => item !== null);
  if (products.length === 0) return null;

  for (const intent of intents) {
    const intentId = clean(intent.Intent_ID);
    const matchingRules = rows.rules
      .filter((rule) => clean(rule.Enabled).toLowerCase() === "yes")
      .filter((rule) => clean(rule.Intent_ID) === intentId || clean(rule.Intent_ID) === "*")
      .filter((rule) => stateMatches(clean(rule.Result_State), state))
      .sort((a, b) => numberValue(a.Priority, 999) - numberValue(b.Priority, 999));

    for (const rule of matchingRules) {
      if (clean(rule.Card_ID) === "REC-000" || clean(rule.Product_Category).toLowerCase() === "none") return null;

      const card = rows.cards.find((candidate) => clean(candidate.Card_ID) === clean(rule.Card_ID));
      if (!card || !["draft", "validated", "live"].includes(clean(card.Status).toLowerCase())) continue;

      const maxProducts = Math.max(1, Math.min(3, numberValue(card.Max_Products, 2)));
      const matchingProducts = products
        .filter((product) => categoryMatches(product.category, clean(rule.Product_Category)))
        .sort((a, b) => a.merchantPriority - b.merchantPriority || a.product.localeCompare(b.product))
        .slice(0, maxProducts);

      if (matchingProducts.length === 0) continue;

      return {
        intentId,
        questionId: clean(intent.Question_ID),
        ruleId: clean(rule.Rule_ID),
        cardId: clean(card.Card_ID),
        cardName: clean(card.Card_Name),
        headline: clean(card.Headline_Pattern) || "Helpful options for your journey",
        ctaText: clean(card.CTA_Text) || "View suitable options",
        disclosure: clean(intent.Disclosure_Rule) || "We may earn a commission from qualifying purchases.",
        products: matchingProducts,
      };
    }
  }

  return null;
}

async function readCommercialRows(): Promise<CommercialRows | null> {
  const [intents, rules, cards, products] = await Promise.all([
    getSheetRows<IntentRow>("82_Affiliate_Intent_Map"),
    getSheetRows<RuleRow>("83_Affiliate_Rules"),
    getSheetRows<CardRow>("84_Recommendation_Cards"),
    getSheetRows<ProductRow>("09_Affiliate_Products"),
  ]);

  if (!intents || !rules || !cards || !products) return null;
  return { intents, rules, cards, products };
}

export async function getCommercialRecommendation(result: FitResult): Promise<RecommendationDecision | null> {
  const rows = await readCommercialRows();
  if (!rows) return null;
  return buildRecommendationDecision(result, rows);
}

export const getCachedCommercialRecommendation = cache(getCommercialRecommendation);
