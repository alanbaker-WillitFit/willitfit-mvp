import { NextResponse } from "next/server";
import { submitAnswer, submitQuestion, type AskSubmissionType } from "@/services/askWillItFit";

type Submission = {
  type?: AskSubmissionType | "answer";
  question?: string;
  questionId?: string;
  answer?: string;
  website?: string;
};

const QUESTION_TYPES = new Set<AskSubmissionType>(["question", "feature", "problem", "comment"]);

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Submission;
    if (payload.website) return NextResponse.json({ ok: true });

    if (payload.type && QUESTION_TYPES.has(payload.type as AskSubmissionType)) {
      const id = await submitQuestion(payload.question || "", payload.type as AskSubmissionType);
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (payload.type === "answer") {
      const id = await submitAnswer(payload.questionId || "", payload.answer || "");
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: "Unsupported submission type." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The submission could not be processed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
