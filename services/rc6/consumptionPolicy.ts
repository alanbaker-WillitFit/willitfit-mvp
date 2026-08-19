import type { Rc6DatasetName } from "./runtimeContract";

export const RC6_BLOCKED_DATASETS: Readonly<Partial<Record<Rc6DatasetName, string>>> = Object.freeze({});

export function rc6DatasetConsumptionBlock(name: Rc6DatasetName): string | null {
  return RC6_BLOCKED_DATASETS[name] ?? null;
}
