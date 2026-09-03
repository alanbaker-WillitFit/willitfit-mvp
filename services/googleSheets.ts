import { getPublicRuntimeTab } from "./publicRuntimeSnapshot";

export type SheetDiagnostic = {
  tabName: string;
  state: "snapshot" | "fallback" | "failed" | "empty";
  rowCount: number;
  fetchedAt: string | null;
  error: string | null;
  schemaValid: boolean;
  missingHeaders: string[];
  duplicateHeaders: string[];
};

const diagnostics = new Map<string, SheetDiagnostic>();

export async function getSheetRows<T extends Record<string, string>>(
  tabName: string
): Promise<T[] | null> {
  const rows = await getPublicRuntimeTab<T>(tabName);
  diagnostics.set(tabName, {
    tabName,
    state: rows === null ? "failed" : rows.length ? "snapshot" : "empty",
    rowCount: rows?.length ?? 0,
    fetchedAt: new Date().toISOString(),
    error: rows === null ? "Certified CURRENT/PREVIOUS runtime snapshot unavailable" : null,
    schemaValid: rows !== null,
    missingHeaders: [],
    duplicateHeaders: [],
  });
  return rows;
}

export function isLive(status: string | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  return s === "active" || s === "live";
}

export function toNumber(value: string | undefined, fallback = 0): number {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSheetDiagnostics(): SheetDiagnostic[] {
  return Array.from(diagnostics.values()).sort((a, b) => a.tabName.localeCompare(b.tabName));
}

export function clearSheetCaches(): void {
  diagnostics.clear();
}

export function getRuntimeSourceConfiguration(): {
  configured: boolean;
  spreadsheetId: string | null;
  authenticationConfigured: boolean;
} {
  return {
    configured: Boolean(process.env.WILLIT_SNAPSHOT_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL),
    spreadsheetId: null,
    authenticationConfigured: false,
  };
}
