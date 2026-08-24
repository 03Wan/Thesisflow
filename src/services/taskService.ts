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
