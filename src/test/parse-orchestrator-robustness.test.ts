import { describe, expect, it } from "vitest";
import { ParseOrchestrator, type ParseStorage } from "@/services/parseOrchestrator";
import type { DocumentParser } from "@/types/document";

describe("ParseOrchestrator robustness", () => {
  it("reports a missing local source as a retryable structured failure", async () => {
    const storage: ParseStorage = {
      loadFile: async () => { throw new Error("ENOENT"); },
      list: async () => [], create: async () => undefined, update: async () => undefined,
      persist: async () => { throw new Error("unreachable"); }, isNormalizedUsable: async () => false,
    };
    const parser: DocumentParser = { id: "fake", version: "1", supports: () => true, parse: async () => ({ status: "parsed", warnings: [] }) };
    const orchestrator = new ParseOrchestrator(storage, { find: () => parser });

    await expect(orchestrator.parseProjectFile("missing-file")).rejects.toMatchObject({ code: "io_error", recoverable: true });
    expect(orchestrator.getParseStatus("missing-file")).toMatchObject({ status: "failed", parseId: null });
  });

  it("marks an allocated parse failed when a parser throws", async () => {
    const record: { status?: string; errorCode?: string } = {};
    const storage: ParseStorage = {
      loadFile: async () => ({ file: { id: "f", projectId: "p", workflowStageId: null, originalName: "broken.pdf", storedName: "broken.pdf", relativePath: "broken.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 1, checksum: null, fileCategory: "thesis", versionLabel: null, source: "local", createdAt: "x", updatedAt: "x" }, bytes: new Uint8Array([1]) }),
      list: async () => [], create: async () => undefined, update: async (_id, changes) => { Object.assign(record, changes); },
      persist: async () => { throw new Error("unreachable"); }, isNormalizedUsable: async () => false,
    };
    const parser: DocumentParser = { id: "pdf", version: "1", supports: () => true, parse: async () => { throw new Error("bad PDF"); } };
    const orchestrator = new ParseOrchestrator(storage, { find: () => parser });

    await expect(orchestrator.parseProjectFile("f")).rejects.toMatchObject({ code: "internal_error" });
    expect(record).toMatchObject({ status: "failed", errorCode: "internal_error" });
  });
});
