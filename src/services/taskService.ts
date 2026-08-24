import { AppError, toAppError } from "@/lib/app-error";
import { TaskRepository } from "@/repositories/taskRepository";
import type { Task } from "@/types/domain";
const now = () => new Date().toISOString();
export class TaskService {
  constructor(private readonly repository = new TaskRepository()) {}
  async list(projectId: string) {
    try {
      return await this.repository.listByProject(projectId);
    } catch (error) {
      throw toAppError(error, "无法加载任务。");
    }
  }
  async create(task: Task) {
    if (!task.title.trim())
      throw new AppError("validation", "任务名称不能为空。");
    try {
      return await this.repository.create({
        ...task,
        title: task.title.trim(),
      });
    } catch (error) {
      throw toAppError(error, "无法创建任务。");
    }
  }
  /** AI output remains advisory; only an explicit local-user confirmation may create a project task. */
  async createFromAISuggestion(task: Task, provenance: { aiRunId: string; aiRunProjectId: string; confirmedByUser: boolean }) {
    if (!provenance.confirmedByUser) throw new AppError("validation", "AI 建议必须由用户明确确认后才能创建任务。");
    if (!provenance.aiRunId || provenance.aiRunProjectId !== task.projectId) throw new AppError("validation", "AI Run 与任务项目不一致。");
    return this.create({ ...task, sourceType: "ai", sourceReferenceId: provenance.aiRunId });
  }
  async update(
    id: string,
    changes: Partial<Omit<Task, "id" | "projectId" | "createdAt">>,
  ) {
    if (changes.title !== undefined && !changes.title.trim())
      throw new AppError("validation", "任务名称不能为空。");
    const completedAt =
      changes.status === "done"
        ? now()
        : changes.status
          ? null
          : changes.completedAt;
    const result = await this.repository.update(id, {
      ...changes,
      title: changes.title?.trim(),
      completedAt,
      updatedAt: now(),
    });
    if (!result) throw new AppError("not_found", "未找到任务。");
    return result;
  }
  async remove(id: string) {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw toAppError(error, "无法删除任务。");
    }
  }
}
export const taskService = new TaskService();
