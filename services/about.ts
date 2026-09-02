import { cache } from "react";
import type { RuntimeContentRecord } from "@/types";
import { getRuntimeContent } from "./runtimeContent";

export interface AboutContent {
  heading: string;
  sections: RuntimeContentRecord[];
}

export function buildGovernedAboutContent(records: RuntimeContentRecord[]): AboutContent | null {
  const sections = records
    .filter((record) => record.published && record.active && record.title.trim() && record.body.trim())
    .sort((a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId));

  const lead = sections[0];
  if (!lead) return null;

  return {
    heading: lead.title.trim(),
    sections,
  };
}

export const getAboutContent = cache(async (): Promise<AboutContent | null> => {
  const { content, source } = await getRuntimeContent({ module: "About", page: "about" });

  // About is governed public content. Never present bundled fallback copy as approved live content.
  if (source !== "sheet") return null;

  return buildGovernedAboutContent(content);
});
