import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, CircleCheck, CircleDashed, Clock3, Eye, FileCheck2, FileText, FlaskConical, LockKeyhole, Pencil, Send, Sparkles } from "lucide-react";
import "./proposal-design.css";

type CardInfo = { title: string; body: string; meta: string; state: "已完成" | "待补充" | "待核验" };
const proposalCards: CardInfo[] = [
  { title: "研究背景与意义", body: "数字经济正深刻重塑企业资源配置方式，探究其对企业创新的影响有助于理解新质生产力的形成机制。", meta: "已整理政策背景与现实意义", state: "已完成" },
  { title: "文献综述", body: "现有研究主要从数字技术应用、融资约束缓解与组织变革三个维度讨论企业创新的驱动因素。", meta: "已关联 28 篇核心文献", state: "已完成" },
  { title: "研究问题", body: "数字化转型是否显著提升企业创新绩效？资源配置效率是否构成其中的传导机制？", meta: "已形成 2 个核心问题", state: "已完成" },
  { title: "研究假设", body: "H1：数字化转型显著促进企业创新绩效；H2：资源配置效率在二者关系中发挥中介作用。", meta: "待补充理论推导", state: "待补充" },
  { title: "数据来源与样本", body: "选取 2010—2023 年沪深 A 股制造业上市公司为样本，数据来自 CSMAR、CNRDS 与企业年报。", meta: "样本筛选规则待确认", state: "待核验" },
  { title: "研究方法", body: "采用双向固定效应模型检验基准关系，并通过中介效应、异质性和稳健性检验识别作用机制。", meta: "方法路径已明确", state: "已完成" },
  { title: "技术路线", body: "问题提出 → 理论分析 → 研究设计 → 实证检验 → 结论与建议。", meta: "已生成技术路线图", state: "已完成" },
  { title: "进度计划", body: "4 月完成数据清洗与模型设定；5 月完成实证分析；6 月完成论文撰写与修改。", meta: "导师审核节点待补充", state: "待补充" },
];
const designCards: CardInfo[] = [
  { title: "研究问题", body: "识别数字化转型对企业创新绩效的总体效应，并解释其资源配置传导路径。", meta: "问题清晰度：良好", state: "已完成" },
  { title: "理论基础", body: "资源基础观、动态能力理论与信息不对称理论共同构成解释框架。", meta: "已关联 12 篇理论文献", state: "已完成" },
  { title: "假设", body: "H1：数字化转型促进企业创新；H2：资源配置效率发挥中介作用；H3：该效应存在所有制异质性。", meta: "H3 待补充机制说明", state: "待补充" },
  { title: "变量定义", body: "因变量为企业创新绩效（IP）；核心自变量为数字化转型水平（DT）；控制变量包括 SIZE、AGE、LEV 等。", meta: "DT 指标口径待核验", state: "待核验" },
  { title: "数据来源", body: "财务数据来自 CSMAR，数字化转型文本指标来自企业年报与 CNRDS 数据库。", meta: "数据可得性：中等", state: "已完成" },
  { title: "样本", body: "2010—2023 年沪深 A 股制造业上市公司，剔除 ST、金融类及关键变量缺失的观测值。", meta: "筛选口径待确认", state: "待补充" },
  { title: "模型公式", body: "IPᵢₜ = β₀ + β₁DTᵢₜ + β₂Controlsᵢₜ + μᵢ + λₜ + εᵢₜ", meta: "双向固定效应模型", state: "已完成" },
  { title: "稳健性方案", body: "替换被解释变量、滞后核心解释变量，并进行样本缩尾处理。", meta: "待补充安慰剂检验", state: "待补充" },
  { title: "异质性方案", body: "按产权性质、区域市场化程度与行业技术密集度进行分组回归。", meta: "分组阈值已定义", state: "已完成" },
  { title: "内生性方案", body: "采用工具变量与倾向得分匹配缓解双向因果和遗漏变量偏误。", meta: "工具变量可得性待核验", state: "待核验" },
  { title: "技术路线", body: "理论构建 → 变量设计 → 样本处理 → 模型估计 → 扩展检验 → 结论解释。", meta: "路线完整度：92%", state: "已完成" },
];
const gateItems = ["核心研究问题清晰", "文献综述完成", "数据来源已确认", "变量定义已核验", "进度计划可执行"];
const statusTone = { "已完成": "green", "待补充": "amber", "待核验": "red" } as const;
function Status({ value }: { value: CardInfo["state"] }) { return <span className={`proposal-status ${statusTone[value]}`}>{value}</span>; }

