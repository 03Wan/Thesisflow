import { describe, expect, it } from "vitest";
import { createReleaseCandidate, isReady, mergeIssues, runPhase9Checks } from "@/services/phase9Service";
import type { Phase9Issue } from "@/types/phase9";
import type { WritingWorkspace } from "@/types/writing";

const workspace = (overrides: Partial<WritingWorkspace> = {}): WritingWorkspace => ({ document: { id: "doc-1", projectId: "p-1", title: "测试论文", status: "active", activeVersion: 1, metadata: {}, createdAt: "2026-01-01", updatedAt: "2026-01-01" }, sections: [{ id: "s-1", documentId: "doc-1", projectId: "p-1", parentId: null, sortOrder: 0, headingLevel: 1, title: "结果", content: "结果表明模型显著。", contentFormat: "plain_text", wordCount: 9, purpose: "", targetLength: null, sourcePlan: [], createdAt: "2026-01-01", updatedAt: "2026-01-01" }], revisions: [{ id: "rev-1", documentId: "doc-1", projectId: "p-1", versionNumber: 1, source: "student", label: "初稿", snapshot: [], contentHash: "hash-1", createdAt: "2026-01-01" }], citations: [], links: [], proposals: [], ...overrides });

describe("phase 9 check engine", () => {
  it("does not default unknown requirements or missing exports to PASS", async () => {
    const report = await runPhase9Checks({ workspace: workspace(), requirements: [{ id: "r-1", projectId: "p-1", requirementKey: "style", label: "格式按学校模板", targetValue: null, currentValue: 0, unit: "", status: "pending", description: "自然语言要求", createdAt: "", updatedAt: "" }], literatureIds: [], evidence: [] });
    expect(report.checks.find((item) => item.checkId === "requirement:r-1")?.status).toBe("REVIEW");
    expect(report.checks.find((item) => item.checkId === "format:export")?.status).toBe("UNSUPPORTED");
    expect(report.issues.every((issue) => issue.status === "open")).toBe(true);
  });

  it("finds orphan citations, unbound empirical claims and stale evidence", async () => {
    const current = workspace({ citations: [{ id: "c-1", projectId: "p-1", documentId: "doc-1", sectionId: "s-1", literatureId: "missing", anchor: "a-1", locator: null, prefix: "", suffix: "", renderText: "[Missing]", sourceHash: "", createdAt: "", updatedAt: "" }], links: [{ id: "l-1", projectId: "p-1", documentId: "doc-1", sectionId: "s-1", sourceType: "evidence", sourceId: "e-1", locator: "run-1", label: "结果", status: "linked", snapshotText: "p=.04", sourceHash: "", evidenceId: "e-1", artifactId: "a-1", runId: "run-1", createdAt: "", updatedAt: "" }] });
    const report = await runPhase9Checks({ workspace: current, requirements: [], literatureIds: [], evidence: [{ id: "e-1", projectId: "p-1", runId: "run-1", title: "结果", metrics: [{ key: "p", value: ".04" }], stale: true }] });
    expect(report.checks.some((item) => item.status === "FAIL" && item.category === "citation/source")).toBe(true);
    expect(report.checks.some((item) => item.status === "FAIL" && item.category === "empirical consistency")).toBe(true);
  });

  it("preserves dismissed issue state and marks removed issues stale", () => {
    const old: Phase9Issue = { id: "old", fingerprint: "same", category: "requirements", sourceChecker: "v1", severity: "medium", status: "dismissed", sectionId: null, anchor: null, sourceIds: [], evidence: [], message: "old", observed: 1, expected: 2, createdAt: "", checkedAt: "", checkVersion: "v1", dismissReason: "学生确认" };
    const report = { revisionHash: "r", generatedAt: "", checkerVersion: "v2", checks: [], issues: [{ ...old, id: "new", status: "open" as const, checkedAt: "", createdAt: "" }] };
    expect(mergeIssues([old], report).find((item) => item.id === "old")?.status).toBe("dismissed");
    expect(mergeIssues([old], { ...report, issues: [] }).find((item) => item.id === "old")?.status).toBe("stale");
  });

  it("creates an immutable RC only after blocking issues are resolved and manual checks confirmed", async () => {
    const current = workspace({ sections: [{ ...workspace().sections[0], content: "完整正文" }] });
    const report = await runPhase9Checks({ workspace: current, requirements: [], literatureIds: [], evidence: [], exports: [{ id: "export-1", projectId: "p-1", documentId: "doc-1", revisionId: "rev-1", outputPath: "thesis.docx", outputFormat: "docx", fileHash: "file-hash", requirementsVersion: null, templateVersion: "v1", warnings: [], manualCheck: ["页码字段"], createdAt: "" }] });
    expect(isReady(report)).toBe(false);
    const rc = await createReleaseCandidate({ workspace: current, report, requirements: [], confirmations: [{ id: "m-1", checkId: "format:export", note: "已在 Word 中检查", confirmedAt: "" }] });
    expect(rc.ready).toBe(true);
    expect(rc.manifestHash).toHaveLength(64);
    expect(rc.backup.sections[0].content).toBe("完整正文");
  });
});
