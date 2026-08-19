import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getRc6DraftReconciliationHealth } from "@/services/rc6/draftReconciliation";

export const dynamic = "force-dynamic";

function runtimeEnv(): Record<string, string | undefined> {
  try {
    return {
      ...process.env,
      ...(getCloudflareContext().env as Record<string, string | undefined>),
    };
  } catch {
    return process.env;
  }
}

export async function GET() {
  const env = runtimeEnv();
  if (String(env.RC6_DRAFT_DIAGNOSTICS_ENABLED ?? "").trim().toLowerCase() !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  const health = await getRc6DraftReconciliationHealth(env);
  return NextResponse.json(health, {
    status: health.status === "PASS" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
