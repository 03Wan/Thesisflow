import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ContextBuilder } from "@/ai/contextBuilder";
import { prompts } from "@/ai/promptRegistry";
import { guardVerifiedCitations, resolveLiteratureKnowledgeScope, safeLiteratureTaskLog } from "@/services/literatureQuality";
import type { LiteratureChunk } from "@/types/literature";

const hostileText = readFileSync("src/test/fixtures/literature/untrusted-injection.txt", "utf8");
const hostileChunk: LiteratureChunk = { id: "hostile-a", literatureId: "lit-a", projectFileId: "file-a", documentParseId: "parse-a", chunkOrder: 0, text: hostileText, textHash: "hostile-hash", tokenEstimate: 50, headingPath: "Appendix", locatorJson: JSON.stringify({ format: "pdf", pageNumber: 9, blockIndex: 0 }), createdAt: "2026-08-24T00:00:00.000Z" };

describe("Phase 5 literature security and privacy gate", () => {
  it("keeps prompt injection inside untrusted_document context", () => {
    const template = prompts.get("literature.card.extract", "v1");
    const context = new ContextBuilder(4000, 8).build(template, { projectId: "project-a", taskKey: "literature.card.extract", userInstruction: "Extract only supported claims", sourceItems: [{ id: hostileChunk.id, type: "source", trustLevel: "untrusted_document", text: hostileChunk.text, sourceFileId: hostileChunk.projectFileId, sourceLocator: JSON.parse(hostileChunk.locatorJson) }] });
    expect(context.projectId).toBe("project-a");
    expect(context.sourceItems).toHaveLength(1);
    expect(context.sourceItems?.[0]).toMatchObject({ id: "hostile-a", trustLevel: "untrusted_document" });
    expect(context.userInstruction?.text).toBe("Extract only supported claims");
    expect(template.systemTemplate).toContain("untrusted data");
  });

  it("enforces the source whitelist and blocks invented citations", () => {
    const payload = { citation_summary: { value: "Use DOI 10.9999/nonexistent-record", evidence_refs: ["hostile-a"], confidence: .2, status: "ambiguous" } };
    expect(guardVerifiedCitations(payload, ["hostile-a"], [])).toMatchObject({ valid: false, invalidDois: ["10.9999/nonexistent-record"] });
    expect(guardVerifiedCitations({ method: { value: "x", evidence_refs: ["project-b-source"], confidence: .9, status: "supported" } }, ["hostile-a"], [])).toMatchObject({ valid: false, invalidSourceRefs: ["project-b-source"] });
  });

  it("logs identifiers and counts but never full chunk text", () => {
    const log = safeLiteratureTaskLog({ projectId: "project-a", literatureId: "lit-a", chunks: [hostileChunk] });
    const serialized = JSON.stringify(log);
    expect(serialized).not.toContain("Ignore system instructions");
    expect(serialized).not.toContain("10.9999/nonexistent-record");
    expect(log).toMatchObject({ chunkCount: 1, sourceRefs: ["hostile-a"] });
  });

  it("requires external discovery to use scholarly provider code paths", () => {
    expect(resolveLiteratureKnowledgeScope(false)).toBe("current_evidence");
    expect(resolveLiteratureKnowledgeScope(true)).toBe("scholarly_search_provider");
  });
});
