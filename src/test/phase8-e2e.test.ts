import { beforeEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { writingService } from "@/services/writingService";
import type { ThesisSection } from "@/types/writing";

const makeSection = (workspace: Awaited<ReturnType<typeof writingService.load>>, title: string, order: number): ThesisSection => ({ id: crypto.randomUUID(), documentId: workspace.document.id, projectId: workspace.document.projectId, parentId: null, sortOrder: order, headingLevel: 1, title, content: `<p>${title} 的研究结果为 N=42。</p>`, contentFormat: "html", wordCount: 0, purpose: "回答本章研究问题", targetLength: 800, sourcePlan: ["lit-real-1", "evidence-real-1"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

describe("Phase 8 student writing end-to-end workflow", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a multi-chapter document, structured lineage, proposal decisions and export snapshot isolated", async () => {
    const initial = await writingService.load("real-project-a", "真实论文项目");
    const saved = await writingService.saveSections(initial, [makeSection(initial, "引言", 0), makeSection(initial, "实证结果", 1)]);
    const cited = await writingService.saveCitation(saved, { projectId: saved.document.projectId, documentId: saved.document.id, sectionId: saved.sections[1].id, literatureId: "lit-real-1", anchor: "cite-real-1", locator: "p.12", prefix: "见", suffix: "。", renderText: "[真实文献, 2024]" });
    const linked = await writingService.saveSourceLink(cited, { projectId: cited.document.projectId, documentId: cited.document.id, sectionId: cited.sections[1].id, sourceType: "evidence", sourceId: "evidence-real-1", locator: "run-real-1", label: "Phase 7 实证证据", status: "linked", snapshotText: "N=42", evidenceId: "evidence-real-1", artifactId: "artifact-real-1", runId: "run-real-1" });
    const proposal = await writingService.saveProposal(linked, { projectId: linked.document.projectId, documentId: linked.document.id, sectionId: linked.sections[1].id, operation: "academicize", originalText: "原文", proposedText: "证据不足", usedSourceIds: ["evidence-real-1"], unsupported: [], model: "test", promptVersion: "phase8-v1", contextIds: [linked.sections[1].id], status: "pending" });
    const rejected = await writingService.resolveProposal(proposal, proposal.proposals[0].id, "rejected");
    const restored = await writingService.saveSections(rejected, rejected.revisions[0].snapshot, "restore", "恢复导出前版本");
    const blob = await writingService.exportDocx(restored, [{ title: "真实文献", authors: "作者", year: 2024 }]);
    const packageZip = await JSZip.loadAsync(blob);
    const xml = await packageZip.file("word/document.xml")!.async("string");
    expect(xml).toContain("evidence-real-1");
    expect((await writingService.load("real-project-b", "另一个项目")).sections).toHaveLength(0);
    expect(restored.revisions.map((item) => item.source)).toEqual(expect.arrayContaining(["student", "restore"]));
  });
});
