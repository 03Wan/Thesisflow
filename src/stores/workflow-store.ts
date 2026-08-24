import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { workflowService, type WorkflowService, type WorkflowUpdateResult } from "@/services/workflowService";
import type { WorkflowStage, WorkflowStageStatus } from "@/types/domain";

export type WorkflowStore = {
  projectId: string | null; stages: WorkflowStage[]; progress: number; currentStageKey: string | null; isLoading: boolean; error: AppError | null;
  loadStages: (projectId: string) => Promise<void>;
  setStageStatus: (stageId: string, status: WorkflowStageStatus) => Promise<WorkflowUpdateResult>;
};

const browserStageDefinitions = [
  ["requirements", "论文要求"], ["topic", "选题"], ["taskbook", "任务书"],
  ["literature", "文献研究"], ["proposal", "开题报告"], ["research", "研究实施"],
  ["first_draft", "论文初稿"], ["midterm", "中期检查"], ["revision", "修改完善"],
  ["final_draft", "论文定稿"], ["plagiarism", "查重检查"], ["advisor_review", "引用核验"],
  ["reviewer_review", "格式检查"], ["inspection", "论文抽检"],
  ["defense_preparation", "答辩准备"], ["defense", "论文答辩"],
  ["post_defense_revision", "答辩后修改"], ["final_submission", "最终稿"], ["archive", "材料归档"],
] as const;

const browserStages = (projectId: string): WorkflowStage[] => {
  const timestamp = new Date().toISOString();
  return browserStageDefinitions.map(([stageKey, title], index) => ({
    id: `browser-stage-${projectId}-${stageKey}`,
    projectId,
    stageKey,
    stageNumber: index + 1,
    title,
    status: index < 5 ? "completed" : index === 5 ? "in_progress" : "not_started",
    startedAt: index <= 5 ? timestamp : null,
    completedAt: index < 5 ? timestamp : null,
    deadline: null,
    progress: index < 5 ? 100 : index === 5 ? 35 : 0,
    sortOrder: index + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
};

export const createWorkflowStore = (service: WorkflowService = workflowService) => create<WorkflowStore>((set, get) => ({
  projectId: null, stages: [], progress: 0, currentStageKey: null, isLoading: false, error: null,
  loadStages: async (projectId) => {
    if (typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)) {
      set({ projectId, stages: browserStages(projectId), progress: 28, currentStageKey: "research", isLoading: false, error: null });
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
          title: "浏览器预览项目",
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
