import questionEngine from "@/data/question-engine.json";
import type { Dimensions, FitResult } from "@/types";

export type KnowledgeObject = {
  knowledgeId: string;
  questionId: string;
  answerObjectId: string;
  primaryQuestion: string;
  slug: string;
  alternativeQuestions: string[];
  searchTerms: string[];
  category: string;
  intent: string;
  quickAnswer: string;
  detailedAnswer: string;
  relatedKnowledgeIds: string[];
  priority: number;
  reviewedDate: string;
  sourceLabel: string;
  sourceUrl?: string;
  destinationUrl: string;
  publishEligibility: string;
};

export type ResultQuestion = KnowledgeObject & {
  routingId: string;
  nextActionType: string;
  nextActionLabel: string;
  affiliateEligible: "Yes" | "Conditional" | "No";
  displayPriority: number;
};

type AnswerRow = (typeof questionEngine.answers)[number];
type RouteRow = (typeof questionEngine.routes)[number];
type TriggerRow = (typeof questionEngine.triggers)[number];
type RelationshipRow = (typeof questionEngine.relationships)[number];

type TriggerContextValue = string | number | boolean | null | undefined;

type TriggerEffects = {
  activated: Set<string>;
  suppressed: Set<string>;
  priorityAdjustments: Map<string, number>;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function splitIds(value: unknown): string[] {
  return text(value).split("|").map((item) => item.trim()).filter((item) => /^Q-\d{4}$/.test(item));
}

function isBlocked(answer: AnswerRow): boolean {
  return text(answer.Publish_Eligibility).toLowerCase() === "blocked" ||
    text(answer.Answer_Readiness).toLowerCase() === "authoring required" ||
    !text(answer.Quick_Answer) ||
    !text(answer.Detailed_Answer);
}

function toKnowledge(answer: AnswerRow): KnowledgeObject {
  const questionId = text(answer.Question_ID);
  return {
    knowledgeId: text(answer.Answer_Source_ID) || questionId,
    questionId,
    answerObjectId: text(answer.Answer_Object_ID),
    primaryQuestion: text(answer.Canonical_Question),
    slug: text(answer.Slug),
    alternativeQuestions: [],
    searchTerms: [text(answer.Canonical_Question), text(answer.AI_Summary)].filter(Boolean),
    category: text(answer.Answer_Source_Type) || "Travel knowledge",
    intent: "Answer",
    quickAnswer: text(answer.Quick_Answer),
    detailedAnswer: text(answer.Detailed_Answer),
    relatedKnowledgeIds: [],
    priority: 50,
    reviewedDate: text(answer.Last_Reviewed) || "Review pending",
    sourceLabel: text(answer.Evidence_Owner) || text(answer.Source_Sheet) || "WillItFit knowledge engine",
    destinationUrl: text(answer.Destination_URL) || `/ask/${text(answer.Slug)}`,
    publishEligibility: text(answer.Publish_Eligibility),
  };
}

export const KNOWLEDGE_OBJECTS: KnowledgeObject[] = questionEngine.answers
  .filter((answer) => !isBlocked(answer))
  .map(toKnowledge);

const KNOWLEDGE_BY_QUESTION_ID = new Map(KNOWLEDGE_OBJECTS.map((item) => [item.questionId, item]));

export function getKnowledgeBySlug(slug: string): KnowledgeObject | undefined {
  return KNOWLEDGE_OBJECTS.find((item) => item.slug === slug);
}

function approvedRelationship(row: RelationshipRow): boolean {
  return text(row.Status).toLowerCase() === "approved";
}

/**
 * Related answers are derived from the governed relationship graph. The graph
 * currently relates questions through shared approved triggers, so this method
 * finds other publishable questions governed by the same trigger(s). It does
 * not fall back to category similarity, which would bypass RC15 governance.
 */
export function getRelatedKnowledge(item: KnowledgeObject): KnowledgeObject[] {
  const graph = questionEngine.relationships.filter(approvedRelationship);
  const triggerIds = new Set(
    graph
      .filter((row) => text(row.To_Entity_Type) === "Question")
      .filter((row) => text(row.To_Entity_ID) === item.questionId)
      .map((row) => text(row.Trigger_ID) || text(row.From_Entity_ID))
      .filter(Boolean)
  );

  const ordered = graph
    .filter((row) => text(row.To_Entity_Type) === "Question")
    .filter((row) => text(row.Relationship_Type) === "Activates")
    .filter((row) => triggerIds.has(text(row.Trigger_ID) || text(row.From_Entity_ID)))
    .filter((row) => text(row.To_Entity_ID) !== item.questionId)
    .sort((a, b) => numberValue(a.Display_Order, 999) - numberValue(b.Display_Order, 999));

  const seen = new Set<string>();
  return ordered.flatMap((row) => {
    const questionId = text(row.To_Entity_ID);
    if (!questionId || seen.has(questionId)) return [];
    const knowledge = KNOWLEDGE_BY_QUESTION_ID.get(questionId);
    if (!knowledge) return [];
    seen.add(questionId);
    return [knowledge];
  }).slice(0, 3);
}

function resultToken(result: FitResult): "Fit" | "Close" | "Fail" {
  if (result.verdict === "fits") return "Fit";
  if (result.verdict === "close") return "Close";
  return "Fail";
}

function bagToken(result: FitResult): "Cabin" | "Personal" {
  return result.bagType === "cabinBag" ? "Cabin" : "Personal";
}

function dimensionDiff(result: FitResult): Dimensions {
  if (!result.orientationUsed || !result.limit) {
    return {
      heightCm: 0,
      widthCm: 0,
      depthCm: 0,
    };
  }

  return {
    heightCm: result.orientationUsed.heightCm - result.limit.heightCm,
    widthCm: result.orientationUsed.widthCm - result.limit.widthCm,
    depthCm: result.orientationUsed.depthCm - result.limit.depthCm,
  };
}

function dominantDimension(result: FitResult): "Height" | "Width" | "Depth" {
  const diff = dimensionDiff(result);
  const pairs: Array<["Height" | "Width" | "Depth", number]> = [
    ["Height", diff.heightCm], ["Width", diff.widthCm], ["Depth", diff.depthCm],
  ];
  pairs.sort((a, b) => b[1] - a[1]);
  return pairs[0]![0];
}

function minimumMargin(result: FitResult): number | undefined {
  if (result.verdict === "fits") {
    const values = Object.values(result.spareCm).filter((value): value is number => typeof value === "number");
    return values.length ? Math.min(...values) : undefined;
  }
  if (result.verdict === "close") return result.withinCm ?? undefined;
  return undefined;
}

function triggerInput(field: string, result: FitResult): TriggerContextValue {
  switch (field) {
    case "measurement_includes_wheels_handles": return undefined;
    case "airline_weight_limit_kg": return result.weightLimitKg;
    case "minimum_margin_cm": return minimumMargin(result);
    case "failed_dimension_count": return Object.values(result.overBy).filter((value) => typeof value === "number" && value > 0).length;
    case "dominant_dimension": return dominantDimension(result);
    case "bag_structure": return undefined;
    case "bag_type": return result.bagType === "cabinBag" ? "Cabin Bag" : "Personal Item";
    case "larger_allowance_available": return undefined;
    case "airline_id": return text(result.airline.airlineId) || null;
    case "answer_publish_eligibility": return "Eligible"; // blocked answers are removed before routing
    case "affiliate_eligible": return undefined; // commercial action is evaluated after answers render
    default: return undefined;
  }
}

function applies(trigger: TriggerRow, result: FitResult): boolean {
  const results = text(trigger.Applies_To_Result).split("|");
  if (results.length && !results.includes(resultToken(result))) return false;
  const bags = text(trigger.Applies_To_Bag_Type).split("|");
  if (bags.length && !bags.includes(bagToken(result))) return false;
  const dimension = text(trigger.Applies_To_Dimension);
  if (dimension && dimension !== "Any" && dimension !== "None" && dimension !== dominantDimension(result)) return false;
  return text(trigger.Governance_Status).toLowerCase() === "approved";
}

function matchesOperator(value: TriggerContextValue, operator: string, triggerValue: unknown): boolean {
  const expected = text(triggerValue).toLowerCase();
  const op = operator.toLowerCase();
  if (op === "is blank") return value == null || text(value) === "";
  if (op === "not equal") return text(value).toLowerCase() !== expected;
  if (op === "equals") {
    if (expected === "unknown/no") return value !== true;
    if (expected === "true") return value === true || text(value).toLowerCase() === "true";
    if (expected === "false") return value === false || text(value).toLowerCase() === "false";
    if (expected.includes("/")) return expected.split("/").includes(text(value).toLowerCase());
    return text(value).toLowerCase() === expected;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return false;
  const expectedNumber = Number(expected);
  if (op === "greater than") return numeric > expectedNumber;
  if (op === "greater than or equal") return numeric >= expectedNumber;
  if (op === "between") {
    const numbers = expected.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    return numbers.length >= 2 ? numeric >= numbers[0]! && numeric < numbers[1]! : false;
  }
  return false;
}

function applyUnknownFallback(trigger: TriggerRow, effects: TriggerEffects): void {
  const fallback = text(trigger.Fallback_When_Unknown).toLowerCase();
  const activated = splitIds(trigger.Question_IDs_Activated);
  const suppressed = splitIds(trigger.Question_IDs_Suppressed);
  if (fallback.startsWith("activate")) {
    const adjustment = numberValue(trigger.Priority_Adjustment, 0);
    activated.forEach((id) => {
      effects.activated.add(id);
      effects.priorityAdjustments.set(id, (effects.priorityAdjustments.get(id) ?? 0) + adjustment);
    });
  }
  if (fallback.startsWith("suppress")) [...activated, ...suppressed].forEach((id) => effects.suppressed.add(id));
}

/** Contract QEC-005: suppression, then activation, then priority adjustment. */
function evaluateTriggers(result: FitResult): TriggerEffects {
  const matched: TriggerRow[] = [];
  const effects: TriggerEffects = { activated: new Set(), suppressed: new Set(), priorityAdjustments: new Map() };

  for (const trigger of questionEngine.triggers) {
    if (!applies(trigger, result)) continue;
    const value = triggerInput(text(trigger.Input_Field), result);
    if (value === undefined) {
      applyUnknownFallback(trigger, effects);
      continue;
    }
    if (matchesOperator(value, text(trigger.Operator), trigger.Trigger_Value)) matched.push(trigger);
  }

  // 1. Suppression
  matched.forEach((trigger) => splitIds(trigger.Question_IDs_Suppressed).forEach((id) => effects.suppressed.add(id)));
  // 2. Activation
  matched.forEach((trigger) => splitIds(trigger.Question_IDs_Activated).forEach((id) => effects.activated.add(id)));
  // 3. Priority adjustment
  matched.forEach((trigger) => {
    const adjustment = numberValue(trigger.Priority_Adjustment, 0);
    splitIds(trigger.Question_IDs_Activated).forEach((id) => {
      effects.priorityAdjustments.set(id, (effects.priorityAdjustments.get(id) ?? 0) + adjustment);
    });
  });

  return effects;
}

function routeFlag(route: RouteRow, result: FitResult): string {
  if (result.verdict === "fits") return text(route.Show_On_Fit);
  if (result.verdict === "close") return text(route.Show_On_Close);
  return text(route.Show_On_Fail);
}

function routePassesStructuralContext(route: RouteRow, result: FitResult): boolean {
  const bagFilter = text(route.Bag_Type_Filter).toLowerCase();
  const allowsCabin = bagFilter.includes("cabin") || bagFilter === "universal" || bagFilter === "any";
  const allowsPersonal = bagFilter.includes("personal") || bagFilter === "universal" || bagFilter === "any";
  if (result.bagType === "cabinBag" && !allowsCabin) return false;
  if (result.bagType === "personalItem" && !allowsPersonal) return false;
  if (text(route.Airline_Context_Required) === "Yes" && !text(result.airline.airlineId)) return false;
  if (text(route.Fare_Context_Required) === "Yes" && !result.fareClass) return false;
  return true;
}

export function getResultQuestions(result: FitResult, limit = 3): ResultQuestion[] {
  const effects = evaluateTriggers(result);
  return questionEngine.routes
    .filter((route) => routePassesStructuralContext(route, result))
    .filter((route) => {
      const id = text(route.Question_ID);
      if (effects.suppressed.has(id)) return false;
      const flag = routeFlag(route, result);
      return flag === "Yes" || effects.activated.has(id);
    })
    .flatMap((route) => {
      const questionId = text(route.Question_ID);
      const knowledge = KNOWLEDGE_BY_QUESTION_ID.get(questionId);
      if (!knowledge) return [];
      return [{
        ...knowledge,
        routingId: text(route.Routing_ID),
        nextActionType: text(route.Next_Action_Type),
        nextActionLabel: text(route.Next_Action_Label) || "Learn more",
        affiliateEligible: (text(route.Affiliate_Eligible) || "No") as ResultQuestion["affiliateEligible"],
        displayPriority: numberValue(route.Display_Priority, 999) + (effects.priorityAdjustments.get(questionId) ?? 0),
      }];
    })
    .sort((a, b) => a.displayPriority - b.displayPriority || a.primaryQuestion.localeCompare(b.primaryQuestion))
    .slice(0, limit);
}

export const QUESTION_ENGINE_CONTRACT_VERSION = questionEngine.contractVersion;
