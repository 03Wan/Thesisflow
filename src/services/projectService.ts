import { AppError, toAppError } from "@/lib/app-error";
import { invoke } from "@tauri-apps/api/core";
import { ProjectRepository } from "@/repositories/projectRepository";
import type { ProjectStatus, ThesisProject } from "@/types/domain";

export type CreateProjectInput = Pick<ThesisProject, "title"> & Partial<Omit<ThesisProject, "id" | "title" | "createdAt" | "updatedAt" | "lastOpenedAt" | "status">>;
export type UpdateProjectInput = Partial<Omit<ThesisProject, "id" | "createdAt" | "updatedAt">>;

export interface ProjectServiceContract {
  listProjects(): Promise<ThesisProject[]>;
  openProject(id: string): Promise<ThesisProject>;
  createProject(input: CreateProjectInput): Promise<ThesisProject>;
  updateProject(id: string, input: UpdateProjectInput): Promise<ThesisProject>;
  archiveProject(id: string): Promise<ThesisProject>;
  unarchiveProject(id: string): Promise<ThesisProject>;
  deleteProject(id: string): Promise<void>;
}

const now = () => new Date().toISOString();

export class ProjectService implements ProjectServiceContract {
  constructor(private readonly repository = new ProjectRepository()) {}

  async listProjects(): Promise<ThesisProject[]> {
    try { return await this.repository.findAll(); } catch (error) { throw toAppError(error, "无法加载项目列表。"); }
  }

  async openProject(id: string): Promise<ThesisProject> {
    const openedAt = now();
    return this.requireProject(await this.safeUpdate(id, { lastOpenedAt: openedAt, updatedAt: openedAt }));
  }

  async createProject(input: CreateProjectInput): Promise<ThesisProject> {
    const title = input.title.trim();
    if (!title) throw new AppError("validation", "项目名称不能为空。");
    try {
      return await invoke<ThesisProject>("create_local_project", {
        request: {
          title, school: input.school, college: input.college, major: input.major, grade: input.grade,
          studentName: input.studentName, studentNumber: input.studentNumber, advisorName: input.advisorName,
          researchType: input.researchType, defenseBatch: input.defenseBatch,
        },
      });
    } catch (error) { throw toAppError(error, "无法创建项目。请检查本地目录访问权限后重试。"); }
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<ThesisProject> {
    if (input.title !== undefined && !input.title.trim()) throw new AppError("validation", "项目名称不能为空。");
    return this.requireProject(await this.safeUpdate(id, { ...input, title: input.title?.trim(), updatedAt: now() }));
  }

  async archiveProject(id: string): Promise<ThesisProject> {
    return this.requireProject(await this.safeUpdate(id, { status: "archived" satisfies ProjectStatus, updatedAt: now() }));
  }

  async unarchiveProject(id: string): Promise<ThesisProject> {
    return this.requireProject(await this.safeUpdate(id, { status: "active" satisfies ProjectStatus, updatedAt: now() }));
  }

  async deleteProject(id: string): Promise<void> {
    try { await invoke("delete_local_project", { projectId: id }); }
    catch (error) { throw toAppError(error, "无法删除项目。数据库记录已保留，请检查本地项目目录。"); }
  }

  private async safeUpdate(id: string, input: UpdateProjectInput & { updatedAt: string }): Promise<ThesisProject | null> {
    try { return await this.repository.update(id, input); } catch (error) { throw toAppError(error, "无法保存项目变更。"); }
  }
  private async getExisting(id: string): Promise<ThesisProject> {
    try { return this.requireProject(await this.repository.findById(id)); } catch (error) { throw toAppError(error, "无法读取项目。"); }
  }
  private requireProject(project: ThesisProject | null): ThesisProject { if (!project) throw new AppError("not_found", "未找到指定项目。"); return project; }
}

export const projectService = new ProjectService();
