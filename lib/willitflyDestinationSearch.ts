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

function canonicalTerms(destination: WillItFlyDestination): string[] {
  return [destination.displayName, destination.slug.replace(/-/g, " ")]
    .map(normalizeSearchValue)
    .filter(Boolean);
}

function aliasTerms(destination: WillItFlyDestination): string[] {
  return destination.aliases.map(normalizeSearchValue).filter(Boolean);
}

function matchRank(destination: WillItFlyDestination, normalizedQuery: string): number | null {
  const canonical = canonicalTerms(destination);
  const aliases = aliasTerms(destination);

  if (!normalizedQuery) return 6;
  if (canonical.some((term) => term === normalizedQuery)) return 0;
  if (aliases.some((term) => term === normalizedQuery)) return 1;
  if (canonical.some((term) => term.startsWith(normalizedQuery))) return 2;
  if (aliases.some((term) => term.startsWith(normalizedQuery))) return 3;
  if (canonical.some((term) => term.includes(normalizedQuery))) return 4;
  if (aliases.some((term) => term.includes(normalizedQuery))) return 5;
  return null;
}

export function resolveDestinationSearch(destinations: WillItFlyDestination[], query: string): WillItFlyDestination | null {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return null;

  const exact = destinations
    .map((destination) => ({ destination, rank: matchRank(destination, normalizedQuery) }))
    .filter((entry): entry is { destination: WillItFlyDestination; rank: number } => entry.rank === 0 || entry.rank === 1)
    .sort((a, b) => a.rank - b.rank || a.destination.displayName.localeCompare(b.destination.displayName));

  if (exact.length === 0) return null;
  const bestRank = exact[0]?.rank;
  if (bestRank === undefined) return null;
  const best = exact.filter((entry) => entry.rank === bestRank);
  return best.length === 1 ? best[0]?.destination ?? null : null;
}

export function suggestDestinationSearch(destinations: WillItFlyDestination[], query: string, limit = 8): WillItFlyDestination[] {
  const normalizedQuery = normalizeSearchValue(query);
  return destinations
    .map((destination) => ({ destination, rank: matchRank(destination, normalizedQuery) }))
    .filter((entry): entry is { destination: WillItFlyDestination; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.destination.displayName.localeCompare(b.destination.displayName))
    .slice(0, limit)
    .map((entry) => entry.destination);
}
