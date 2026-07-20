import { NextResponse } from "next/server";
import type { FitResult } from "@/types";
import { getCommercialRecommendation } from "@/services/recommendations";

export const runtime = "nodejs";

function isFitResult(value: unknown): value is FitResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<FitResult>;
  return Boolean(
    result.airline?.airlineId &&
      result.userDimensions &&
      result.limit &&
      ["fits", "close", "no-fit"].includes(String(result.verdict)) &&
      ["cabinBag", "personalItem"].includes(String(result.bagType))
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { result?: unknown };
    if (!isFitResult(body.result)) {
      return NextResponse.json({ recommendation: null }, { status: 400 });
    }

    const recommendation = await getCommercialRecommendation(body.result);
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("[recommendations] request failed", error);
    return NextResponse.json({ recommendation: null });
  }
}
