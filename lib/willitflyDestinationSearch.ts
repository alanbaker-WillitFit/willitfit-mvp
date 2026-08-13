import type { WillItFlyDestination } from "@/services/willitflyRuntime";

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function searchTerms(destination: WillItFlyDestination): string[] {
  return [
    destination.displayName,
    destination.slug.replace(/-/g, " "),
    ...destination.aliases,
  ]
    .map(normalizeSearchValue)
    .filter(Boolean);
}

export function resolveDestinationSearch(
  destinations: WillItFlyDestination[],
  query: string,
): WillItFlyDestination | null {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return null;

  return destinations.find((destination) =>
    searchTerms(destination).includes(normalizedQuery),
  ) ?? null;
}

export function suggestDestinationSearch(
  destinations: WillItFlyDestination[],
  query: string,
  limit = 8,
): WillItFlyDestination[] {
  const normalizedQuery = normalizeSearchValue(query);
  const candidates = destinations.map((destination) => {
    const terms = searchTerms(destination);
    let score = 3;

    if (normalizedQuery) {
      if (terms.some((term) => term === normalizedQuery)) score = 0;
      else if (terms.some((term) => term.startsWith(normalizedQuery))) score = 1;
      else if (terms.some((term) => term.includes(normalizedQuery))) score = 2;
      else return null;
    }

    return { destination, score };
  }).filter((entry): entry is { destination: WillItFlyDestination; score: number } => Boolean(entry));

  return candidates
    .sort((a, b) => a.score - b.score || a.destination.displayName.localeCompare(b.destination.displayName))
    .slice(0, limit)
    .map((entry) => entry.destination);
}
