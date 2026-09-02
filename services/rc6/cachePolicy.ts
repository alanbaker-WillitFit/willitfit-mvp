import type { Rc6CacheClass, Rc6DatasetName } from "./runtimeContract";
import { RC6_RUNTIME_DATASETS } from "./runtimeContract";

export type Rc6RefreshStrategy = "PUBLICATION_VERSION" | "DEPENDENCY_VERSION" | "DYNAMIC_FRESHNESS";

export interface Rc6CachePolicy {
  cacheClass: Rc6CacheClass;
  refreshStrategy: Rc6RefreshStrategy;
  hardStaleMs: number | null;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const DEFAULT_POLICY: Record<Rc6CacheClass, Rc6CachePolicy> = {
  CORE_STABLE: {
    cacheClass: "CORE_STABLE",
    refreshStrategy: "PUBLICATION_VERSION",
    hardStaleMs: null,
  },
  DEPENDENCY_DRIVEN: {
    cacheClass: "DEPENDENCY_DRIVEN",
    refreshStrategy: "DEPENDENCY_VERSION",
    hardStaleMs: null,
  },
  COMMERCIAL_DYNAMIC: {
    cacheClass: "COMMERCIAL_DYNAMIC",
    refreshStrategy: "DYNAMIC_FRESHNESS",
    hardStaleMs: null,
  },
};

const DATASET_OVERRIDES: Partial<Record<Rc6DatasetName, Partial<Rc6CachePolicy>>> = {
  offers: { hardStaleMs: 48 * HOUR },
  priceIntelligence: { hardStaleMs: 72 * HOUR },
  affiliateRoutes: { hardStaleMs: 7 * DAY },
};

export function getRc6CachePolicy(name: Rc6DatasetName): Rc6CachePolicy {
  const dataset = RC6_RUNTIME_DATASETS[name];
  return {
    ...DEFAULT_POLICY[dataset.cacheClass],
    ...DATASET_OVERRIDES[name],
    cacheClass: dataset.cacheClass,
  };
}

export function isBeyondHardStale(name: Rc6DatasetName, ageMs: number): boolean {
  const hardStaleMs = getRc6CachePolicy(name).hardStaleMs;
  return hardStaleMs !== null && ageMs > hardStaleMs;
}
