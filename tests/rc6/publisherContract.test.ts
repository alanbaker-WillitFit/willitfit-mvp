import { describe, expect, it } from "vitest";
import projectionContract from "@/config/rc6/runtime-projection.v1.json";
import { RC6_SCHEMA_REGISTRY } from "@/services/rc6/schemaRegistry";

const airlineRulesProjection = projectionContract.datasets["03_Airline Rules"];
const airlineRulesSchema = RC6_SCHEMA_REGISTRY.airlineRules;

describe("RC6 publisher/build contract alignment", () => {
  it("projects every header required by the Build airline-rule reader", () => {
    expect(airlineRulesSchema).toBeDefined();
    for (const header of airlineRulesSchema?.requiredHeaders ?? []) {
      expect(airlineRulesProjection.columns).toContain(header);
    }
  });

  it("treats sizing method and limit operator as mandatory projection semantics", () => {
    expect(airlineRulesProjection.requiredSemanticColumns).toEqual([
      "Sizing Method",
      "Limit Operator",
    ]);
    expect(airlineRulesSchema?.requiredHeaders).toContain("Sizing Method");
    expect(airlineRulesSchema?.requiredHeaders).toContain("Limit Operator");
  });

  it("locks the five currently governed strict-lt rule IDs", () => {
    expect(airlineRulesProjection.strictLtRuleIds).toEqual([
      "EZY-CHK-20260801-001",
      "EZY-CHK-20260801-002",
      "EZY-CHK-20260801-003",
      "MAS-CHK-20260801-001",
      "MAS-CHK-20260801-002",
    ]);
  });

  it("keeps the published airline-rule row count aligned with the RC6 Runtime contract", () => {
    expect(airlineRulesProjection.expectedRows).toBe(425);
  });
});
