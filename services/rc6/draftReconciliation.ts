import { loadRc6DraftCheckerCatalogue } from "./runtimeBinding";

export type Rc6DraftReconciliationHealth = Readonly<{
  status: "PASS" | "UNAVAILABLE";
  airlineCount: number;
  ruleCount: number;
}>;

export async function getRc6DraftReconciliationHealth(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<Rc6DraftReconciliationHealth> {
  const catalogue = await loadRc6DraftCheckerCatalogue(env);
  if (!catalogue) {
    return { status: "UNAVAILABLE", airlineCount: 0, ruleCount: 0 };
  }

  return {
    status: "PASS",
    airlineCount: catalogue.airlines.length,
    ruleCount: catalogue.rules.length,
  };
}
