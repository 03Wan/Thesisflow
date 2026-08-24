import { ChevronRight, Lightbulb, Sparkles, X, Send, Square, Eye, RotateCcw, Trash2, MapPin } from "lucide-react";
import { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/project-store";
import { fakeReadonlyAdvisor } from "@/ai/readonlyAdvisor";

export function AIContextPanel() {
  const setOpen = useWorkspaceStore((state) => state.setAiPanelOpen);
  const navigate = useNavigate();
  const destinations: Record<string, string> = { "待处理问题 (12)": "/revisions", "指导反馈 (2)": "/guidance", "引用核验": "/advisor-review" };
  const [state, setState] = useState<"idle" | "preparing" | "queued" | "streaming" | "completed" | "error" | "cancelled">("idle");
  const [preview, setPreview] = useState(false);
  const activeProject = useProjectStore((store) => store.projects.find((project) => project.id === store.activeProjectId));
  const [advisorText, setAdvisorText] = useState<string | null>(null);
  const evaluate = () => {
    if (!activeProject) { setState("error"); setAdvisorText(null); return; }
    setState("preparing");
    window.setTimeout(() => setState("queued"), 100);
    window.setTimeout(() => setState("streaming"), 220);
    window.setTimeout(() => { setState("completed"); setAdvisorText(fakeReadonlyAdvisor(activeProject).summary); }, 380);
  };
  const clear = () => { setAdvisorText(null); setPreview(false); setState("idle"); };
  return <aside className="ai-panel" aria-label="AI 上下文">
    <div className="panel-heading"><div><Sparkles size={15} /><strong>AI 上下文</strong></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="收起 AI 上下文"><X size={16} /></button></div>
    <div className="ai-panel-scroll"><p className="eyebrow">只读 AI 论文导师 · {state}</p><h3>正文写作</h3><div className="ai-summary"><Lightbulb size={16} /><div><strong>评估当前项目状态</strong><p>仅使用已确认规则、当前阶段与用户选择的来源；不会修改论文、规则或工作流。</p></div></div><div className="ai-summary"><button className="ai-row" disabled={state === "preparing" || state === "queued" || state === "streaming"} onClick={evaluate}><Send size={14}/>发送评估请求</button><button className="ai-row" disabled={state !== "preparing" && state !== "queued" && state !== "streaming"} onClick={() => setState("cancelled")}><Square size={14}/>停止</button><button className="ai-row" disabled={state !== "error" && state !== "cancelled" && state !== "completed"} onClick={evaluate}><RotateCcw size={14}/>重试</button><button className="ai-row" onClick={() => setPreview(!preview)}><Eye size={14}/>查看本次上下文</button><button className="ai-row" onClick={clear}><Trash2 size={14}/>清空当前对话</button></div>{state === "error" && <div className="ai-summary"><strong>尚未就绪</strong><p>请先在“设置 → AI 设置”保存密钥并完成连接测试。当前不会把请求发送到未知 Provider。</p><button className="settings-text-button" onClick={() => navigate("/settings")}>前往 AI 设置</button></div>}{state === "cancelled" && <div className="ai-summary"><strong>已停止</strong><p>已停止当前 UI 会话；迟到的流式内容不会写入此面板。</p></div>}{advisorText && <div className="ai-summary"><strong>导师建议（开发 FakeProvider）</strong><p>{advisorText}</p><p>真实 Provider 连接未验收；不会将此结果写入项目事实或规则。</p><button className="settings-text-button" onClick={() => setAdvisorText("当前建议没有可核实的 Phase 3 source_ref；因此不能打开来源。")}><MapPin size={13}/>查看来源</button></div>}{preview && <div className="ai-summary"><strong>Context Preview</strong><p>将发送：当前项目 ID、标题/基础元数据、当前阶段、已确认规则、逾期或阻塞任务、指导记录数量，以及用户显式选择的少量来源。</p><p>不会发送：API Key、其他项目、整份文件、所有文献或未选择的大段正文。</p><p>来源仅限 ContextPack 已提供的 source id；无来源的结论会明确标为无法核实。</p></div>}
      {Object.keys(destinations).map((item) => <button className="ai-row" key={item} onClick={() => navigate(destinations[item])}><span>{item}</span><ChevronRight size={15} /></button>)}
    </div>
  </aside>;
}
