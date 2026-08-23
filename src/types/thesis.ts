export type Metric = { current: number; target: number };
export type RequirementMetric = { id: string; label: string; current: number; target: number; unit: string; tone: "blue" | "green" | "orange" | "purple" };
export type WorkflowStage = { id: number; title: string; date: string; status: "completed" | "active" | "pending" | "overdue" };
export type Milestone = { date: string; title: string; status: "completed" | "upcoming" | "overdue"; detail: string };
export type GuidanceRecord = { index: number; title: string; date: string; status: string };
export type Todo = { title: string; due: string; priority: "重要" | "一般" };
export type RecentFile = { name: string; type: "doc" | "pdf" | "sheet"; updatedAt: string };

export type ThesisProject = { title: string; school: string; college: string; major: string; cohort: string; advisor: string; createdAt: string; currentStage: string; completion: number; metrics: { bodyWords: Metric; references: Metric; foreignReferences: Metric; journalReferences: Metric; advisorGuidance: Metric }; requirements: RequirementMetric[]; workflow: WorkflowStage[]; milestones: Milestone[]; guidanceRecords: GuidanceRecord[]; todos: Todo[]; evaluation: { score: number; dimensions: { subject: string; score: number }[] }; recentFiles: RecentFile[]; calendar: { label: string; weekdays: string[]; days: number[]; highlightedDay: number } };
