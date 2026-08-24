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

const previewSessions = (projectId: string): AdvisorSession[] => [
  {
    id: `preview-guidance-${projectId}-2`, projectId, workflowStageId: null, sessionNumber: 2,
    sessionAt: "2026-08-24T09:30:00.000Z", method: "in_person", advisorName: "指导教师",
    summary: "核对研究问题、变量口径与样本筛选方案，讨论实证章节的推进顺序。",
    feedback: "研究框架已经成形，需进一步说明核心变量构造，并补充内生性处理方案。",
    nextSteps: "完善变量定义表，补充工具变量与稳健性检验说明。", status: "completed",
    createdAt: "2026-08-24T09:30:00.000Z", updatedAt: "2026-08-24T09:30:00.000Z",
  },
  {
    id: `preview-guidance-${projectId}-1`, projectId, workflowStageId: null, sessionNumber: 1,
    sessionAt: "2026-08-12T06:00:00.000Z", method: "online", advisorName: "指导教师",
    summary: "讨论选题边界、理论机制与文献综述结构。",
    feedback: "选题具有现实意义，建议聚焦资源配置效率这一传导路径。",
    nextSteps: "重写研究问题，整理近五年核心文献并形成述评矩阵。", status: "completed",
    createdAt: "2026-08-12T06:00:00.000Z", updatedAt: "2026-08-12T06:00:00.000Z",
  },
];

export const useAdvisorStore = create<AdvisorStore>((set, get) => ({
  projectId: null, sessions: [], isLoading: false, error: null,
  load: async (projectId) => {
    if (isBrowserPreview()) {
      set((state) => ({ projectId, sessions: state.projectId === projectId && state.sessions.length ? state.sessions : previewSessions(projectId), error: null, isLoading: false }));
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
