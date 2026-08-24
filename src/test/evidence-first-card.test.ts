import { describe, expect, it, vi } from "vitest";
import { EvidenceFirstCardService } from "@/services/evidenceFirstCardService";
import type { LiteratureCard, LiteratureCardEvidence } from "@/types/literature";

const chunk = { id: "c", literatureId: "l", projectFileId: "f", documentParseId: "p", chunkOrder: 0, text: "evidence", textHash: "hash", tokenEstimate: 1, headingPath: null, locatorJson: JSON.stringify({ format: "pdf", pageNumber: 1, blockIndex: 0 }), createdAt: "now" };
const fields = ["citation_summary", "research_question", "research_context", "theory_framework", "data_source", "sample", "time_period", "geography", "variables", "method", "model", "main_findings", "mechanism_findings", "robustness", "limitations", "contributions", "keywords", "use_for_thesis", "uncertainties"];
type TestField = { value: string; evidence_refs: string[]; confidence: number; status: "supported" };
const payload = Object.fromEntries(fields.map((key) => [key, { value: "supported fixture value", evidence_refs: ["c"], confidence: .8, status: "supported" }])) as Record<string, TestField>;
const emptyStore = { saveCard: vi.fn(async () => {}), markStale: vi.fn(async () => {}) };

describe("evidence first literature card", () => {
  it("rejects injected or stale evidence references", () => {
    const service = new EvidenceFirstCardService({ retrieve: async () => [] }, {} as never, emptyStore);
    expect(service.validate(payload, [chunk]).valid).toBe(true);
    expect(service.validate({ ...payload, method: { ...payload.method, evidence_refs: ["foreign"] } }, [chunk]).valid).toBe(false);
    expect(service.validate(payload, [{ ...chunk, locatorJson: "{}" }]).valid).toBe(false);
    expect(service.validate(payload, [{ ...chunk, textHash: "" }]).valid).toBe(false);
  });

  it("persists a validated draft card and field evidence", async () => {
    const saved: Array<[LiteratureCard, LiteratureCardEvidence[]]> = [];
    const saveCard = vi.fn(async (card: LiteratureCard, evidence: LiteratureCardEvidence[]) => { saved.push([card, evidence]); });
    const engine = { runAITask: vi.fn(async () => ({ id: "run-1", status: "succeeded" })), getAIRunOutput: vi.fn(async () => ({ structuredJson: payload, validationStatus: "valid" })) } as never;
    const service = new EvidenceFirstCardService({ retrieve: async () => [chunk], validateOwnership: async (projectId, literatureId, chunks) => projectId === "project-a" && literatureId === "l" && chunks.every((item) => item.projectFileId === "f"), allowedDois: async () => [] }, engine, { saveCard, markStale: async () => {} });
    const result = await service.generate({ projectId: "project-a", literatureId: "l", providerKey: "fake", modelId: "fake-card", secretRef: "secret/fake" });
    expect(result.runId).toBe("run-1");
    expect(saveCard).toHaveBeenCalledOnce();
    const [card, evidence] = saved[0];
    expect(card).toMatchObject({ literatureId: "l", status: "draft", aiRunId: "run-1", schemaVersion: "v1" });
    expect(evidence).toHaveLength(fields.length);
    expect(evidence.every((item: { chunkId: string; sourceLocatorJson: string }) => item.chunkId === "c" && JSON.parse(item.sourceLocatorJson).pageNumber === 1)).toBe(true);
  });

  it("rejects cross-literature source injection before calling the model", async () => {
    const engine = { runAITask: vi.fn() } as never;
    const service = new EvidenceFirstCardService({ retrieve: async () => [{ ...chunk, literatureId: "other" }] }, engine, emptyStore);
    await expect(service.generate({ projectId: "project-a", literatureId: "l", providerKey: "fake", modelId: "fake-card", secretRef: "secret/fake" })).rejects.toThrow("Cross-literature");
    expect((engine as { runAITask: ReturnType<typeof vi.fn> }).runAITask).not.toHaveBeenCalled();
  });

  it("isolates failures in batch", async () => {
    const service = new EvidenceFirstCardService({ retrieve: async () => [] }, {} as never, emptyStore);
    const result = await service.batch([1, 2], async (item) => { if (item === 2) throw Error(); });
    expect(result.results.map((item) => item.status)).toEqual(["succeeded", "failed"]);
  });
});
