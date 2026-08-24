import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Plus, Save, Send, Sparkles } from "lucide-react";
import { mockAdvisorComments, mockIssues, mockRules, stageGates, stageStates, type StageState } from "@/data/mock/workflow";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { FilesPage } from "@/features/files/FilesPage";
import "./foundation.css";

type Kind = "requirements" | "topic" | "task" | "translation" | "midterm" | "reviewer" | "files" | "calendar" | "settings";
type Card = { label: string; value: string; state: StageState };

const config: Record<Kind, { title: string; eyebrow: string; state: StageState; description: string }> = {
  requirements: { title: "论文要求", eyebrow: "准备阶段 / 学院规范", state: "active", description: "集中核对篇幅、文献、格式与提交要求。" },
  topic: { title: "选题", eyebrow: "准备阶段 / 研究方向", state: "completed", description: "记录选题依据、研究边界与导师确认。" },
  task: { title: "任务书", eyebrow: "准备阶段 / 培养任务", state: "completed", description: "任务目标、研究内容、时间节点与责任确认。" },
  translation: { title: "外文翻译", eyebrow: "写作阶段 / 翻译材料", state: "overdue", description: "外文原文、翻译稿与术语核对工作区。" },
  midterm: { title: "中期检查", eyebrow: "写作阶段 / 阶段检查", state: "completed", description: "检查研究进度、阶段成果和待改进问题。" },
  reviewer: { title: "评阅教师评阅", eyebrow: "定稿阶段 / 预演记录", state: "pending", description: "模拟评阅记录，正式结论以学院通知为准。" },
  files: { title: "文件中心", eyebrow: "完成阶段 / 文件管理", state: "active", description: "统一查看项目文件与版本来源。" },
  calendar: { title: "节点日历", eyebrow: "项目管理 / 时间节点", state: "active", description: "展示论文流程的重要日期与提醒。" },
  settings: { title: "设置", eyebrow: "工作台 / 偏好设置", state: "active", description: "本地界面与通知偏好 Mock 设置。" },
};

function Badge({ state }: { state: StageState }) { const item = stageStates[state]; return <span className={`foundation-badge ${item.tone}`}>{item.label}</span>; }

export function FoundationPage({ kind }: { kind: Kind }) {
  if (kind === "settings") return <SettingsPage />;
  if (kind === "files") return <FilesPage />;
  const item = config[kind];
  const [selected, setSelected] = useState<Card | null>(null);
  const [saved, setSaved] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const gate = kind === "translation" ? stageGates.implementation : undefined;
  const cards: Card[] = kind === "requirements" ? mockRules : kind === "calendar" ? [] : mockAdvisorComments.map((comment) => ({ label: `${comment.author} ${comment.id}`, value: comment.content, state: comment.state }));

  return <section className="foundation-page">
    <header><div><p>{item.eyebrow}</p><h1>{item.title}</h1><span>暂无项目数据</span></div><div><Badge state={item.state} /><button onClick={() => setSaved(true)}><Save size={14} />{saved ? "已保存" : "保存"}</button><button className="primary" disabled={Boolean(gate)} onClick={() => setSaved(true)}><Send size={14} />提交/确认</button></div></header>
    {gate && <div className="foundation-gate"><AlertTriangle size={15} /><span>{gate.reason}，当前页面仅可查看与完善材料。</span></div>}
    <p className="foundation-description">{item.description}</p>
    <div className="foundation-grid">{cards.length === 0 ? <p>暂无数据</p> : cards.map((card) => <article key={card.label}><header><FileText size={16} /><b>{card.label}</b><Badge state={card.state} /></header><p>{card.value}</p><button onClick={() => setSelected(card)}>查看详情 <Plus size={13} /></button></article>)}</div>
    {selected && <section className="foundation-detail"><header><div><p>当前详情</p><h2>{selected.label}</h2></div><button onClick={() => setSelected(null)}>关闭</button></header><div className="foundation-detail-body"><FileText size={18} /><div><b>{kind === "calendar" ? "节点说明与关联工作" : "导师意见与处理记录"}</b><p>{selected.value}</p>{kind !== "calendar" && <p className="detail-meta">来源：{selected.label} · 当前状态：{stageStates[selected.state].label}</p>}</div></div>{kind !== "calendar" && <footer><button className="primary" onClick={() => setTaskCreated(true)}><Sparkles size={14} />{taskCreated ? "已创建关联修改任务" : "创建关联修改任务"}</button>{taskCreated && <span><CheckCircle2 size={14} />任务已关联至“修改任务”页面</span>}</footer>}</section>}
    <section className="foundation-work"><header><div><h2>当前工作</h2><span>集中 Mock 数据联动</span></div><button onClick={() => setTaskCreated(true)}><Sparkles size={14} />创建修改任务</button></header>{mockIssues.map((issue) => <p key={issue.id}><CheckCircle2 size={14} /><b>{issue.title}</b><span>{issue.source}</span><Badge state={issue.state} /></p>)}{taskCreated && <div className="foundation-task-result"><CheckCircle2 size={14} />已生成关联任务，可前往“修改任务”继续处理。</div>}</section>
  </section>;
}
