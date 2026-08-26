import { ChevronRight, Eye, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { askConfiguredProvider, getActiveBrowserProvider } from "@/ai/providerClient";
import { buildQuickCheck, copilotActions, parseCopilotIntent, type CopilotIntent, type CopilotResult } from "@/lib/copilot";
import { useFileStore } from "@/stores/file-store";
import { useProjectStore } from "@/stores/project-store";
import { useRequirementStore } from "@/stores/requirement-store";
import { useTaskStore } from "@/stores/task-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const labels: Record<string, string> = { "/overview": "项目总览", "/requirements": "论文要求", "/writing": "正文写作", "/implementation": "数据与调研", "/advisor-review": "引用核验", "/literature": "文献研究", "/proposal": "开题报告", "/research-design": "研究设计", "/outline": "论文大纲" };
const purposes: Record<string, string> = { "/requirements": "基于已确认要求与真实来源文件进行核对。", "/writing": "基于已导入正文进行检查；修改必须经由 Diff 确认。", "/implementation": "基于已导入数据与调研材料整理下一步。", "/advisor-review": "基于已导入正文和文献记录进行引用核验。" };

function parseResult(text: string, fallback: CopilotResult): CopilotResult {
  const fallbackResult = (advice: string): CopilotResult => ({ ...fallback, suggestions: advice ? [advice] : fallback.suggestions });
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0]; const value = json ? JSON.parse(json) as Partial<CopilotResult> : null;
    if (!value || typeof value.summary !== "string") return fallbackResult(text.trim());
    const strings = (items: unknown) => Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : [];
    return { summary: value.summary, criticalIssues: strings(value.criticalIssues), pendingItems: strings(value.pendingItems), suggestions: strings(value.suggestions), sources: strings(value.sources).length ? strings(value.sources) : fallback.sources, actions: fallback.actions };
  } catch { return fallbackResult(text.trim()); }
}

