import { describe, expect, it } from "vitest";
import { getRc6DraftReconciliationHealth } from "@/services/rc6/draftReconciliation";
import type { Rc6CheckerCatalogue } from "@/services/rc6/checker";

describe("RC6 Draft reconciliation health", () => {
  it("reports unavailable when the isolated Draft catalogue cannot be loaded", async () => {
    const health = await getRc6DraftReconciliationHealth({}, async () => null);
    expect(health).toEqual({ status: "UNAVAILABLE", airlineCount: 0, ruleCount: 0 });
  });

  it("reports only health counts for a reconciled catalogue", async () => {
    const catalogue = {
      airlines: Array.from({ length: 114 }, () => ({})),
      rules: Array.from({ length: 425 }, () => ({})),
    } as unknown as Rc6CheckerCatalogue;

    const health = await getRc6DraftReconciliationHealth(
      { RC6_RUNTIME_SPREADSHEET_ID: "runtime-rc6" },
      async () => catalogue,
    );

    expect(health).toEqual({ status: "PASS", airlineCount: 114, ruleCount: 425 });
    expect(Object.keys(health).sort()).toEqual(["airlineCount", "ruleCount", "status"]);
  });
});
