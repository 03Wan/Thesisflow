import type { ThesisProject } from "@/types/domain";
export type AdvisorSuggestions = { summary: string; risk_level: "low" | "medium" | "high"; issues: string[]; suggestions: string[]; missing_information: string[]; source_refs: string[]; };
export function fakeReadonlyAdvisor(project: ThesisProject): AdvisorSuggestions { return { summary: `已对“${project.title}”完成只读状态评估。当前仅有项目元数据；无法核实学校规则来源。`, risk_level: "medium", issues: ["未提供已确认规则、逾期任务或来源片段。"], suggestions: ["选择少量来源片段和已确认规则后重新评估。"], missing_information: ["已确认 thesis rules", "逾期/阻塞任务", "指导记录数量"], source_refs: [] }; }
