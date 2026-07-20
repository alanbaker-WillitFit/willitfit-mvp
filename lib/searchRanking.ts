export function normaliseSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? right.length;
}

function termScore(term: string, value: string): number {
  const words = normaliseSearch(value).split(" ").filter(Boolean);
  if (normaliseSearch(value).startsWith(term)) return 30;
  if (words.some((word) => word.startsWith(term))) return 24;
  if (words.some((word) => word.includes(term))) return 18;
  const fuzzy = words.some((word) => {
    const tolerance = Math.max(term.length, word.length) >= 7 ? 2 : 1;
    return editDistance(term, word) <= tolerance;
  });
  return fuzzy ? 12 : 0;
}

export function scoreSearchFields(query: string, weightedFields: Array<{ value: string; weight: number }>): number {
  const terms = normaliseSearch(query).split(" ").filter(Boolean);
  if (terms.length === 0) return 0;
  return terms.reduce((total, term) => total + Math.max(...weightedFields.map(({ value, weight }) => termScore(term, value) * weight)), 0);
}
