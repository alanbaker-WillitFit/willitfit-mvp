import { getCloudflareContext } from "@opennextjs/cloudflare";

type IntakePayload = {
  kind: "question" | "answer";
  id: string;
  submittedAt: string;
  values: Record<string, string | number>;
};

function runtimeEnv(): Record<string, string | undefined> {
  try {
    return getCloudflareContext().env as Record<string, string | undefined>;
  } catch {
    return process.env;
  }
}

function endpoint(): URL | null {
  const value = runtimeEnv().WILLIT_PUBLIC_INTAKE_ENDPOINT || process.env.WILLIT_PUBLIC_INTAKE_ENDPOINT;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "sheets.googleapis.com" || url.hostname === "oauth2.googleapis.com") return null;
    return url;
  } catch {
    return null;
  }
}

export async function submitPublicIntake(payload: IntakePayload): Promise<void> {
  const url = endpoint();
  if (!url) {
    throw new Error("The submission queue is temporarily unavailable");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-willit-intake-version": "1",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("The submission queue is temporarily unavailable");
}
