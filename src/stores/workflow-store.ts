import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { workflowService, type WorkflowService, type WorkflowUpdateResult } from "@/services/workflowService";
import type { WorkflowStage, WorkflowStageStatus } from "@/types/domain";
import { OFFICIAL_WORKFLOW } from "@/data/official-workflow";

export type WorkflowStore = {
  projectId: string | null; stages: WorkflowStage[]; progress: number; currentStageKey: string | null; isLoading: boolean; error: AppError | null;
  loadStages: (projectId: string) => Promise<void>;
  setStageStatus: (stageId: string, status: WorkflowStageStatus) => Promise<WorkflowUpdateResult>;
};

const browserStages = (projectId: string): WorkflowStage[] => {
  const timestamp = new Date().toISOString();
  return OFFICIAL_WORKFLOW.map((definition, index) => ({
    id: `browser-stage-${projectId}-${definition.key}`,
    projectId,
    stageKey: definition.key,
    stageNumber: index + 1,
    title: definition.title,
    status: "not_started",
    startedAt: null,
    completedAt: null,
    deadline: definition.deadline ? `${definition.deadline}T23:59:59.000+08:00` : null,
    progress: 0,
    sortOrder: index + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
};

export const createWorkflowStore = (service: WorkflowService = workflowService) => create<WorkflowStore>((set, get) => ({
  projectId: null, stages: [], progress: 0, currentStageKey: null, isLoading: false, error: null,
  loadStages: async (projectId) => {
    if (typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)) {
      const stages = browserStages(projectId);
      set({ projectId, stages, progress: 0, currentStageKey: stages[0]?.stageKey ?? null, isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const stages = await service.list(projectId);
      const current = stages.find((stage) => stage.status === "in_progress") ?? stages.find((stage) => stage.status === "not_started") ?? stages[0] ?? null;
      set({ projectId, stages, progress: service.calculateProjectProgress(stages), currentStageKey: current?.stageKey ?? null, isLoading: false });
    } catch (error) { set({ error: toAppError(error, "无法加载工作流。"), isLoading: false }); }
  },
  setStageStatus: async (stageId, status) => {
    if (typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)) {
      const timestamp = new Date().toISOString();
      const current = get();
      const stages = current.stages.map((stage) => stage.id === stageId ? {
        ...stage,
        status,
        progress: status === "completed" ? 100 : status === "in_progress" ? Math.max(stage.progress, 1) : 0,
        startedAt: status === "not_started" ? null : stage.startedAt ?? timestamp,
        completedAt: status === "completed" ? timestamp : null,
        updatedAt: timestamp,
      } : stage);
      const stage = stages.find((item) => item.id === stageId);
      if (!stage) throw toAppError(new Error("未找到工作流阶段。"), "无法更新阶段状态。");
      const next = stages.find((item) => item.status === "in_progress")
        ?? stages.find((item) => item.status === "not_started")
        ?? stages[stages.length - 1];
      const progress = service.calculateProjectProgress(stages);
      const projectId = current.projectId ?? stage.projectId;
      const result: WorkflowUpdateResult = {
        stage,
        stages,
        project: {
          id: projectId,
          title: "当前项目",
          school: "",
          college: "",
          major: "",
          grade: "",
          studentName: "",
          studentNumber: "",
          advisorName: "",
          researchType: "",
          currentStage: next?.stageKey ?? stage.stageKey,
          progress,
          defenseBatch: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          lastOpenedAt: timestamp,
          projectFolder: "",
          status: "active",
        },
      };
      set({ stages, progress, currentStageKey: result.project.currentStage, isLoading: false, error: null });
      return result;
    }
    set({ isLoading: true, error: null });
    try {
      const result = await service.setStageStatus(stageId, status);
      set({ projectId: result.project.id, stages: result.stages, progress: result.project.progress, currentStageKey: result.project.currentStage, isLoading: false });
      return result;
    } catch (error) { const appError = toAppError(error, "无法更新阶段状态。"); set({ error: appError, isLoading: false }); throw appError; }
  },
}));

export const useWorkflowStore = createWorkflowStore();
