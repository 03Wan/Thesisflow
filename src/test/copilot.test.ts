import { describe, expect, it } from "vitest";
import { buildQuickCheck, parseCopilotIntent } from "@/lib/copilot";
import type { ThesisProject } from "@/types/domain";

const project: ThesisProject = { id: "project-1", title: "真实论文项目", school: "", college: "", major: "", grade: "", studentName: "", studentNumber: "", advisorName: "", researchType: "", currentStage: "writing", progress: 0, defenseBatch: null, createdAt: "x", updatedAt: "x", lastOpenedAt: null, projectFolder: "", status: "active" };

describe("Copilot real-data boundaries", () => {
  it("parses supported slash commands", () => {
    expect(parseCopilotIntent("/检查 当前章节")).toEqual({ intent: "check", instruction: "当前章节" });
    expect(parseCopilotIntent("/下一步")).toEqual({ intent: "next", instruction: "" });
  });

  it("states that writing cannot be checked without a real manuscript", () => {
    const result = buildQuickCheck({ project, route: "/writing", files: [], requirements: [], tasks: [] });
    expect(result.pendingItems.join(" ")).toContain("尚未导入论文正文");
    expect(result.actions).toContainEqual({ label: "前往文件中心", destination: "/files" });
  });
});
