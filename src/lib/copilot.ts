import type { ProjectFile, Task, ThesisProject, ThesisRequirement } from "@/types/domain";

export type CopilotIntent = "check" | "summary" | "revise" | "evidence" | "citation" | "logic" | "next" | "conflict";
export type CopilotAction = { label: string; intent: CopilotIntent; destination?: string };
export type CopilotResult = { summary: string; criticalIssues: string[]; pendingItems: string[]; suggestions: string[]; sources: string[]; actions: Array<{ label: string; destination: string }> };

const actionsByRoute: Record<string, CopilotAction[]> = {
  "/requirements": [{ label: "总结要求", intent: "summary" }, { label: "检查遗漏", intent: "check" }, { label: "检查规则冲突", intent: "conflict" }, { label: "下一步怎么做", intent: "next" }],
  "/writing": [{ label: "检查当前章节", intent: "check" }, { label: "检查逻辑", intent: "logic" }, { label: "找文献依据", intent: "evidence", destination: "/literature" }, { label: "学术化修改", intent: "revise" }],
  "/advisor-review": [{ label: "检查引用", intent: "citation" }, { label: "打开引用核验", intent: "citation", destination: "/advisor-review" }, { label: "找文献依据", intent: "evidence", destination: "/literature" }],
  "/implementation": [{ label: "检查数据材料", intent: "check" }, { label: "下一步怎么做", intent: "next" }, { label: "前往文件中心", intent: "check", destination: "/files" }],
};

const genericActions: CopilotAction[] = [{ label: "快速检查", intent: "check" }, { label: "总结当前状态", intent: "summary" }, { label: "下一步怎么做", intent: "next" }];

export function copilotActions(route: string): CopilotAction[] {
  return actionsByRoute[route] ?? genericActions;
}

export function parseCopilotIntent(input: string): { intent: CopilotIntent; instruction: string } {
  const trimmed = input.trim();
  const matched = trimmed.match(/^\/(检查|总结|修改|依据|引用|逻辑|下一步|冲突)(?:\s+|$)(.*)$/);
  if (!matched) return { intent: "next", instruction: trimmed };
  const mapping: Record<string, CopilotIntent> = { 检查: "check", 总结: "summary", 修改: "revise", 依据: "evidence", 引用: "citation", 逻辑: "logic", 下一步: "next", 冲突: "conflict" };
  return { intent: mapping[matched[1]], instruction: matched[2] };
}

export function buildQuickCheck({ project, route, files, requirements, tasks }: { project: ThesisProject | undefined; route: string; files: ProjectFile[]; requirements: ThesisRequirement[]; tasks: Task[] }): CopilotResult {
  if (!project) return { summary: "尚未打开项目，当前无法读取任何论文数据。", criticalIssues: ["请先在项目页创建或打开项目。"], pendingItems: [], suggestions: [], sources: [], actions: [{ label: "前往项目", destination: "/projects" }] };
  const pendingTasks = tasks.filter((task) => task.status === "todo" || task.status === "waiting");
  const overdue = pendingTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now());
  const thesisFiles = files.filter((file) => file.fileCategory === "thesis");
  const sourceFiles = files.slice(0, 3).map((file) => `文件：${file.originalName}`);
  const sources = [...sourceFiles, ...requirements.slice(0, 3).map((item) => `要求：${item.label}`)];
  const criticalIssues: string[] = [];
  const pendingItems: string[] = [];
  const suggestions: string[] = [];
  const actions: Array<{ label: string; destination: string }> = [];
  if (overdue.length) criticalIssues.push(`有 ${overdue.length} 项任务已逾期。`);
  if (route === "/requirements" && !requirements.length) { pendingItems.push("尚未导入并确认论文要求，当前无法检查具体规则遗漏或冲突。"); actions.push({ label: "前往文件中心", destination: "/files" }); }
  if (route === "/writing" && !thesisFiles.length) { pendingItems.push("尚未导入论文正文，当前无法检查章节逻辑或提供原文—修改后 Diff。"); actions.push({ label: "前往文件中心", destination: "/files" }); }
  if (route === "/advisor-review" && !thesisFiles.length) { pendingItems.push("尚未导入正文，当前无法执行引用核验。"); actions.push({ label: "前往文件中心", destination: "/files" }); }
  if (!files.length) { pendingItems.push("当前项目尚未导入文件。" ); actions.push({ label: "前往文件中心", destination: "/files" }); }
  if (pendingTasks.length) suggestions.push(`先处理待办任务：${pendingTasks[0].title}。`);
  else suggestions.push("当前没有待处理任务；请补充当前页面所需的真实材料后再检查。" );
  if (route === "/requirements" && requirements.length) { suggestions.push("可逐条核对已确认要求；规则冲突只会在已解析并待确认的候选存在时显示。" ); actions.push({ label: "查看待确认规则", destination: "/requirements" }); }
  if (route === "/writing" && thesisFiles.length) suggestions.push("请在正文编辑区选中原文后再请求修改；系统将仅展示 Diff，待你确认后才写入。" );
  return { summary: `当前项目“${project.title}”处于“${project.currentStage || "未设置"}”，本页可用真实数据：${files.length} 个文件、${requirements.length} 条已确认要求、${pendingTasks.length} 项待办。`, criticalIssues, pendingItems, suggestions, sources, actions };
}
