import { describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import { ProjectRepository } from "@/repositories/projectRepository";
import { FileService } from "@/services/fileService";
import { ProjectService } from "@/services/projectService";
import { createProjectStore } from "@/stores/project-store";

describe("Phase 2 failure paths", () => {
  it("does not open a nonexistent project or change the active workspace", async () => {
    const repository = { update: vi.fn().mockResolvedValue(null) } as unknown as ProjectRepository;
    const store = createProjectStore(new ProjectService(repository));
    await expect(store.getState().openProject("missing-project")).rejects.toThrow("未找到指定项目");
    expect(store.getState().activeProjectId).toBeNull();
    expect(store.getState().error?.code).toBe("not_found");
  });

  it("surfaces local project directory creation failure without adding a project", async () => {
    invoke.mockRejectedValueOnce("无法创建项目目录：拒绝访问");
    const store = createProjectStore(new ProjectService());
    await expect(store.getState().createProject({ title: "失败项目" })).rejects.toThrow("无法创建项目");
    expect(store.getState().projects).toEqual([]);
    expect(store.getState().error?.message).toContain("无法创建项目");
  });

  it("surfaces deleted or inaccessible import source without creating a file record", async () => {
    invoke.mockRejectedValueOnce("导入源文件不存在或不是普通文件。");
    const service = new FileService();
    await expect(service.importFromPath("project-1", "C:/missing.pdf", "thesis")).rejects.toThrow("无法导入文件");
    expect(invoke).toHaveBeenCalledWith("import_project_file", expect.objectContaining({ request: expect.objectContaining({ sourcePath: "C:/missing.pdf" }) }));
  });
});
