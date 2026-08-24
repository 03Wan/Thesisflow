/** Canonical persisted entities for the Phase 2 local SQLite database. */
export type IsoDateTime = string;
export type EntityId = string;

export type ProjectStatus = "draft" | "active" | "archived" | "completed";
export type WorkflowStageStatus =
  "not_started" | "in_progress" | "completed" | "overdue" | "blocked";
export type RequirementStatus = "pending" | "met" | "unmet" | "waived";
export type ProjectFileCategory =
  | "school_rule"
  | "template"
  | "literature"
  | "data"
  | "proposal"
  | "thesis"
  | "translation"
  | "review"
  | "defense"
  | "plagiarism"
  | "archive"
  | "other";
export type ProjectFileSource = "local" | "imported" | "generated";
export type TaskSourceType = "manual" | "advisor" | "ai" | "plagiarism" | "review" | "defense" | "format";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "waiting" | "done";
export type AdvisorSessionMethod = "in_person" | "online" | "phone" | "email" | "other";
export type AdvisorSessionStatus = "planned" | "completed" | "cancelled";
export type SettingValueType = "string" | "number" | "boolean" | "json";

export interface ThesisProject {
  id: EntityId;
  title: string;
  school: string;
  college: string;
  major: string;
  grade: string;
  studentName: string;
  studentNumber: string;
  advisorName: string;
  researchType: string;
  currentStage: string;
  progress: number;
  defenseBatch: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  lastOpenedAt: IsoDateTime | null;
  projectFolder: string;
  status: ProjectStatus;
}

export interface ThesisRequirement {
  id: EntityId;
  projectId: EntityId;
  requirementKey: string;
  label: string;
  targetValue: number | null;
  currentValue: number;
  unit: string;
  status: RequirementStatus;
  description: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface WorkflowStage {
  id: EntityId;
  projectId: EntityId;
  stageKey: string;
  stageNumber: number;
  title: string;
  status: WorkflowStageStatus;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  deadline: IsoDateTime | null;
  progress: number;
  sortOrder: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface ProjectFile {
  id: EntityId;
  projectId: EntityId;
  workflowStageId: EntityId | null;
  originalName: string;
  storedName: string;
  relativePath: string;
  mimeType: string | null;
  extension: string;
  sizeBytes: number;
  checksum: string | null;
  fileCategory: ProjectFileCategory;
  versionLabel: string | null;
  source: ProjectFileSource;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Task {
  id: EntityId;
  projectId: EntityId;
  workflowStageId: EntityId | null;
  stageKey?: string | null;
  title: string;
  description: string | null;
  sourceType: TaskSourceType;
  sourceReferenceId: EntityId | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  sortOrder: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface AdvisorSession {
  id: EntityId;
  projectId: EntityId;
  workflowStageId: EntityId | null;
  sessionNumber: number;
  sessionAt: IsoDateTime;
  method: AdvisorSessionMethod;
  advisorName: string;
  summary: string;
  feedback: string;
  nextSteps: string;
  status: AdvisorSessionStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface AppSetting {
  key: string;
  value: string;
  valueType: SettingValueType;
  updatedAt: IsoDateTime;
}
