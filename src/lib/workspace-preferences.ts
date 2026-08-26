export const DEFAULT_WORKSPACE_KEY = "thesisflow/default-workspace";

export const workspaceOptions = [
  { value: "overview", label: "项目总览" },
  { value: "requirements", label: "论文要求" },
  { value: "literature", label: "文献研究" },
  { value: "proposal", label: "开题报告" },
  { value: "research-design", label: "研究设计" },
  { value: "implementation", label: "数据与调研" },
  { value: "outline", label: "论文大纲" },
  { value: "writing", label: "正文写作" },
  { value: "revisions", label: "修改任务" },
  { value: "calendar", label: "节点日历" },
  { value: "files", label: "文件中心" },
] as const;

type WorkspaceValue = (typeof workspaceOptions)[number]["value"];

export function defaultWorkspaceRoute(): `/${WorkspaceValue}` {
  const saved = typeof window === "undefined" ? null : window.localStorage.getItem(DEFAULT_WORKSPACE_KEY);
  return workspaceOptions.some((item) => item.value === saved) ? `/${saved as WorkspaceValue}` : "/overview";
}

export function workspaceLabel(value: string): string {
  return workspaceOptions.find((item) => item.value === value)?.label ?? "项目总览";
}
