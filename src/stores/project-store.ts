import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { projectService, type CreateProjectInput, type ProjectServiceContract, type UpdateProjectInput } from "@/services/projectService";
import type { ThesisProject } from "@/types/domain";

export type ProjectStore = {
  projects: ThesisProject[];
  activeProjectId: string | null;
  isLoading: boolean;
  error: AppError | null;
  loadProjects: () => Promise<void>;
  openProject: (id: string) => Promise<ThesisProject>;
  createProject: (input: CreateProjectInput) => Promise<ThesisProject>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<ThesisProject>;
  archiveProject: (id: string) => Promise<ThesisProject>;
  unarchiveProject: (id: string) => Promise<ThesisProject>;
  deleteProject: (id: string) => Promise<void>;
  clearError: () => void;
};

const replaceProject = (projects: ThesisProject[], project: ThesisProject) => projects.map((item) => item.id === project.id ? project : item);

export const createProjectStore = (service: ProjectServiceContract = projectService) => create<ProjectStore>((set, get) => ({
  projects: [], activeProjectId: null, isLoading: false, error: null,
  clearError: () => set({ error: null }),
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await service.listProjects();
      set({ projects, activeProjectId: get().activeProjectId ?? projects[0]?.id ?? null, isLoading: false, error: null });
    }
    catch (error) { set({ error: toAppError(error, "无法加载项目列表。"), isLoading: false }); }
  },
  openProject: async (id) => {
    set({ isLoading: true, error: null });
    try { const project = await service.openProject(id); set({ projects: replaceProject(get().projects, project), activeProjectId: id, isLoading: false }); return project; }
    catch (error) { const appError = toAppError(error, "无法打开项目。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  createProject: async (input) => {
    set({ isLoading: true, error: null });
    try { const project = await service.createProject(input); set({ projects: [project, ...get().projects], activeProjectId: project.id, isLoading: false }); return project; }
    catch (error) { const appError = toAppError(error, "无法创建项目。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  updateProject: async (id, input) => {
    set({ isLoading: true, error: null });
    try { const project = await service.updateProject(id, input); set({ projects: replaceProject(get().projects, project), isLoading: false }); return project; }
    catch (error) { const appError = toAppError(error, "无法更新项目。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  archiveProject: async (id) => {
    set({ isLoading: true, error: null });
    try { const project = await service.archiveProject(id); set({ projects: replaceProject(get().projects, project), isLoading: false }); return project; }
    catch (error) { const appError = toAppError(error, "无法归档项目。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  unarchiveProject: async (id) => {
    set({ isLoading: true, error: null });
    try { const project = await service.unarchiveProject(id); set({ projects: replaceProject(get().projects, project), isLoading: false }); return project; }
    catch (error) { const appError = toAppError(error, "无法恢复项目。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try { await service.deleteProject(id); set((state) => ({ projects: state.projects.filter((project) => project.id !== id), activeProjectId: state.activeProjectId === id ? null : state.activeProjectId, isLoading: false })); }
    catch (error) { const appError = toAppError(error, "无法删除项目。"); set({ error: appError, isLoading: false }); throw appError; }
  },
}));

export const useProjectStore = createProjectStore();
