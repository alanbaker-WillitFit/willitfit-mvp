import { readRc6Dataset } from "./runtimeReader";

type RuntimeRow = Record<string, string>;

export type Rc6NavigationItem = Readonly<{
  id: string;
  label: string;
  url: string;
  displayOrder: number;
  openInNewTab: boolean;
}>;

function truthy(value: string | undefined): boolean {
  return ["yes", "true", "1", "active", "published", "live"].includes(String(value ?? "").trim().toLowerCase());
}

export async function getRc6NavigationItems(): Promise<Rc6NavigationItem[]> {
  const result = await readRc6Dataset<RuntimeRow>("navigation");
  if (result.kind !== "READY_WITH_ROWS") return [];

  return result.rows
    .filter((row) => truthy(row.Active) && truthy(row.Publish))
    .map((row) => ({
      id: String(row["Link ID"] ?? "").trim(),
      label: String(row.Label ?? "").trim(),
      url: String(row.URL ?? "").trim(),
      displayOrder: Number.parseInt(String(row["Display Order"] ?? "999"), 10) || 999,
      openInNewTab: truthy(row["Open in New Tab"]),
    }))
    .filter((item) => item.id && item.label && /^https?:\/\//i.test(item.url))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
}
