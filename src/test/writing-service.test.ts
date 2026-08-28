import { beforeEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { writingService } from "@/services/writingService";
import type { ThesisSection } from "@/types/writing";

const section = (workspace: Awaited<ReturnType<typeof writingService.load>>, title: string): ThesisSection => ({ id: crypto.randomUUID(), documentId: workspace.document.id, projectId: workspace.document.projectId, parentId: null, sortOrder: 0, headingLevel: 1, title, content: "<p>第一段 12 个字。</p>", contentFormat: "html", wordCount: 0, purpose: "", targetLength: null, sourcePlan: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

describe("Phase 8 structured writing source of truth", () => {
  beforeEach(() => localStorage.clear());
  it("persists project-isolated sections, real word counts and immutable revisions", async () => {
    const first = await writingService.load("project-a", "论文 A");
    const saved = await writingService.saveSections(first, [section(first, "引言")]);
    const second = await writingService.load("project-b", "论文 B");
    expect(saved.document.activeVersion).toBe(1);
    expect(saved.sections[0].wordCount).toBeGreaterThan(0);
    expect(saved.revisions).toHaveLength(1);
    expect(second.sections).toHaveLength(0);
    expect((await writingService.load("project-a", "论文 A")).sections[0].title).toBe("引言");
  });
  it("keeps rejected proposals out of content and accepts through a new revision", async () => {
    const initial = await writingService.load("project-a", "论文 A");
    const saved = await writingService.saveSections(initial, [section(initial, "结果")]);
    const proposalWorkspace = await writingService.saveProposal(saved, { projectId: "project-a", documentId: saved.document.id, sectionId: saved.sections[0].id, operation: "rewrite", originalText: "原文", proposedText: "新文", usedSourceIds: ["lit-1"], unsupported: [], model: "test", promptVersion: "phase8-v1", contextIds: ["section-1"], status: "pending" });
    const rejected = await writingService.resolveProposal(proposalWorkspace, proposalWorkspace.proposals[0].id, "rejected");
    expect(rejected.sections[0].content).toContain("第一段");
    const accepted = await writingService.resolveProposal(proposalWorkspace, proposalWorkspace.proposals[0].id, "accepted");
    const restored = await writingService.saveSections(accepted, [{ ...accepted.sections[0], content: "新文" }], "ai", "接受 AI 提案");
    expect(restored.sections[0].content).toBe("新文");
    expect(restored.revisions.map((revision) => revision.source)).toEqual(expect.arrayContaining(["student", "ai"]));
  });
  it("generates a reopenable DOCX snapshot", async () => {
    const workspace = await writingService.load("project-a", "论文 A");
    const saved = await writingService.saveSections(workspace, [section(workspace, "引言")]);
    const blob = await writingService.exportDocx(saved, [{ title: "真实文献", authors: "作者", year: 2024 }]);
    const reopened = await JSZip.loadAsync(blob);
    expect(reopened.file("word/document.xml")).not.toBeNull();
    expect(blob.size).toBeGreaterThan(500);
  });
});
