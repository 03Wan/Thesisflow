import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  FlaskConical,
  LockKeyhole,
  Pencil,
  Send,
  Sparkles,
} from "lucide-react";
import "./proposal-design.css";
import "./proposal-enhancements.css";
import { askConfiguredProvider, getActiveBrowserProvider } from "@/ai/providerClient";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import { useProjectStore } from "@/stores/project-store";

type CardInfo = {
  title: string;
  body: string;
  meta: string;
  state: "已完成" | "待补充" | "待核验";
};
type AiSuggestion = { title: string; body: string };
const proposalCards: CardInfo[] = [
  { title: "学生与课题信息", body: "核对论文题目、学生姓名、学院、专业、班级、学号、指导教师和填报日期。", meta: "与任务书信息保持一致", state: "已完成" },
  { title: "文献综述（不少于1000字）", body: "现有研究主要从数字技术应用、融资约束缓解与组织变革三个维度讨论企业创新的驱动因素。", meta: "正式要求：不少于 10 篇参考文献（不含辞典、手册）", state: "已完成" },
  { title: "本课题研究内容", body: "说明本课题具体研究对象、研究边界、核心内容及各部分之间的关系。", meta: "对应正式表单第 2 栏", state: "已完成" },
  { title: "拟解决的问题", body: "列明论文需要回答的核心问题、关键难点和预期解决边界，避免把结论当作既定事实。", meta: "需与题目、任务书一致", state: "待补充" },
  { title: "拟采用的研究手段（途径）", body: "填写资料获取、调研或数据处理、研究方法、分析步骤及可行性说明。", meta: "不得虚构尚未取得的数据或结果", state: "待核验" },
  { title: "课题研究进度安排", body: "按“起讫日期：工作内容”填写，并与任务书计划及后续指导记录时间保持对应。", meta: "2026 届开题报告截止 2026-01-07", state: "已完成" },
  { title: "格式与日期", body: "文献综述使用宋体小四、1.5 倍行距；日期按国标使用阿拉伯数字。", meta: "来自开题报告填写要求", state: "已完成" },
  { title: "导师与专业审核", body: "学生完成并提交后，由指导教师填写评语和是否同意开题意见，再由所在专业审核。", meta: "学生不可代填教师意见", state: "待补充" },
];
const designCards: CardInfo[] = [
  {
    title: "研究问题",
    body: "识别数字化转型对企业创新绩效的总体效应，并解释其资源配置传导路径。",
    meta: "问题清晰度：良好",
    state: "已完成",
  },
  {
    title: "理论基础",
    body: "资源基础观、动态能力理论与信息不对称理论共同构成解释框架。",
    meta: "已关联 12 篇理论文献",
    state: "已完成",
  },
  {
    title: "假设",
    body: "H1：数字化转型促进企业创新；H2：资源配置效率发挥中介作用；H3：该效应存在所有制异质性。",
    meta: "H3 待补充机制说明",
    state: "待补充",
  },
  {
    title: "变量定义",
    body: "因变量为企业创新绩效（IP）；核心自变量为数字化转型水平（DT）；控制变量包括 SIZE、AGE、LEV 等。",
    meta: "DT 指标口径待核验",
    state: "待核验",
  },
  {
    title: "数据来源",
    body: "财务数据来自 CSMAR，数字化转型文本指标来自企业年报与 CNRDS 数据库。",
    meta: "数据可得性：中等",
    state: "已完成",
  },
  {
    title: "样本",
    body: "2010—2023 年沪深 A 股制造业上市公司，剔除 ST、金融类及关键变量缺失的观测值。",
    meta: "筛选口径待确认",
    state: "待补充",
  },
  {
    title: "模型公式",
    body: "IPᵢₜ = β₀ + β₁DTᵢₜ + β₂Controlsᵢₜ + μᵢ + λₜ + εᵢₜ",
    meta: "双向固定效应模型",
    state: "已完成",
  },
  {
    title: "稳健性方案",
    body: "替换被解释变量、滞后核心解释变量，并进行样本缩尾处理。",
    meta: "待补充安慰剂检验",
    state: "待补充",
  },
  {
    title: "异质性方案",
    body: "按产权性质、区域市场化程度与行业技术密集度进行分组回归。",
    meta: "分组阈值已定义",
    state: "已完成",
  },
  {
    title: "内生性方案",
    body: "采用工具变量与倾向得分匹配缓解双向因果和遗漏变量偏误。",
    meta: "工具变量可得性待核验",
    state: "待核验",
  },
  {
    title: "技术路线",
    body: "理论构建 → 变量设计 → 样本处理 → 模型估计 → 扩展检验 → 结论解释。",
    meta: "路线完整度：92%",
    state: "已完成",
  },
];
const gateItems = [
  "学生与课题信息一致",
  "文献综述不少于1000字且参考文献不少于10篇",
  "研究内容、问题和手段已填写",
  "进度计划与任务书对应",
  "已提交指导教师审核",
];
const statusTone = { 已完成: "green", 待补充: "amber", 待核验: "red" } as const;
function Status({ value }: { value: CardInfo["state"] }) {
  return (
    <span className={`proposal-status ${statusTone[value]}`}>{value}</span>
  );
}

