import { describe, expect, it } from "vitest";
import {
  canServeRc6Rows,
  isRc6AuthoritativeEmpty,
  readRc6Dataset,
} from "@/services/rc6/runtimeReader";

describe("RC6 canonical Runtime reader", () => {
  it("reads only the canonical tab for a dataset", async () => {
    const calls: string[] = [];
    const result = await readRc6Dataset("airlines", async <T extends Record<string, string>>(tabName: string) => {
      calls.push(tabName);
      return [{ "Airline ID": "TEST", "Airline Name": "Test Air" }] as unknown as T[];
    });

    expect(calls).toEqual(["02_Airlines"]);
    expect(result.state).toBe("READY_WITH_ROWS");
    expect(canServeRc6Rows(result)).toBe(true);
  });

  it("treats a successful zero-row read as authoritative empty", async () => {
    const result = await readRc6Dataset("offers", async <T extends Record<string, string>>() => [] as T[]);

    expect(result.state).toBe("AUTHORITATIVE_EMPTY");
    expect(result.rows).toEqual([]);
    expect(isRc6AuthoritativeEmpty(result)).toBe(true);
  });

  it("distinguishes a technical read failure from authoritative empty", async () => {
    const result = await readRc6Dataset("offers", async () => null);

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.rows).toEqual([]);
    expect(isRc6AuthoritativeEmpty(result)).toBe(false);
  });

  it("fails closed when a governed retained dataset has the wrong headers", async () => {
    const result = await readRc6Dataset("navigation", async <T extends Record<string, string>>() => [
      { Label: "WillItFly", URL: "https://www.will-it-fly.net" },
    ] as unknown as T[]);

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.error).toContain("missing required RC6 headers");
    expect(canServeRc6Rows(result)).toBe(false);
  });

  it("fails closed when the adapter throws", async () => {
    const result = await readRc6Dataset("airlines", async () => {
      throw new Error("network unavailable");
    });

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.error).toContain("network unavailable");
    expect(canServeRc6Rows(result)).toBe(false);
  });
});
