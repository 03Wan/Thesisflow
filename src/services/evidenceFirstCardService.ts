import { ContextBuilder } from "@/ai/contextBuilder";
import { prompts } from "@/ai/promptRegistry";
import { structuredOutputs } from "@/ai/structuredOutputRegistry";
import type { AITaskInput, AITaskEngine } from "@/ai/taskEngine";
import { guardVerifiedCitations, validateCardGrounding } from "@/services/literatureQuality";
import type { LiteratureCard, LiteratureCardEvidence, LiteratureChunk } from "@/types/literature";

type Field = { value: string; evidence_refs: string[]; confidence: number; status: "supported" | "partially_supported" | "not_found" | "ambiguous" };
type CardPayload = Record<string, Field | Field[]>;

export interface CardStore {
  saveCard(card: LiteratureCard, evidence: LiteratureCardEvidence[]): Promise<void>;
  markStale(literatureId: string, parseId: string): Promise<void>;
}

export interface ChunkRetriever {
  retrieve(literatureId: string, projectId: string, instruction: string): Promise<LiteratureChunk[]>;
  validateOwnership?(projectId: string, literatureId: string, chunks: readonly LiteratureChunk[]): Promise<boolean>;
  allowedDois?(projectId: string, literatureId: string): Promise<string[]>;
}

const now = () => new Date().toISOString();

function cardEvidence(cardId: string, payload: CardPayload, chunks: readonly LiteratureChunk[]): LiteratureCardEvidence[] {
  const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const evidence: LiteratureCardEvidence[] = [];
  for (const [field, raw] of Object.entries(payload)) {
    const entries = Array.isArray(raw) ? raw : [raw];
    entries.forEach((entry, index) => entry.evidence_refs.forEach((ref) => {
      const chunk = byId.get(ref);
      if (!chunk) return;
      evidence.push({ id: crypto.randomUUID(), cardId, fieldPath: entries.length > 1 ? `${field}[${index}]` : field, chunkId: ref, sourceLocatorJson: chunk.locatorJson, quoteHash: chunk.textHash, snippetHash: chunk.textHash, confidence: entry.confidence });
    }));
  }
  return evidence;
}

export class EvidenceFirstCardService {
  private readonly active = new Map<string, AbortController>();
  constructor(private readonly retriever: ChunkRetriever, private readonly engine: AITaskEngine, private readonly store: CardStore) {}

  async generate(input: Omit<AITaskInput, "request"> & { literatureId: string; instruction?: string }): Promise<{ cardId: string; runId: string }> {
    const instruction = input.instruction ?? "Extract literature evidence.";
    const chunks = await this.retriever.retrieve(input.literatureId, input.projectId, instruction);
    if (!chunks.length) throw new Error("No retrievable full-text chunks for this literature item.");
    if (chunks.some((chunk) => chunk.literatureId !== input.literatureId)) throw new Error("Cross-literature chunk injection rejected.");
    if (this.retriever.validateOwnership && !await this.retriever.validateOwnership(input.projectId, input.literatureId, chunks)) throw new Error("Chunk project ownership validation failed.");
    const invalidChunk = chunks.some((chunk) => { if (!chunk.textHash) return true; try { const locator = JSON.parse(chunk.locatorJson) as Record<string, unknown>; return !locator || typeof locator !== "object" || typeof locator.format !== "string" || (locator.format === "pdf" && (!(typeof locator.pageNumber === "number") || locator.pageNumber < 1)); } catch { return true; } });
    if (invalidChunk) throw new Error("Chunk locator/hash validation failed.");

    const template = prompts.get("literature.card.extract", "v1");
    const context = new ContextBuilder(12_000, 12).build(template, {
      projectId: input.projectId,
      taskKey: "literature.card.extract",
      sourceItems: chunks.map((chunk) => ({
        id: chunk.id,
        type: "source" as const,
        trustLevel: "untrusted_document" as const,
        text: chunk.text,
        sourceFileId: chunk.projectFileId,
        sourceLocator: { locator: JSON.parse(chunk.locatorJson), textHash: chunk.textHash, literatureId: chunk.literatureId, parseId: chunk.documentParseId },
        sizeEstimate: chunk.text.length,
      })),
      userInstruction: input.instruction ?? "Extract only evidence supported by these chunks.",
    });
    const run = await this.engine.runAITask({ ...input, request: { task: { key: "literature.card.extract", displayName: "Literature card", requiredCapabilities: ["text_generation", "structured_output"] }, modelId: input.modelId, prompt: template, context, structuredOutput: { key: "literature_card", version: "v1", jsonSchema: { type: "object" } }, requestId: crypto.randomUUID() } });
    if (run.status !== "succeeded") throw new Error(`Card generation ${run.status}`);
    const output = await this.engine.getAIRunOutput(run.id);
    if (!output?.structuredJson || output.validationStatus !== "valid") throw new Error("Validated AI card output is unavailable.");
    const payload = output.structuredJson as CardPayload;
    const validation = this.validate(payload, chunks, input.literatureId);
    const citationGuard = guardVerifiedCitations(payload, chunks.map((chunk) => chunk.id), await this.retriever.allowedDois?.(input.projectId, input.literatureId) ?? []);
    if (!validation.valid || !citationGuard.valid) throw new Error("AI card evidence/citation validation failed.");
    const cardId = crypto.randomUUID(); const timestamp = now();
    const citation = payload.citation_summary; const summary = Array.isArray(citation) ? citation[0]?.value : citation?.value;
    await this.store.saveCard({ id: cardId, literatureId: input.literatureId, schemaVersion: "v1", status: "draft", aiRunId: run.id, summary: summary ?? null, structuredJson: JSON.stringify(payload), createdAt: timestamp, updatedAt: timestamp }, cardEvidence(cardId, payload, chunks));
    return { cardId, runId: run.id };
  }

  validate(payload: unknown, chunks: readonly LiteratureChunk[], expectedLiteratureId = chunks[0]?.literatureId ?? "") {
    const grounding = validateCardGrounding(payload, chunks, expectedLiteratureId);
    const schema = structuredOutputs.get("literature_card", "v1").validate(payload, chunks.map((chunk) => chunk.id));
    return { ...grounding, valid: grounding.valid && schema.valid, issues: [...schema.issues, ...grounding.issues] };
  }

  async markStale(literatureId: string, parseId: string) { return this.store.markStale(literatureId, parseId); }

  async batch<T>(items: readonly T[], work: (item: T, signal: AbortSignal) => Promise<void>) {
    const controller = new AbortController(); const id = crypto.randomUUID(); this.active.set(id, controller);
    const results: Array<{ item: T; status: "succeeded" | "failed" | "cancelled" }> = [];
    try {
      for (const item of items) {
        if (controller.signal.aborted) { results.push({ item, status: "cancelled" }); continue; }
        try { await work(item, controller.signal); results.push({ item, status: "succeeded" }); }
        catch { results.push({ item, status: controller.signal.aborted ? "cancelled" : "failed" }); }
      }
      return { id, results };
    } finally { this.active.delete(id); }
  }

  cancelBatch(id: string) { this.active.get(id)?.abort(); }
}
