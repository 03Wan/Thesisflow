import { describe, expect, it } from "vitest";
import { parseDataset } from "@/data/datasetParser";
import { runDescriptiveAnalysis } from "@/services/analysisService";
import { executeTransform } from "@/services/transformService";
import { groundedPrompt, verifyDraftNumbers } from "@/services/evidenceGuardrails";

describe("Phase 7 black-box evidence chain", () => {
  it("runs an unfamiliar anonymous CSV through parse → transform → analysis → evidence guards", async () => {
    const parsed = parseDataset(new TextEncoder().encode("region,revenue,cost\nNorth,120,80\nSouth,90,50\nWest,110,60\n"), "text/csv");
    const transformed = await executeTransform({ columns: parsed.schema, rows: parsed.preview.rows }, [{ operation: "derive", parameters: { name: "profit", formula: "revenue - cost" } }]);
    const version = { id: "blackbox-v1", projectId: "blackbox", datasetId: "blackbox-dataset", versionNumber: 1, kind: "derived" as const, parentVersionId: null, sourceFileId: "blackbox-file", mediaType: "text/csv", sha256: "b".repeat(64), byteSize: 1, schema: transformed.columns, preview: { columns: transformed.columns.map((column) => column.name), rows: transformed.rows }, sourceMetadata: { sheetName: null }, previewRowCount: transformed.rows.length, rowCount: transformed.rows.length, columnCount: transformed.columns.length, parserId: "transform-engine", parserVersion: "1.0.0", status: "ready" as const, createdAt: new Date().toISOString() };
    const run = runDescriptiveAnalysis("blackbox", version, transformed.rows, { dependent: "profit", independent: ["revenue"] });
    const metrics = Object.values(run.metrics).flatMap((metric) => { const item = metric as { n: number; mean: number | null }; return [{ key: "N", value: item.n }, { key: "mean", value: item.mean ?? "null" }]; });
    const evidence = { id: "e-blackbox", projectId: "blackbox", runId: run.id, title: "Black-box descriptive result", metrics, stale: false };
    expect(run.status).toBe("completed"); expect(verifyDraftNumbers(`N=${metrics[0].value}`, [evidence]).verified).toBe(true); expect(groundedPrompt([evidence], { method: "descriptive" }).evidenceIds).toEqual([evidence.id]);
  });
});
