import { describe, expect, it, vi } from "vitest";
import { ProjectRepository } from "@/repositories/projectRepository";
import { ProjectService } from "@/services/projectService";
import { createProjectStore } from "@/stores/project-store";
import type { ThesisProject } from "@/types/domain";

const project: ThesisProject = {
  id: "project-1", title: "本地数据库链路验证", school: "", college: "", major: "", grade: "", studentName: "", studentNumber: "", advisorName: "", researchType: "",
  currentStage: "requirements", progress: 0, defenseBatch: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", lastOpenedAt: null, projectFolder: "", status: "active",
};

describe("ProjectRepository → ProjectService → useProjectStore", () => {
  it("loads and opens projects through every data layer", async () => {
    const repository = {
      findAll: vi.fn().mockResolvedValue([project]),
      update: vi.fn().mockResolvedValue({ ...project, lastOpenedAt: "2026-01-02T00:00:00.000Z" }),
    } as unknown as ProjectRepository;
    const service = new ProjectService(repository);
    const store = createProjectStore(service);

    await store.getState().loadProjects();
    const opened = await store.getState().openProject(project.id);

    expect(repository.findAll).toHaveBeenCalledOnce();
    expect(repository.update).toHaveBeenCalledWith(project.id, expect.objectContaining({ lastOpenedAt: expect.any(String) }));
    expect(opened.lastOpenedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(store.getState().activeProjectId).toBe(project.id);
  });
});