export function AIContextPanel() {
  const location = useLocation(); const navigate = useNavigate(); const setOpen = useWorkspaceStore((state) => state.setAiPanelOpen);
  const activeProject = useProjectStore((state) => state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0]);
  const files = useFileStore(); const requirements = useRequirementStore(); const tasks = useTaskStore();
  const [input, setInput] = useState(""); const [result, setResult] = useState<CopilotResult | null>(null); const [loading, setLoading] = useState(false); const [showContext, setShowContext] = useState(false);
  const workspace = labels[location.pathname] ?? "论文工作台";
  const quickCheck = useMemo(() => buildQuickCheck({ project: activeProject, route: location.pathname, files: files.files, requirements: requirements.requirements, tasks: tasks.tasks }), [activeProject, files.files, location.pathname, requirements.requirements, tasks.tasks]);
  const provider = getActiveBrowserProvider();
  useEffect(() => { if (!activeProject) return; void Promise.all([files.loadFiles(activeProject.id), requirements.load(activeProject.id), tasks.load(activeProject.id)]); }, [activeProject?.id, files.loadFiles, requirements.load, tasks.load]);
  useEffect(() => { setResult(null); setInput(""); }, [location.pathname, activeProject?.id]);

  const run = async (intent?: CopilotIntent, supplied = "") => {
    const command = intent ? { intent, instruction: supplied } : parseCopilotIntent(input);
    if (command.intent === "revise") { setResult({ ...quickCheck, summary: "当前不会直接修改正文。", pendingItems: ["请先在正文编辑区选中真实原文；系统随后只会展示“原文—修改后”的 Diff，等待你确认。"], suggestions: [], actions: [{ label: "定位章节", destination: "/writing" }] }); return; }
    if (command.intent === "conflict" && !requirements.requirements.length) { setResult({ ...quickCheck, summary: "当前无法检查规则冲突。", pendingItems: ["尚未导入并确认论文要求；请先导入来源文件并执行本地解析。"], suggestions: [], actions: [{ label: "前往文件中心", destination: "/files" }] }); return; }
    if (!provider || command.intent === "check") { setResult(quickCheck); return; }
    setLoading(true);
    const context = JSON.stringify({ project: { title: activeProject?.title, stage: activeProject?.currentStage, progress: activeProject?.progress }, page: workspace, files: files.files.map((file) => ({ name: file.originalName, category: file.fileCategory })).slice(0, 10), confirmedRequirements: requirements.requirements.map((item) => item.label).slice(0, 10), pendingTasks: tasks.tasks.filter((task) => task.status !== "done").map((task) => task.title).slice(0, 10) });
    const prompt = `你是 ThesisFlow 当前项目的论文 Copilot。只使用以下真实上下文；没有数据时必须写“尚未导入/当前无法检查”。不要虚构论文、文献、规则、数据、来源或检查结论；不得直接覆盖正文。根据用户意图输出 JSON：{"summary":"","criticalIssues":[],"pendingItems":[],"suggestions":[],"sources":[]}。用户意图：${command.intent} ${command.instruction}\n真实上下文：${context}`;
    try { setResult(parseResult(await askConfiguredProvider(provider, prompt), quickCheck)); }
    catch { setResult({ ...quickCheck, summary: "AI 请求未完成，已保留本地真实数据检查结果。" }); }
    finally { setLoading(false); }
  };

  const visibleResult = result ?? quickCheck;
  return <aside className="ai-panel" aria-label="AI 上下文"><div className="panel-heading ai-panel-heading"><div><Sparkles size={15} /><strong>AI 论文助手</strong></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="收起 AI 上下文"><X size={16} /></button></div><div className="ai-panel-scroll ai-copilot"><header className="ai-copilot-context"><div><span>当前项目 · {workspace}</span><strong>{activeProject?.title ?? "未打开项目"}</strong></div><span className={provider ? "ai-provider-ready" : "ai-provider-idle"}><ShieldCheck size={13} />{provider ? provider.name : "本地模式"}</span></header><p className="ai-copilot-purpose">{purposes[location.pathname] ?? "只读取当前项目的真实文件、要求和任务，不使用示例数据。"}</p><section className="ai-copilot-actions" aria-label="当前页面快捷操作">{copilotActions(location.pathname).map((action) => <button key={action.label} onClick={() => action.destination ? navigate(action.destination) : void run(action.intent, action.label)}>{action.label}<ChevronRight size={13} /></button>)}</section><section className="ai-copilot-result" aria-live="polite"><strong>{result ? "Copilot 结果" : "当前可执行检查"}</strong><p>{visibleResult.summary}</p>{visibleResult.criticalIssues.length > 0 && <ResultGroup title="严重问题" items={visibleResult.criticalIssues} tone="critical" />}{visibleResult.pendingItems.length > 0 && <ResultGroup title="待处理项" items={visibleResult.pendingItems} />}{visibleResult.suggestions.length > 0 && <ResultGroup title="建议" items={visibleResult.suggestions} />}{visibleResult.sources.length > 0 && <ResultGroup title="来源" items={visibleResult.sources} tone="source" />}{visibleResult.actions.map((action) => <button className="ai-copilot-link" key={action.label} onClick={() => navigate(action.destination)}>{action.label}<ChevronRight size={13} /></button>)}</section><section className="ai-copilot-compose"><label><span>询问当前论文，或输入 / 调用工具</span><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="/检查、/总结、/修改、/依据、/引用、/逻辑、/下一步" /></label><div><button onClick={() => setShowContext((value) => !value)}><Eye size={14} />上下文</button><button className="ai-local-check" onClick={() => void run("check")}>快速检查</button><button className="ai-primary-action" disabled={loading} onClick={() => void run()}>{loading ? "处理中…" : provider ? "发送" : "快速检查"}<Send size={14} /></button></div></section>{showContext && <section className="ai-copilot-context-preview"><strong>本次上下文</strong><p>当前项目、页面、已导入文件名称与分类、已确认要求、未完成任务。不会发送其他项目、API Key 或未选择的整份正文。</p></section>}</div></aside>;
}

function ResultGroup({ title, items, tone = "" }: { title: string; items: string[]; tone?: "critical" | "source" | "" }) { return <div className={`ai-copilot-group ${tone}`}><b>{title}</b>{items.map((item) => <span key={item}>{item}</span>)}</div>; }
