import type { Rc6DatasetName } from "./runtimeContract";

export const RC6_BLOCKED_DATASETS: Readonly<Partial<Record<Rc6DatasetName, string>>> = Object.freeze({
  airlineRules: "CD-001: Runtime_RC6 does not project governed Sizing Method and Limit Operator fields.",
});

export function rc6DatasetConsumptionBlock(name: Rc6DatasetName): string | null {
  return RC6_BLOCKED_DATASETS[name] ?? null;
}
