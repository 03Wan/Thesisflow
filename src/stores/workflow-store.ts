import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { workflowService, type WorkflowService, type WorkflowUpdateResult } from "@/services/workflowService";
import type { WorkflowStage, WorkflowStageStatus } from "@/types/domain";

export type WorkflowStore = {
  projectId: string | null; stages: WorkflowStage[]; progress: number; currentStageKey: string | null; isLoading: boolean; error: AppError | null;
  loadStages: (projectId: string) => Promise<void>;
  setStageStatus: (stageId: string, status: WorkflowStageStatus) => Promise<WorkflowUpdateResult>;
};

export const createWorkflowStore = (service: WorkflowService = workflowService) => create<WorkflowStore>((set) => ({
  projectId: null, stages: [], progress: 0, currentStageKey: null, isLoading: false, error: null,
  loadStages: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const stages = await service.list(projectId);
      const current = stages.find((stage) => stage.status === "in_progress") ?? stages.find((stage) => stage.status === "not_started") ?? stages[0] ?? null;
      set({ projectId, stages, progress: service.calculateProjectProgress(stages), currentStageKey: current?.stageKey ?? null, isLoading: false });
    } catch (error) { set({ error: toAppError(error, "无法加载工作流。"), isLoading: false }); }
  },
  setStageStatus: async (stageId, status) => {
    set({ isLoading: true, error: null });
    try {
      const result = await service.setStageStatus(stageId, status);
      set({ projectId: result.project.id, stages: result.stages, progress: result.project.progress, currentStageKey: result.project.currentStage, isLoading: false });
      return result;
    } catch (error) { const appError = toAppError(error, "无法更新阶段状态。"); set({ error: appError, isLoading: false }); throw appError; }
  },
}));

export const useWorkflowStore = createWorkflowStore();
