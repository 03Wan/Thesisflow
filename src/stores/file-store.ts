import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { fileService } from "@/services/fileService";
import type { ProjectFile, ProjectFileCategory } from "@/types/domain";
type FileStore = { projectId: string | null; files: ProjectFile[]; isLoading: boolean; error: AppError | null; loadFiles: (projectId: string) => Promise<void>; importFiles: (projectId: string, paths: string[], categoryForPath: (path: string) => ProjectFileCategory) => Promise<void>; removeFile: (id: string) => Promise<void>; openLocation: (id: string) => Promise<void>; };
const browserFiles = (projectId: string): ProjectFile[] => {
  const timestamp = new Date().toISOString();
  return [
    { id: `browser-file-${projectId}-1`, projectId, workflowStageId: null, originalName: "变量定义与样本说明.xlsx", storedName: "变量定义与样本说明.xlsx", relativePath: "05_数据/变量定义与样本说明.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", sizeBytes: 18432, checksum: null, fileCategory: "data", versionLabel: "V1.2", source: "imported", createdAt: timestamp, updatedAt: timestamp },
    { id: `browser-file-${projectId}-2`, projectId, workflowStageId: null, originalName: "论文正文_V1.3.docx", storedName: "论文正文_V1.3.docx", relativePath: "06_论文正文/论文正文_V1.3.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", sizeBytes: 286720, checksum: null, fileCategory: "thesis", versionLabel: "V1.3", source: "imported", createdAt: timestamp, updatedAt: timestamp },
  ];
};
export const useFileStore = create<FileStore>((set) => ({
  projectId: null, files: [], isLoading: false, error: null,
  loadFiles: async (projectId) => { if (typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)) { set({ projectId, files: browserFiles(projectId), isLoading: false, error: null }); return; } set({ isLoading: true, error: null }); try { set({ projectId, files: await fileService.list(projectId), isLoading: false }); } catch (error) { set({ error: toAppError(error, "无法加载项目文件。"), isLoading: false }); } },
  importFiles: async (projectId, paths, categoryForPath) => { set({ isLoading: true, error: null }); try { const created = await Promise.all(paths.map((path) => fileService.importFromPath(projectId, path, categoryForPath(path)))); set((state) => ({ projectId, files: [...created, ...state.files], isLoading: false })); } catch (error) { set({ error: toAppError(error, "文件导入失败。"), isLoading: false }); throw error; } },
  removeFile: async (id) => { set({ isLoading: true, error: null }); try { await fileService.removeFromProject(id); set((state) => ({ files: state.files.filter((file) => file.id !== id), isLoading: false })); } catch (error) { set({ error: toAppError(error, "无法移除项目文件。"), isLoading: false }); throw error; } },
  openLocation: async (id) => { try { await fileService.openLocation(id); } catch (error) { set({ error: toAppError(error, "无法打开文件位置。") }); throw error; } },
}));
