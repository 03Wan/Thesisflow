import { AppError, toAppError } from "@/lib/app-error";
import { AdvisorRepository } from "@/repositories/advisorRepository";
import type { AdvisorSession } from "@/types/domain";
const now = () => new Date().toISOString();
export class AdvisorService {
  constructor(private readonly repository = new AdvisorRepository()) {}
  async list(projectId: string) {
    try {
      return await this.repository.listByProject(projectId);
    } catch (error) {
      throw toAppError(error, "无法加载导师指导记录。");
    }
  }
  async create(session: AdvisorSession) {
    try {
      return await this.repository.create(session);
    } catch (error) {
      throw toAppError(error, "无法保存导师指导记录。");
    }
  }
  async update(
    id: string,
    changes: Partial<Omit<AdvisorSession, "id" | "projectId" | "createdAt">>,
  ) {
    const result = await this.repository.update(id, {
      ...changes,
      updatedAt: now(),
    });
    if (!result) throw new AppError("not_found", "未找到导师指导记录。");
    return result;
  }
  async remove(id: string) {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw toAppError(error, "无法删除导师指导记录。");
    }
  }
}
export const advisorService = new AdvisorService();
