import { PollQuestion } from "@/types";
import { getSheetRows, isLive } from "./googleSheets";

type PollRow = {
  Question: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  Category: string;
  Status: string;
};

function mapRow(row: PollRow): PollQuestion {
  return {
    question: row.Question,
    options: [row.OptionA, row.OptionB, row.OptionC, row.OptionD].filter(
      (opt) => opt && opt.trim().length > 0
    ),
    category: row.Category,
    status: (row.Status as PollQuestion["status"]) || "Draft",
  };
}

/**
 * Not wired into any UI yet — the brief calls for the data layer now so a
 * "poll of the day" or engagement widget can be added later without a
 * schema migration. See README → Future roadmap.
 */
export async function getPollQuestions(category?: string): Promise<PollQuestion[]> {
  const rows = await getSheetRows<PollRow>("Poll Questions");
  if (!rows) return [];

  let polls = rows.map(mapRow).filter((p) => isLive(p.status) && p.question && p.options.length >= 2);
  if (category) {
    polls = polls.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  return polls;
}
