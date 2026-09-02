import { cache } from "react";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";

export type GovernedNavigationItem = {
  id: string;
  label: string;
  url: string;
  displayOrder: number;
  openInNewTab: boolean;
  active: boolean;
  published: boolean;
};

type NavigationRow = Record<string, string>;
const NAVIGATION_TABS = ["07.1_Navigation", "Navigation"];

function value(row: NavigationRow, ...names: string[]) {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

async function loadNavigationItems(): Promise<GovernedNavigationItem[]> {
  const { rows } = await readFirstAvailableRuntimeTab<NavigationRow>(NAVIGATION_TABS);
  if (!rows) return [];

  return rows
    .map((row) => ({
      id: value(row, "Link ID", "LinkID"),
      label: value(row, "Label", "Link Label"),
      url: value(row, "URL", "Link URL"),
      displayOrder: toNumber(value(row, "Display Order", "Priority"), 999),
      openInNewTab: runtimeBoolean(value(row, "Open in New Tab", "New Tab")),
      active: runtimeBoolean(value(row, "Active")),
      published: runtimePublished(row),
    }))
    .filter((item) => item.id && item.label && item.url && item.published)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
}

export const getNavigationItems = cache(loadNavigationItems);
