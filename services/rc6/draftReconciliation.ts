import { loadRc6DraftCheckerCatalogue } from "./runtimeBinding";
import type { Rc6CheckerCatalogue } from "./checker";

export type Rc6DraftReconciliationHealth = Readonly<{
  status: "PASS" | "UNAVAILABLE";
  airlineCount: number;
  ruleCount: number;
}>;

type Rc6DraftCatalogueLoader = (
  env: Readonly<Record<string, string | undefined>>,
) => Promise<Rc6CheckerCatalogue | null>;

export async function getRc6DraftReconciliationHealth(
  env: Readonly<Record<string, string | undefined>> = process.env,
  loadCatalogue: Rc6DraftCatalogueLoader = loadRc6DraftCheckerCatalogue,
): Promise<Rc6DraftReconciliationHealth> {
  const catalogue = await loadCatalogue(env);
  if (!catalogue) {
    return { status: "UNAVAILABLE", airlineCount: 0, ruleCount: 0 };
  }

  return {
    status: "PASS",
    airlineCount: catalogue.airlines.length,
    ruleCount: catalogue.rules.length,
  };
}