export function ProposalDesignPage({ mode }: { mode: "proposal" | "design" }) {
  const isProposal = mode === "proposal";
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const [editing, setEditing] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [preview, setPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const storageKey = `thesisflow:${activeProject?.id ?? "no-project"}:${mode}:cards`;
  const [cards, setCards] = useState<CardInfo[]>([]);
  useEffect(() => {
    if (!activeProject) { setCards([]); return; }
    const templates = isProposal ? proposalCards : designCards;
    const fallback: CardInfo[] = templates.map((card, index) => ({
      ...card,
      body: isProposal && index === 0
        ? `论文题目：${activeProject.title}；学生：${activeProject.studentName || "待填写"}；学院：${activeProject.college || "待填写"}；专业：${activeProject.major || "待填写"}；学号：${activeProject.studentNumber || "待填写"}；指导教师：${activeProject.advisorName || "待填写"}。`
        : "待填写",
      state: isProposal && index === 0 && activeProject.studentName ? "已完成" : "待补充",
    }));
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) { setCards(fallback); return; }
      const parsed = JSON.parse(saved) as CardInfo[];
      // Migrate older or cross-page demo schemas without discarding edits on matching fields.
      setCards(fallback.map((official) => parsed.some((card) => card.title === official.title) ? { ...official, ...parsed.find((card) => card.title === official.title)! } : official));
    } catch { setCards(fallback); }
  }, [activeProject, isProposal, storageKey]);
  const [draftBody, setDraftBody] = useState("");
  const [draftState, setDraftState] = useState<CardInfo["state"]>("待补充");
  const startEditing = (card: CardInfo) => { setEditing(card.title); setDraftBody(card.body); setDraftState(card.state); };
  const saveEditing = (title: string) => {
    const body = draftBody.trim(); if (!body) return;
    const next = cards.map((card) => card.title === title ? { ...card, body, state: draftState, meta: `最近保存：${new Date().toLocaleString()}` } : card);
    setCards(next); localStorage.setItem(storageKey, JSON.stringify(next)); setEditing(null);
  };
  const generateSuggestions = async () => {
    const provider = getActiveBrowserProvider();
    if (!provider) {
      setAiError("请先在设置 → AI 设置中启用模型并填写 API Key。");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    setAiSuggestions([]);
    try {
      const source = cards.filter((card) => card.state !== "已完成");
      const answer = await askConfiguredProvider(provider, `你是本科论文开题报告助手。严格按学生正式表单字段补全：学生与课题信息、文献综述、本课题研究内容、拟解决的问题、拟采用的研究手段（途径）、课题研究进度安排。文献综述不少于1000字且引用不少于10篇参考文献，但不得虚构任何文献；不能代填指导教师评语或专业审核意见；不得虚构数据和实证结果。只返回 JSON 数组，不要使用 Markdown；每项格式为 {"title":"原卡片标题","body":"补全后的完整正文"}。\n论文题目：${activeProject?.title ?? "待填写"}\n待完善内容：${JSON.stringify(source)}`);
      const json = answer.match(/\[[\s\S]*\]/)?.[0];
      if (!json) throw new Error("模型未返回可解析的建议格式");
      const parsed = JSON.parse(json) as AiSuggestion[];
      const valid = parsed.filter((item) => item && cards.some((card) => card.title === item.title) && typeof item.body === "string" && item.body.trim());
      if (!valid.length) throw new Error("模型返回的建议未匹配当前内容卡片");
      setAiSuggestions(valid);
    } catch (error) {
      setAiError(error instanceof Error ? `AI 补全失败：${error.message}` : "AI 补全失败，请检查模型配置。" );
    } finally {
      setAiBusy(false);
    }
  };
  const applySuggestions = () => {
    const next = cards.map((card) => {
      const suggestion = aiSuggestions.find((item) => item.title === card.title);
      return suggestion ? { ...card, body: suggestion.body.trim(), state: "已完成" as const, meta: `AI 建议已应用：${new Date().toLocaleString()}` } : card;
    });
    setCards(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setAiSuggestions([]);
    setApplied(true);
  };
  const proposalSteps = [
    { label: "学生与课题", cardIndexes: [0] },
    { label: "文献综述", cardIndexes: [1] },
    { label: "研究内容", cardIndexes: [2] },
    { label: "问题与手段", cardIndexes: [3, 4] },
    { label: "进度与审核", cardIndexes: [5, 6, 7] },
  ].map((step) => {
    const related = step.cardIndexes.map((index) => cards[index]).filter(Boolean);
    const state = related.length > 0 && related.every((card) => card.state === "已完成") ? "done" : related.some((card) => card.state !== "待补充") ? "active" : "pending";
    return { ...step, state };
  });
  const gates = isProposal ? proposalSteps.map((step) => step.state === "done") : [cards.length > 0 && cards.every((card) => card.state === "已完成")];
  const ready = gates.every(Boolean);
  if (!activeProject) return <ProjectRequiredState title={`打开项目后编辑${isProposal ? "开题报告" : "研究设计"}`} description="内容、状态、步骤和完成度都将按当前项目实时保存与计算，不再展示演示数据。" />;
  return (
    <section className="proposal-workspace">
      <header className="proposal-hero">
        <div>
          <p>{isProposal ? "开题阶段 / 开题报告" : "开题阶段 / 研究设计"}</p>
          <h1>{activeProject.title}</h1>
          <div className="proposal-meta">
            <span className="status-chip">
              {submitted ? "已完成自检" : ready ? "可确认" : "待完善"}
            </span>
            <span>当前项目草稿</span>
            <span>
              <CheckCircle2 size={13} />
              已自动保存
            </span>
            <span>实证研究</span>
          </div>
        </div>
        <div className="proposal-actions">
          {isProposal && (
            <button
              className="proposal-secondary"
              onClick={() => setPreview(!preview)}
            >
              <Eye size={15} />
              {preview ? "关闭预览" : "预览开题报告"}
            </button>
          )}
          <button
            className="proposal-primary"
            onClick={() => setSubmitted(true)}
            disabled={!ready || submitted}
            title={ready ? "完成内容自检" : "请先完成自检清单中的未满足条件"}
          >
            <Send size={15} />
            {submitted
              ? "已完成自检"
              : isProposal
                ? "完成开题自检"
                : "确认研究设计"}
          </button>
        </div>
      </header>
      {preview && (
        <section className="proposal-preview">
          <header>
            <b>开题报告预览</b>
            <span>当前项目 · 本地草稿</span>
          </header>
          {cards.slice(0, 4).map((card) => (
            <p key={card.title}>
              <b>{card.title}</b>
              <span>{card.body}</span>
            </p>
          ))}
        </section>
      )}
      {isProposal && (
        <nav className="proposal-stepper">
          {proposalSteps.map(
            (step, index) => (
              <div
                className={step.state === "pending" ? "" : step.state}
                key={step.label}
              >
                <span>
                  {step.state === "done" ? <CheckCircle2 size={14} /> : index + 1}
                </span>
                <b>{step.label}</b>
                {index < 4 && <i />}
              </div>
            ),
          )}
        </nav>
      )}
      <div className="proposal-layout">
        <main>
          <div className="content-heading">
            <div>
              <h2>{isProposal ? "开题报告内容" : "研究设计模块"}</h2>
              <span>以内容卡组织，点击编辑可继续完善</span>
            </div>
            <button
              className="proposal-secondary"
              onClick={() => void generateSuggestions()}
              disabled={aiBusy}
            >
              <Sparkles size={14} />
              {aiBusy ? "正在生成…" : applied ? "重新生成建议" : "AI 补全建议"}
            </button>
          </div>
          {(aiBusy || aiError || aiSuggestions.length > 0) && (
            <section className="proposal-ai-feedback" aria-live="polite">
              {aiBusy && <p>正在调用已配置的 AI 模型分析待完善内容…</p>}
              {aiError && <p className="error">{aiError}</p>}
              {aiSuggestions.length > 0 && (
                <>
                  <header><b>AI 补全建议</b><span>{aiSuggestions.length} 项，可确认后写入本地草稿</span></header>
                  {aiSuggestions.map((item) => <article key={item.title}><b>{item.title}</b><p>{item.body}</p></article>)}
                  <footer><button onClick={() => setAiSuggestions([])}>取消</button><button className="proposal-primary" onClick={applySuggestions}>应用到内容卡片</button></footer>
                </>
              )}
            </section>
          )}
          <div className="proposal-cards">
            {cards.map((card, index) => (
              <article
                key={card.title}
              >
                <header>
                  <div>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <div>
                    <Status value={card.state} />
                    <button
                      onClick={() => startEditing(card)}
                    >
                      <Pencil size={13} />
                      编辑
                    </button>
                  </div>
                </header>
                <p>{card.body}</p>
                <footer>
                  <FileText size={13} />
                  {card.meta}
                </footer>
              </article>
            ))}
          </div>
        </main>
        <aside className="proposal-aside">
          <header>
            <div>
              {isProposal ? (
                <FileCheck2 size={16} />
              ) : (
                <FlaskConical size={16} />
              )}
              <b>{isProposal ? "内容自检" : "设计检查"}</b>
            </div>
            <span>{submitted ? "已完成" : ready ? "可完成" : "待完善"}</span>
          </header>
          {isProposal ? (
            <>
              <section className="gate-card">
                <h3>自检清单</h3>
                {gateItems.map((item, index) => (
                  <button
                    className={gates[index] ? "met" : "missing"}
                    aria-disabled="true"
                    key={item}
                  >
                    {gates[index] ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <CircleDashed size={15} />
                    )}
                    <span>{item}</span>
                    <b>{gates[index] ? "已满足" : "未满足"}</b>
                  </button>
                ))}
              </section>
            </>
          ) : (
            <section className="reviewer-card">
              <h3>设计评审</h3>
              {[
                ["可行性", "良好", "green"],
                ["数据可得性", "中等", "amber"],
                ["模型复杂度", "适中", "blue"],
                ["变量可测量性", "需核验", "red"],
              ].map(([label, value, tone]) => (
                <p key={label}>
                  <span>{label}</span>
                  <b className={tone}>{value}</b>
                </p>
              ))}
            </section>
          )}
          <section className="ai-advice">
            <h3>AI 建议</h3>
            <p>
              建议补充数字基础设施影响资源配置效率的机制文献，并将变量定义与模型公式逐一对应。
            </p>
            <button onClick={() => setApplied(true)}>
              {applied ? (
                <>
                  <CheckCircle2 size={14} />
                  已应用建议
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  应用到文档
                </>
              )}
            </button>
          </section>
          {!ready && (
            <div className="gate-warning">
              <LockKeyhole size={15} />
              <span>
                自检清单尚有 {gates.filter((value) => !value).length}{" "}
                项未满足，完成按钮暂不可用。
              </span>
            </div>
          )}
        </aside>
      </div>
      {editing && (
        <div className="proposal-edit-backdrop" onMouseDown={() => setEditing(null)}>
          <section className="proposal-edit-dialog" role="dialog" aria-modal="true" aria-label={`编辑${editing}`} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>{isProposal ? "开题报告内容编辑" : "研究设计模块编辑"}</span><h2>{editing}</h2></div><button onClick={() => setEditing(null)}>关闭</button></header>
            <div className="proposal-edit-fields">
              <label><span>内容</span><textarea aria-label={`编辑${editing}`} value={draftBody} onChange={(event) => setDraftBody(event.target.value)} autoFocus /></label>
              <label><span>状态</span><select aria-label={`${editing}状态`} value={draftState} onChange={(event) => setDraftState(event.target.value as CardInfo["state"])}><option value="已完成">已完成</option><option value="待补充">待补充</option><option value="待核验">待核验</option></select></label>
            </div>
            <footer><button onClick={() => setEditing(null)}>取消</button><button className="proposal-primary" disabled={!draftBody.trim()} onClick={() => saveEditing(editing)}>保存修改</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
