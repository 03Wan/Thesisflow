import { describe, expect, it } from "vitest";
import { executeTransform } from "@/services/transformService";
const columns = [{ name: "a", sourceName: "a", type: "number" as const, nullable: false }, { name: "b", sourceName: "b", type: "number" as const, nullable: false }];
describe("reproducible transform execution", () => {
  it("creates deterministic derived rows and rejects unsafe expressions", async () => {
    const input = { columns, rows: [["1", "2"], ["1", "2"], ["3", "4"]] };
    const steps = [{ operation: "dedupe" as const, parameters: {} }, { operation: "derive" as const, parameters: { name: "total", formula: "a + b" } }];
    const one = await executeTransform(input, steps); const two = await executeTransform(input, steps);
    expect(one.rows).toEqual([["1", "2", "3"], ["3", "4", "7"]]); expect(one.recipeHash).toBe(two.recipeHash);
    await expect(executeTransform(input, [{ operation: "derive", parameters: { name: "x", formula: "process.exit()" } }])).rejects.toThrow();
  });
});
