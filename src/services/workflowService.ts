import { AppError, toAppError } from "@/lib/app-error";
import { ProjectRepository } from "@/repositories/projectRepository";
import { WorkflowRepository } from "@/repositories/workflowRepository";
import type { ThesisProject, WorkflowStage, WorkflowStageStatus } from "@/types/domain";

const now = () => new Date().toISOString();
export type WorkflowUpdateResult = { stage: WorkflowStage; stages: WorkflowStage[]; project: ThesisProject };

export class WorkflowService {
  constructor(private readonly repository = new WorkflowRepository(), private readonly projectRepository = new ProjectRepository()) {}
  async list(projectId: string): Promise<WorkflowStage[]> { try { return await this.repository.listByProject(projectId); } catch (error) { throw toAppError(error, "无法加载工作流阶段。"); } }
  calculateProjectProgress(stages: WorkflowStage[]): number { return stages.length ? Math.round((stages.filter((stage) => stage.status === "completed").length / stages.length) * 100) : 0; }
  async setStageStatus(stageId: string, status: WorkflowStageStatus): Promise<WorkflowUpdateResult> {
    const existing = await this.repository.findById(stageId);
    if (!existing) throw new AppError("not_found", "未找到工作流阶段。");
    const timestamp = now();
    const stage = await this.update(stageId, { status, progress: status === "completed" ? 100 : 0, startedAt: status === "not_started" ? null : existing.startedAt ?? timestamp, completedAt: status === "completed" ? timestamp : null });
    const stages = await this.list(stage.projectId);
    const current = stages.find((item) => item.status === "in_progress") ?? stages.find((item) => item.status === "not_started") ?? stages.find((item) => item.status === "blocked" || item.status === "overdue") ?? stages[stages.length - 1];
    if (!current) throw new AppError("not_found", "项目没有可用的工作流阶段。");
    const project = await this.projectRepository.update(stage.projectId, { currentStage: current.stageKey, progress: this.calculateProjectProgress(stages), updatedAt: timestamp });
    if (!project) throw new AppError("not_found", "未找到所属项目，阶段状态未能同步。");
    return { stage, stages, project };
  }
  async create(stage: WorkflowStage): Promise<WorkflowStage> { try { return await this.repository.create(stage); } catch (error) { throw toAppError(error, "无法创建工作流阶段。"); } }
  async update(id: string, changes: Partial<Omit<WorkflowStage, "id" | "projectId" | "createdAt">>): Promise<WorkflowStage> { try { const result = await this.repository.update(id, { ...changes, updatedAt: now() }); if (!result) throw new AppError("not_found", "未找到工作流阶段。"); return result; } catch (error) { throw toAppError(error, "无法保存阶段状态。"); } }
  async remove(id: string): Promise<void> { try { await this.repository.delete(id); } catch (error) { throw toAppError(error, "无法删除工作流阶段。"); } }
}
export const workflowService = new WorkflowService();
