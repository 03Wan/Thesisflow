import { ChevronRight, Lightbulb, Sparkles, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavigate } from "react-router-dom";

export function AIContextPanel() {
  const setOpen = useWorkspaceStore((state) => state.setAiPanelOpen);
  const navigate = useNavigate();
  const destinations: Record<string, string> = { "待处理问题 (12)": "/revisions", "指导反馈 (2)": "/guidance", "引用核验": "/advisor-review" };
  return <aside className="ai-panel" aria-label="AI 上下文">
    <div className="panel-heading"><div><Sparkles size={15} /><strong>AI 上下文</strong></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="收起 AI 上下文"><X size={16} /></button></div>
    <div className="ai-panel-scroll"><p className="eyebrow">当前阶段</p><h3>正文写作</h3><div className="ai-summary"><Lightbulb size={16} /><div><strong>本章写作建议</strong><p>优先补充模型构建与变量定义间的逻辑衔接。</p></div></div>
      {Object.keys(destinations).map((item) => <button className="ai-row" key={item} onClick={() => navigate(destinations[item])}><span>{item}</span><ChevronRight size={15} /></button>)}
    </div>
  </aside>;
}
