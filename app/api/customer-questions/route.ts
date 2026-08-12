import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const MAX_QUESTION_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 6000;

function clean(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: NextRequest) {
  const feedUrl = process.env.WILLIT_CUSTOMER_QUESTION_FEED_URL?.trim();
  const feedToken = process.env.WILLIT_CUSTOMER_QUESTION_TOKEN?.trim();

  if (!feedUrl || !feedToken) {
    return NextResponse.json(
      { ok: false, error: "Question review is not available yet." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const question = clean(body?.question, MAX_QUESTION_LENGTH);
    const context = clean(body?.context, MAX_CONTEXT_LENGTH);
    const sourcePage = clean(body?.source_page, 1000) || "/ask";

    if (question.length < 4) {
      return NextResponse.json(
        { ok: false, error: "Please enter a little more detail." },
        { status: 400 },
      );
    }

    const externalQuestionId = `WIF-${randomUUID()}`;
    const upstream = await fetch(feedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WillIt-Question-Token": feedToken,
      },
      body: JSON.stringify({
        product: "WillItFit",
        question,
        context,
        source_page: sourcePage,
        external_question_id: externalQuestionId,
      }),
      cache: "no-store",
    });

    const result = await upstream.json().catch(() => null) as
      | { ok?: boolean; question_id?: string; status?: string; error?: string }
      | null;

    if (!upstream.ok || !result?.ok) {
      return NextResponse.json(
        { ok: false, error: "We could not add that question for review just now." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      question_id: result.question_id,
      status: result.status ?? "pending",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not add that question for review just now." },
      { status: 500 },
    );
  }
}
