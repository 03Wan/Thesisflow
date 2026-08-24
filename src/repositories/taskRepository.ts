import { getDatabase } from "@/lib/database";
import type { Task } from "@/types/domain";
export class TaskRepository {
  async listByProject(projectId: string): Promise<Task[]> {
    const db = await getDatabase();
    return db.select<Task[]>(
      "SELECT t.id,t.project_id AS projectId,t.workflow_stage_id AS workflowStageId,w.stage_key AS stageKey,t.title,t.description,t.source_type AS sourceType,t.source_reference_id AS sourceReferenceId,t.priority,t.status,t.due_at AS dueAt,t.completed_at AS completedAt,t.sort_order AS sortOrder,t.created_at AS createdAt,t.updated_at AS updatedAt FROM tasks t LEFT JOIN workflow_stages w ON w.id=t.workflow_stage_id WHERE t.project_id=? ORDER BY t.status,t.due_at,t.sort_order",
      [projectId],
    );
  }
  async findById(id: string): Promise<Task | null> {
    const db = await getDatabase();
    const rows = await db.select<Task[]>(
      "SELECT t.id,t.project_id AS projectId,t.workflow_stage_id AS workflowStageId,w.stage_key AS stageKey,t.title,t.description,t.source_type AS sourceType,t.source_reference_id AS sourceReferenceId,t.priority,t.status,t.due_at AS dueAt,t.completed_at AS completedAt,t.sort_order AS sortOrder,t.created_at AS createdAt,t.updated_at AS updatedAt FROM tasks t LEFT JOIN workflow_stages w ON w.id=t.workflow_stage_id WHERE t.id=?",
      [id],
    );
    return rows[0] ?? null;
  }
  async create(task: Task): Promise<Task> {
    const db = await getDatabase();
    await db.execute(
      "INSERT INTO tasks (id,project_id,workflow_stage_id,title,description,source_type,source_reference_id,priority,status,due_at,completed_at,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        task.id,
        task.projectId,
        task.workflowStageId,
        task.title,
        task.description,
        task.sourceType,
        task.sourceReferenceId,
        task.priority,
        task.status,
        task.dueAt,
        task.completedAt,
        task.sortOrder,
        task.createdAt,
        task.updatedAt,
      ],
    );
    return task;
  }
  async update(
    id: string,
    changes: Partial<Omit<Task, "id" | "projectId" | "createdAt">>,
  ): Promise<Task | null> {
    const map: Record<string, string> = {
      workflowStageId: "workflow_stage_id",
      title: "title",
      description: "description",
      sourceType: "source_type",
      sourceReferenceId: "source_reference_id",
      priority: "priority",
      status: "status",
      dueAt: "due_at",
      completedAt: "completed_at",
      sortOrder: "sort_order",
      updatedAt: "updated_at",
    };
    const entries = Object.entries(changes).filter(([, v]) => v !== undefined);
    if (!entries.length) return this.findById(id);
    const db = await getDatabase();
    await db.execute(
      `UPDATE tasks SET ${entries.map(([k]) => `${map[k]} = ?`).join(", ")} WHERE id = ?`,
      [...entries.map(([, v]) => v), id],
    );
    return this.findById(id);
  }
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute("DELETE FROM tasks WHERE id=?", [id]);
  }
}
