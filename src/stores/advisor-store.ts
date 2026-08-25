import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { advisorService } from "@/services/advisorService";
import type { AdvisorSession } from "@/types/domain";

type AdvisorStore = {
  projectId: string | null;
  sessions: AdvisorSession[];
  isLoading: boolean;
  error: AppError | null;
  load: (projectId: string) => Promise<void>;
  create: (session: AdvisorSession) => Promise<AdvisorSession>;
  update: (id: string, changes: Partial<Omit<AdvisorSession, "id" | "projectId" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const isBrowserPreview = () => typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);

export const useAdvisorStore = create<AdvisorStore>((set, get) => ({
  projectId: null, sessions: [], isLoading: false, error: null,
  load: async (projectId) => {
    if (isBrowserPreview()) {
      set((state) => ({ projectId, sessions: state.projectId === projectId ? state.sessions : [], error: null, isLoading: false }));
      return;
    }
    set({ isLoading: true, error: null });
    try { set({ projectId, sessions: await advisorService.list(projectId), error: null, isLoading: false }); }
    catch (error) { set({ error: toAppError(error, "无法加载导师指导记录。"), isLoading: false }); }
  },
  create: async (session) => {
    if (isBrowserPreview()) { set((state) => ({ sessions: [session, ...state.sessions], error: null, isLoading: false })); return session; }
    set({ isLoading: true, error: null });
    try { const created = await advisorService.create(session); set((state) => ({ sessions: [created, ...state.sessions], error: null, isLoading: false })); return created; }
    catch (error) { const appError = toAppError(error, "无法保存导师指导记录。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  update: async (id, changes) => {
    if (isBrowserPreview()) { set((state) => ({ sessions: state.sessions.map((session) => session.id === id ? { ...session, ...changes } : session), error: null, isLoading: false })); return; }
    set({ isLoading: true, error: null });
    try { const updated = await advisorService.update(id, changes); set((state) => ({ sessions: state.sessions.map((session) => session.id === id ? updated : session), error: null, isLoading: false })); }
    catch (error) { const appError = toAppError(error, "无法更新导师指导记录。"); set({ error: appError, isLoading: false }); throw appError; }
  },
  remove: async (id) => {
    if (isBrowserPreview()) { set({ sessions: get().sessions.filter((session) => session.id !== id), error: null, isLoading: false }); return; }
    set({ isLoading: true, error: null });
    try { await advisorService.remove(id); set((state) => ({ sessions: state.sessions.filter((session) => session.id !== id), error: null, isLoading: false })); }
    catch (error) { const appError = toAppError(error, "无法删除导师指导记录。"); set({ error: appError, isLoading: false }); throw appError; }
  },
}));
