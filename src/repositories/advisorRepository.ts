import { getDatabase } from "@/lib/database";
import type { AdvisorSession } from "@/types/domain";
export class AdvisorRepository {
  async listByProject(projectId: string): Promise<AdvisorSession[]> {
    const db = await getDatabase();
    return db.select<AdvisorSession[]>(
      "SELECT id,project_id AS projectId,workflow_stage_id AS workflowStageId,session_number AS sessionNumber,session_at AS sessionAt,format AS method,advisor_name AS advisorName,summary,feedback,next_steps AS nextSteps,status,created_at AS createdAt,updated_at AS updatedAt FROM advisor_sessions WHERE project_id=? ORDER BY session_number DESC,session_at DESC",
      [projectId],
    );
  }
  async findById(id: string): Promise<AdvisorSession | null> {
    const db = await getDatabase();
    const rows = await db.select<AdvisorSession[]>(
      "SELECT id,project_id AS projectId,workflow_stage_id AS workflowStageId,session_number AS sessionNumber,session_at AS sessionAt,format AS method,advisor_name AS advisorName,summary,feedback,next_steps AS nextSteps,status,created_at AS createdAt,updated_at AS updatedAt FROM advisor_sessions WHERE id=?",
      [id],
    );
    return rows[0] ?? null;
  }
  async create(session: AdvisorSession): Promise<AdvisorSession> {
    const db = await getDatabase();
    await db.execute(
      "INSERT INTO advisor_sessions (id,project_id,workflow_stage_id,session_number,session_at,format,advisor_name,summary,feedback,next_steps,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        session.id,
        session.projectId,
        session.workflowStageId,
        session.sessionNumber,
        session.sessionAt,
        session.method,
        session.advisorName,
        session.summary,
        session.feedback,
        session.nextSteps,
        session.status,
        session.createdAt,
        session.updatedAt,
      ],
    );
    return session;
  }
  async update(
    id: string,
    changes: Partial<Omit<AdvisorSession, "id" | "projectId" | "createdAt">>,
  ): Promise<AdvisorSession | null> {
    const map: Record<string, string> = {
      workflowStageId: "workflow_stage_id",
      sessionNumber: "session_number",
      sessionAt: "session_at",
      method: "format",
      advisorName: "advisor_name",
      summary: "summary",
      feedback: "feedback",
      nextSteps: "next_steps",
      status: "status",
      updatedAt: "updated_at",
    };
    const entries = Object.entries(changes).filter(([, v]) => v !== undefined);
    if (!entries.length) return this.findById(id);
    const db = await getDatabase();
    await db.execute(
      `UPDATE advisor_sessions SET ${entries.map(([k]) => `${map[k]} = ?`).join(", ")} WHERE id = ?`,
      [...entries.map(([, v]) => v), id],
    );
    return this.findById(id);
  }
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute("DELETE FROM advisor_sessions WHERE id=?", [id]);
  }
}