export function ProposalDesignPage({ mode }: { mode: "proposal" | "design" }) {
  const isProposal = mode === "proposal"; const [editing, setEditing] = useState<string | null>(null); const [gates, setGates] = useState([true, true, true, false, false]); const [applied, setApplied] = useState(false); const cards = isProposal ? proposalCards : designCards; const ready = gates.every(Boolean);
  return <section className="proposal-workspace"><header className="proposal-hero"><div><p>{isProposal ? "开题阶段 / 开题报告" : "开题阶段 / 研究设计"}</p><h1>数字经济对企业创新的影响研究</h1><div className="proposal-meta"><span className="status-chip">{ready ? "可提交" : "待完善"}</span><span>版本 V1.3</span><span><CheckCircle2 size={13} />已自动保存</span><span>实证研究</span></div></div><div className="proposal-actions">{isProposal && <button className="proposal-secondary"><Eye size={15} />预览开题报告</button>}<button className="proposal-primary" disabled={!ready} title={ready ? "提交审核" : "请先完成 Stage Gate 中的未满足条件"}><Send size={15} />{isProposal ? "提交审核" : "确认研究设计"}</button></div></header>{isProposal && <nav className="proposal-stepper">{["选题背景", "文献综述", "研究设计", "进度计划", "导师审核"].map((step, index) => <div className={index < 3 ? "done" : index === 3 ? "active" : ""} key={step}><span>{index < 3 ? <CheckCircle2 size={14} /> : index + 1}</span><b>{step}</b>{index < 4 && <i />}</div>)}</nav>}<div className="proposal-layout"><main><div className="content-heading"><div><h2>{isProposal ? "开题报告内容" : "研究设计模块"}</h2><span>以内容卡组织，点击编辑可继续完善</span></div><button className="proposal-secondary"><Sparkles size={14} />AI 补全建议</button></div><div className="proposal-cards">{cards.map((card, index) => <article className={editing === card.title ? "editing" : ""} key={card.title}><header><div><span>{String(index + 1).padStart(2, "0")}</span><h3>{card.title}</h3></div><div><Status value={card.state} /><button onClick={() => setEditing(editing === card.title ? null : card.title)}>{editing === card.title ? "完成" : <><Pencil size={13} />编辑</>}</button></div></header><p>{card.body}</p><footer><FileText size={13} />{card.meta}{editing === card.title && <em>编辑入口已打开（UI 占位）</em>}</footer></article>)}</div></main><aside className="proposal-aside"><header><div>{isProposal ? <FileCheck2 size={16} /> : <FlaskConical size={16} />}<b>{isProposal ? "导师审核" : "AI Reviewer"}</b></div><span>{ready ? "通过" : "待完善"}</span></header>{isProposal ? <><section className="gate-card"><h3>通过条件</h3>{gateItems.map((item, index) => <button className={gates[index] ? "met" : "missing"} onClick={() => setGates(items => items.map((value, itemIndex) => itemIndex === index ? !value : value))} key={item}>{gates[index] ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}<span>{item}</span><b>{gates[index] ? "已满足" : "未满足"}</b></button>)}</section><section className="risk-card"><h3>风险提示</h3><p><AlertTriangle size={14} />变量定义尚未核验，核心解释变量的口径需与数据表保持一致。</p><p><Clock3 size={14} />进度计划缺少导师审核节点，提交前请补全。</p></section><section className="advisor-card"><h3>导师意见</h3><p>请优先完善变量口径与样本筛选规则，再提交审核。</p></section></> : <><section className="reviewer-card"><h3>设计评审</h3>{[["可行性", "良好", "green"], ["数据可得性", "中等", "amber"], ["模型复杂度", "适中", "blue"], ["变量可测量性", "需核验", "red"]].map(([label, value, tone]) => <p key={label}><span>{label}</span><b className={tone}>{value}</b></p>)}</section><section className="risk-card"><h3>主要风险</h3><p><AlertTriangle size={14} />DT 指标与工具变量的可获得性尚需数据层面的最终确认。</p></section></>}<section className="ai-advice"><h3>AI 建议</h3><p>建议补充数字基础设施影响资源配置效率的机制文献，并将变量定义与模型公式逐一对应。</p><button onClick={() => setApplied(true)}>{applied ? <><CheckCircle2 size={14} />已应用建议</> : <><Sparkles size={14} />应用到文档</>}</button></section>{!ready && <div className="gate-warning"><LockKeyhole size={15} /><span>Stage Gate 尚有 {gates.filter(value => !value).length} 项未满足，提交已禁用。</span></div>}</aside></div></section>;
}
