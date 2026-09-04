import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readWithBuildFallback, type SnapshotSlot } from "@/services/publishingSnapshotFallback";

type RuntimeRow = Record<string, string>;

type RuntimeTabsSnapshot = {
  contractVersion: "1.0.0";
  generatedAt: string;
  generationId?: string;
  tabs: Record<string, RuntimeRow[]>;
  optionalMissing?: string[];
};

function runtimeEnv(): Record<string, string | undefined> {
  try {
    return getCloudflareContext().env as Record<string, string | undefined>;
  } catch {
    return process.env;
  }
}

function snapshotBase(): string | null {
  const env = runtimeEnv();
  const candidate = env.WILLIT_SNAPSHOT_BASE_URL || env.NEXT_PUBLIC_SITE_URL || process.env.WILLIT_SNAPSHOT_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!candidate) return null;
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function snapshotUrl(slot: SnapshotSlot): string | null {
  const base = snapshotBase();
  if (!base) return null;
  return new URL(`/data/${slot}/v1/willitfit-runtime-tabs.v1.json`, base).toString();
}

function validSnapshot(value: RuntimeTabsSnapshot): boolean {
  return value?.contractVersion === "1.0.0" && Boolean(value.tabs) && typeof value.tabs === "object" && !Array.isArray(value.tabs);
}

async function readSlot(slot: SnapshotSlot): Promise<RuntimeTabsSnapshot | null> {
  const url = snapshotUrl(slot);
  if (!url) return null;
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as RuntimeTabsSnapshot;
  } catch (error) {
    console.error(`[publicRuntimeSnapshot] ${slot} snapshot unavailable`, error);
    return null;
  }
}

const loadSnapshot = cache(async (): Promise<{ snapshot: RuntimeTabsSnapshot | null; slot: SnapshotSlot | null }> => {
  const result = await readWithBuildFallback<RuntimeTabsSnapshot>(readSlot, validSnapshot);
  if (result.slot === "previous") {
    console.warn("[publicRuntimeSnapshot] CURRENT invalid/unavailable; serving PREVIOUS runtime tabs");
  }
  return { snapshot: result.value, slot: result.slot };
});

export async function getPublicRuntimeTab<T extends RuntimeRow>(tabName: string): Promise<T[] | null> {
  const { snapshot } = await loadSnapshot();
  if (!snapshot) return null;
  const rows = snapshot.tabs[tabName];
  return Array.isArray(rows) ? rows as T[] : [];
}

export async function getPublicRuntimeSnapshotState(): Promise<{
  slot: SnapshotSlot | null;
  generationId: string | null;
  generatedAt: string | null;
}> {
  const { snapshot, slot } = await loadSnapshot();
  return {
    slot,
    generationId: snapshot?.generationId ?? null,
    generatedAt: snapshot?.generatedAt ?? null,
  };
}
