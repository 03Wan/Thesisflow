import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { requirementService } from "@/services/requirementService";
import type { ThesisRequirement } from "@/types/domain";

type RequirementChanges = Partial<Omit<ThesisRequirement, "id" | "projectId" | "createdAt">>;
type RequirementStore = { projectId: string | null; requirements: ThesisRequirement[]; isLoading: boolean; error: AppError | null; load: (projectId: string) => Promise<void>; update: (id: string, changes: RequirementChanges) => Promise<ThesisRequirement>; };

const browserStorageKey = (projectId: string) => `thesisflow:${projectId}:requirements`;
const isBrowserPreview = () => typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);
const browserRequirements = (projectId: string): ThesisRequirement[] => { try { return JSON.parse(localStorage.getItem(browserStorageKey(projectId)) ?? "[]") as ThesisRequirement[]; } catch { return []; } };

export const useRequirementStore = create<RequirementStore>((set, get) => ({
  projectId: null, requirements: [], isLoading: false, error: null,
  load: async (projectId) => {
    if (isBrowserPreview()) { set({ projectId, requirements: browserRequirements(projectId), isLoading: false, error: null }); return; }
    set({ projectId, isLoading: true, error: null });
    try {
      const requirements = await requirementService.list(projectId);
      if (get().projectId === projectId) set({ requirements, isLoading: false, error: null });
    } catch (error) {
      if (get().projectId === projectId) set({ error: toAppError(error, "无法加载论文要求。"), isLoading: false });
    }
  },
  update: async (id, changes) => {
    if (isBrowserPreview()) {
      const existing = get().requirements.find((item) => item.id === id);
      if (!existing) throw new Error("未找到论文要求。");
      const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() };
      const requirements = get().requirements.map((item) => item.id === id ? updated : item);
      const projectId = get().projectId;
      if (projectId) localStorage.setItem(browserStorageKey(projectId), JSON.stringify(requirements));
      set({ requirements, error: null });
      return updated;
    }
    set({ isLoading: true, error: null });
    try {
      const updated = await requirementService.update(id, changes);
      set((state) => ({ requirements: state.requirements.map((item) => item.id === id ? updated : item), isLoading: false, error: null }));
      return updated;
    } catch (error) {
      const appError = toAppError(error, "无法更新论文要求。");
      set({ error: appError, isLoading: false });
      throw appError;
    }
  },
}));
