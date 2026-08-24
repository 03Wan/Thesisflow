import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { fileService } from "@/services/fileService";
import type { ProjectFile, ProjectFileCategory } from "@/types/domain";
type FileStore = { projectId: string | null; files: ProjectFile[]; isLoading: boolean; error: AppError | null; loadFiles: (projectId: string) => Promise<void>; importFiles: (projectId: string, paths: string[], categoryForPath: (path: string) => ProjectFileCategory) => Promise<void>; removeFile: (id: string) => Promise<void>; openLocation: (id: string) => Promise<void>; };
export const useFileStore = create<FileStore>((set) => ({
  projectId: null, files: [], isLoading: false, error: null,
  loadFiles: async (projectId) => { set({ isLoading: true, error: null }); try { set({ projectId, files: await fileService.list(projectId), isLoading: false }); } catch (error) { set({ error: toAppError(error, "无法加载项目文件。"), isLoading: false }); } },
  importFiles: async (projectId, paths, categoryForPath) => { set({ isLoading: true, error: null }); try { const created = await Promise.all(paths.map((path) => fileService.importFromPath(projectId, path, categoryForPath(path)))); set((state) => ({ projectId, files: [...created, ...state.files], isLoading: false })); } catch (error) { set({ error: toAppError(error, "文件导入失败。"), isLoading: false }); throw error; } },
  removeFile: async (id) => { set({ isLoading: true, error: null }); try { await fileService.removeFromProject(id); set((state) => ({ files: state.files.filter((file) => file.id !== id), isLoading: false })); } catch (error) { set({ error: toAppError(error, "无法移除项目文件。"), isLoading: false }); throw error; } },
  openLocation: async (id) => { try { await fileService.openLocation(id); } catch (error) { set({ error: toAppError(error, "无法打开文件位置。") }); throw error; } },
}));
