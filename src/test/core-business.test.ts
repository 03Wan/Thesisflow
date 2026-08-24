import { describe, expect, it, vi } from "vitest";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import { ProjectRepository } from "@/repositories/projectRepository";
import { TaskRepository } from "@/repositories/taskRepository";
import { AdvisorRepository } from "@/repositories/advisorRepository";
import { ProjectService } from "@/services/projectService";
import { TaskService } from "@/services/taskService";
import { AdvisorService } from "@/services/advisorService";
import { WorkflowService } from "@/services/workflowService";
import { CATEGORY_DIRECTORIES, inferProjectFileCategory, isSupportedFile } from "@/lib/file-category";
import type { AdvisorSession, Task, ThesisProject, WorkflowStage } from "@/types/domain";

const time = "2026-08-24T00:00:00.000Z";
const project = (id: string): ThesisProject => ({ id, title: id, school: "", college: "", major: "", grade: "", studentName: "", studentNumber: "", advisorName: "", researchType: "", currentStage: "requirements", progress: 0, defenseBatch: null, createdAt: time, updatedAt: time, lastOpenedAt: null, projectFolder: id, status: "active" });
const task: Task = { id: "task-1", projectId: "p1", workflowStageId: null, title: "  完成研究设计  ", description: null, sourceType: "manual", sourceReferenceId: null, priority: "high", status: "todo", dueAt: null, completedAt: null, sortOrder: 0, createdAt: time, updatedAt: time };
const session: AdvisorSession = { id: "session-1", projectId: "p1", workflowStageId: null, sessionNumber: 1, sessionAt: time, method: "online", advisorName: "导师", summary: "讨论研究设计", feedback: "补充文献", nextSteps: "修改提纲", status: "completed", createdAt: time, updatedAt: time };

describe("Phase 2 core business boundaries", () => {
  it("creates a project through the native transaction boundary", async () => {
    invoke.mockReset();
    invoke.mockResolvedValueOnce(project("created"));
    const service = new ProjectService();
    await expect(service.createProject({ title: "  新项目  " })).resolves.toMatchObject({ id: "created" });
    expect(invoke).toHaveBeenCalledWith("create_local_project", expect.objectContaining({ request: expect.objectContaining({ title: "新项目" }) }));
  });

  it("creates and completes a task with normalized title and completion timestamp", async () => {
    const repository = { create: vi.fn().mockResolvedValue({ ...task, title: "完成研究设计" }), update: vi.fn().mockImplementation(async (_id, changes) => ({ ...task, ...changes })) } as unknown as TaskRepository;
    const service = new TaskService(repository);
    await service.create(task);
    const done = await service.update(task.id, { status: "done" });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ title: "完成研究设计" }));
    expect(done.completedAt).toEqual(expect.any(String));
  });

  it("adds an advisor session without crossing project ownership", async () => {
    const repository = { create: vi.fn().mockResolvedValue(session) } as unknown as AdvisorRepository;
    const created = await new AdvisorService(repository).create(session);
    expect(created.projectId).toBe("p1");
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ sessionNumber: 1, projectId: "p1" }));
  });

  it("calculates progress from completed stages only", () => {
    const service = new WorkflowService();
    const stages = ["completed", "completed", "in_progress", "not_started"] as WorkflowStage["status"][];
    expect(service.calculateProjectProgress(stages.map((status, index) => ({ id: String(index), projectId: "p1", stageKey: String(index), stageNumber: index + 1, title: String(index), status, startedAt: null, completedAt: null, deadline: null, progress: 0, sortOrder: index, createdAt: time, updatedAt: time })))).toBe(50);
  });

  it("maps file extensions to the intended project directories", () => {
    expect(inferProjectFileCategory("reference.RIS")).toBe("literature");
    expect(inferProjectFileCategory("data.xlsx")).toBe("data");
    expect(CATEGORY_DIRECTORIES.thesis).toBe("06_论文正文");
    expect(isSupportedFile("draft.pdf")).toBe(true);
    expect(isSupportedFile("unsafe.exe")).toBe(false);
  });

  it("keeps two projects isolated in repository queries", async () => {
    const repository = { listByProject: vi.fn().mockImplementation(async (id: string) => id === "p1" ? [task] : [{ ...task, id: "task-2", projectId: "p2" }]) } as unknown as TaskRepository;
    const service = new TaskService(repository);
    expect((await service.list("p1")).every((item) => item.projectId === "p1")).toBe(true);
    expect((await service.list("p2")).every((item) => item.projectId === "p2")).toBe(true);
  });

  it("does not remove project state when native deletion reports a filesystem failure", async () => {
    invoke.mockReset();
    invoke.mockRejectedValueOnce("无法删除项目目录，数据库未变更");
    await expect(new ProjectService().deleteProject("p1")).rejects.toThrow("数据库记录已保留");
    expect(invoke).toHaveBeenCalledWith("delete_local_project", { projectId: "p1" });
  });
});
