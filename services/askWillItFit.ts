import { cache } from "react";
import { getSheetRows, toNumber } from "./googleSheets";
import { appendSheetRow } from "./googleSheetsWrite";
import { runtimeBoolean, runtimePublished } from "./runtimeContent";

export const ASK_QUESTION_TAB = "08.3_Ask_Questions";
export const ASK_ANSWER_TAB = "08.3.1_Ask_Answers";

type Row = Record<string, string>;

export interface OpenQuestion {
  questionId: string;
  question: string;
  category: string;
  displayOrder: number;
}

const PII_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?44\s?7\d{3}|07\d{3})[\s-]?\d{3}[\s-]?\d{3}\b/,
  /\b(?:booking|reservation|reference|pnr)\s*(?:number|no|ref)?\s*[:#-]?\s*[A-Z0-9-]{5,}\b/i,
];

function clean(input: unknown): string {
  return input == null ? "" : String(input).replace(/\s+/g, " ").trim();
}

function containsPersonalData(text: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(text));
}

function uniqueNumericId(prefix: "ASK-Q" | "ASK-A"): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return `${prefix}-${date}-${String(random).padStart(6, "0")}`;
}

function validateText(text: string, minimum: number, maximum: number): string {
  const value = clean(text);
  if (value.length < minimum) throw new Error(`Please enter at least ${minimum} characters.`);
  if (value.length > maximum) throw new Error(`Please keep the submission below ${maximum} characters.`);
  if (containsPersonalData(value)) {
    throw new Error("Please remove names, contact details, booking references or other personal information.");
  }
  return value;
}

export const getOpenQuestions = cache(async (): Promise<OpenQuestion[]> => {
  const rows = await getSheetRows<Row>(ASK_QUESTION_TAB);
  if (!rows) return [];
  return rows
    .filter((row) =>
      runtimePublished(row) &&
      runtimeBoolean(row.Active) &&
      clean(row["Public Status"]).toLowerCase() === "open for answers" &&
      !runtimeBoolean(row["Closed to Answers"])
    )
    .map((row) => ({
      questionId: clean(row["Question ID"]),
      question: clean(row["Public Question"] || row["Original Question"]),
      category: clean(row.Category) || "Travel question",
      displayOrder: toNumber(row["Display Order"], 999),
    }))
    .filter((item) => item.questionId && item.question)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.questionId.localeCompare(b.questionId));
});

export async function submitQuestion(question: string): Promise<string> {
  const value = validateText(question, 12, 500);
  const questionId = uniqueNumericId("ASK-Q");
  const submittedAt = new Date().toISOString();
  await appendSheetRow(ASK_QUESTION_TAB, [
    questionId,
    value,
    "",
    "Unclassified",
    "",
    "",
    submittedAt,
    "New",
    "Private",
    999,
    "No",
    "No",
    0,
    "No",
    "Passed automated check",
    "Website submission",
    "Private review queue. Original wording retained.",
    "",
  ]);
  return questionId;
}

export async function submitAnswer(questionId: string, answer: string): Promise<string> {
  const parentId = clean(questionId);
  if (!/^ASK-Q-\d{8}-\d{6}$/.test(parentId)) throw new Error("The selected question is invalid.");
  const value = validateText(answer, 20, 1500);
  const answerId = uniqueNumericId("ASK-A");
  await appendSheetRow(ASK_ANSWER_TAB, [
    answerId,
    parentId,
    value,
    "Community",
    new Date().toISOString(),
    "",
    "New",
    "No",
    999,
    "No",
    "No",
    "Passed automated check",
    "Website submission",
    "Private review queue. No live publication.",
    "",
  ]);
  return answerId;
}
