import { describe, expect, it, vi } from "vitest";
import { ProjectRepository } from "@/repositories/projectRepository";
import { WorkflowRepository } from "@/repositories/workflowRepository";
import { WorkflowService } from "@/services/workflowService";
import type { ThesisProject, WorkflowStage } from "@/types/domain";

const project: ThesisProject = { id: "project-1", title: "测试项目", school: "", college: "", major: "", grade: "", studentName: "", studentNumber: "", advisorName: "", researchType: "", currentStage: "requirements", progress: 0, defenseBatch: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", lastOpenedAt: null, projectFolder: "", status: "active" };
const stages: WorkflowStage[] = [
  { id: "stage-1", projectId: project.id, stageKey: "requirements", stageNumber: 1, title: "论文规则解析", status: "in_progress", startedAt: null, completedAt: null, deadline: null, progress: 0, sortOrder: 1, createdAt: project.createdAt, updatedAt: project.updatedAt },
  { id: "stage-2", projectId: project.id, stageKey: "topic", stageNumber: 2, title: "选题", status: "not_started", startedAt: null, completedAt: null, deadline: null, progress: 0, sortOrder: 2, createdAt: project.createdAt, updatedAt: project.updatedAt },
];

describe("WorkflowService", () => {
  it("calculates equal-weight project progress and persists the current stage", async () => {
    const repository = { findById: vi.fn().mockResolvedValue(stages[0]), update: vi.fn().mockImplementation(async (_id, changes) => ({ ...stages[0], ...changes })), listByProject: vi.fn().mockResolvedValue([{ ...stages[0], status: "completed", progress: 100 }, { ...stages[1], status: "in_progress" }]) } as unknown as WorkflowRepository;
    const projects = { update: vi.fn().mockResolvedValue({ ...project, currentStage: "topic", progress: 50 }) } as unknown as ProjectRepository;
    const service = new WorkflowService(repository, projects);

    expect(service.calculateProjectProgress([{ ...stages[0], status: "completed" }, stages[1]])).toBe(50);
    const result = await service.setStageStatus("stage-1", "completed");

    expect(repository.update).toHaveBeenCalledWith("stage-1", expect.objectContaining({ status: "completed", progress: 100 }));
    expect(projects.update).toHaveBeenCalledWith(project.id, expect.objectContaining({ currentStage: "topic", progress: 50 }));
    expect(result.project.currentStage).toBe("topic");
  });
});
