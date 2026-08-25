export type StageState = "completed" | "active" | "pending" | "overdue" | "blocked";

export const stageStates: Record<StageState, { label: string; tone: string }> = {
  completed: { label: "已完成", tone: "green" },
  active: { label: "进行中", tone: "blue" },
  pending: { label: "待开始", tone: "gray" },
  overdue: { label: "已逾期", tone: "red" },
  blocked: { label: "已阻塞", tone: "amber" },
};
