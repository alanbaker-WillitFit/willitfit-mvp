import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSheetCaches, getSheetDiagnostics } from '@/services/googleSheets';

vi.mock('@/services/airlines', () => ({
  getCachedAirlines: vi.fn(async () => ({
    airlines: [{ slug: 'shared-slug' }, { slug: 'airline-only' }],
    source: 'sheet',
  })),
}));

vi.mock('@/services/seoPages', () => ({
  getCachedSeoPages: vi.fn(async () => [
    { pageSlug: 'shared-slug' },
    { pageSlug: 'seo-only' },
  ]),
}));

import { getDataDiagnostics } from '@/services/diagnostics';

describe('data diagnostics', () => {
  beforeEach(() => clearSheetCaches());

  it('returns a timestamp, sheet collection, and cross-resource collisions', async () => {
    const result = await getDataDiagnostics();
    expect(Number.isNaN(Date.parse(result.generatedAt))).toBe(false);
    expect(result.sheets).toEqual([]);
    expect(result.routingCollisions).toEqual([
      { slug: 'shared-slug', resources: ['airline', 'seo-page'] },
    ]);
    expect(getSheetDiagnostics()).toEqual([]);
  });
});
