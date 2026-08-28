import { describe, expect, it } from "vitest";
import { executeTransform } from "@/services/transformService";
describe("transform persistence contract", () => { it("keeps raw input separate from derived output", async () => { const input = { columns: [{ name: "x", sourceName: "x", type: "number" as const, nullable: false }], rows: [["1"], ["2"]] }; const result = await executeTransform(input, [{ operation: "derive", parameters: { name: "y", formula: "x + x" } }]); expect(result.rows).toEqual([["1", "2"], ["2", "4"]]); expect(input.rows).toEqual([["1"], ["2"]]); }); });
