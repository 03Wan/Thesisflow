import { getDatabase } from "@/lib/database";
import type { ThesisProject } from "@/types/domain";

type ProjectRow = Record<string, unknown>;
export type CreateProjectRecord = ThesisProject;
export type UpdateProjectRecord = Partial<Omit<ThesisProject, "id" | "createdAt">>;

const columns: Record<Exclude<keyof ThesisProject, "id" | "createdAt">, string> = {
  title: "title", school: "school", college: "college", major: "major", grade: "grade",
  studentName: "student_name", studentNumber: "student_number", advisorName: "advisor_name",
  researchType: "research_type", currentStage: "current_stage", progress: "progress",
  defenseBatch: "defense_batch", updatedAt: "updated_at", lastOpenedAt: "last_opened_at",
  projectFolder: "project_folder", status: "status",
};

function mapProject(row: ProjectRow): ThesisProject {
  return {
    id: String(row.id), title: String(row.title), school: String(row.school), college: String(row.college), major: String(row.major), grade: String(row.grade),
    studentName: String(row.student_name), studentNumber: String(row.student_number), advisorName: String(row.advisor_name), researchType: String(row.research_type),
    currentStage: String(row.current_stage), progress: Number(row.progress), defenseBatch: row.defense_batch as string | null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at), lastOpenedAt: row.last_opened_at as string | null,
    projectFolder: String(row.project_folder), status: row.status as ThesisProject["status"],
  };
}

export class ProjectRepository {
  async findAll(): Promise<ThesisProject[]> {
    const database = await getDatabase();
    const rows = await database.select<ProjectRow[]>("SELECT * FROM thesis_projects ORDER BY last_opened_at DESC, created_at DESC");
    return rows.map(mapProject);
  }

  async findById(id: string): Promise<ThesisProject | null> {
    const database = await getDatabase();
    const rows = await database.select<ProjectRow[]>("SELECT * FROM thesis_projects WHERE id = ? LIMIT 1", [id]);
    return rows[0] ? mapProject(rows[0]) : null;
  }

  async create(project: CreateProjectRecord): Promise<ThesisProject> {
    const database = await getDatabase();
    await database.execute(
      "INSERT INTO thesis_projects (id,title,school,college,major,grade,student_name,student_number,advisor_name,research_type,current_stage,progress,defense_batch,created_at,updated_at,last_opened_at,project_folder,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [project.id, project.title, project.school, project.college, project.major, project.grade, project.studentName, project.studentNumber, project.advisorName, project.researchType, project.currentStage, project.progress, project.defenseBatch, project.createdAt, project.updatedAt, project.lastOpenedAt, project.projectFolder, project.status],
    );
    return project;
  }

  async update(id: string, changes: UpdateProjectRecord): Promise<ThesisProject | null> {
    const entries = Object.entries(changes).filter(([, value]) => value !== undefined) as [keyof typeof columns, unknown][];
    if (!entries.length) return this.findById(id);
    const database = await getDatabase();
    const assignments = entries.map(([key]) => `${columns[key]} = ?`).join(", ");
    await database.execute(`UPDATE thesis_projects SET ${assignments} WHERE id = ?`, [...entries.map(([, value]) => value), id]);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const database = await getDatabase();
    await database.execute("DELETE FROM thesis_projects WHERE id = ?", [id]);
  }
}
