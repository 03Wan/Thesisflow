import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import {
  stageStates,
  type StageState,
} from "@/data/workflow-state";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import { useProjectStore } from "@/stores/project-store";
import { useRequirementStore } from "@/stores/requirement-store";
import { useTaskStore } from "@/stores/task-store";
import { RuleCandidateRepository } from "@/repositories/ruleCandidateRepository";
import { ruleReviewService } from "@/services/ruleReviewService";
import type { RuleCandidate } from "@/types/document";
import type { RequirementStatus, ThesisRequirement } from "@/types/domain";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { FilesPage } from "@/features/files/FilesPage";
import "./foundation.css";
import "./foundation-complete.css";

type Kind =
  | "requirements"
  | "topic"
  | "task"
  | "translation"
  | "midterm"
  | "reviewer"
  | "files"
  | "calendar"
  | "settings";
type Card = { label: string; value: string; state: StageState; requirement?: ThesisRequirement };
type FoundationContent = {
  cards: Card[];
  stats: Array<{ label: string; value: string; detail: string }>;
  workTitle: string;
  workDescription: string;
  workItems: Array<{ title: string; meta: string; state: StageState }>;
};

const config: Record<
  Kind,
  { title: string; eyebrow: string; state: StageState; description: string }
> = {
  requirements: {
    title: "论文要求",
    eyebrow: "准备阶段 / 学院规范",
    state: "active",
    description: "集中核对篇幅、文献、格式与提交要求。",
  },
  topic: {
    title: "选题",
    eyebrow: "准备阶段 / 研究方向",
    state: "completed",
    description: "记录选题依据、研究边界与个人确认。",
  },
  task: {
    title: "任务书接收与执行",
    eyebrow: "准备阶段 / 导师下达",
    state: "completed",
    description: "任务书由指导教师填写，经专业和学院审核后下达；学生在此核对内容、确认接收并按计划执行，不代替教师审批。",
  },
  translation: {
    title: "外文翻译",
    eyebrow: "写作阶段 / 翻译材料",
    state: "overdue",
    description: "按正式表单整理与课题相关的外文原文及译文；适用专业需提交约 1 万印刷符号原文和约 3000 汉字译文。",
  },
  midterm: {
    title: "中期检查",
    eyebrow: "写作阶段 / 阶段检查",
    state: "completed",
    description: "按 2026 届通知核对电子签名、论文信息、导师信息、实际进度与阶段质量，截止 2026-03-18。",
  },
  reviewer: {
    title: "答辩自检",
    eyebrow: "定稿阶段 / 预演记录",
    state: "pending",
    description: "模拟评阅记录，正式结论以学院通知为准。",
  },
  files: {
    title: "文件中心",
    eyebrow: "完成阶段 / 文件管理",
    state: "active",
    description: "统一查看项目文件与版本来源。",
  },
  calendar: {
    title: "节点日历",
    eyebrow: "项目管理 / 时间节点",
    state: "active",
    description: "展示论文流程的重要日期与提醒。",
  },
  settings: {
    title: "设置",
    eyebrow: "工作台 / 偏好设置",
    state: "active",
    description: "管理本地界面、通知与服务偏好。",
  },
};

const contentByKind: Partial<Record<Kind, FoundationContent>> = {
  topic: {
    cards: [
      { label: "论文题目", value: "待填写", state: "pending" },
      { label: "核心研究问题", value: "待填写", state: "pending" },
      { label: "研究边界", value: "待填写", state: "pending" },
      { label: "预期创新点", value: "待填写", state: "pending" },
    ],
    stats: [],
    workTitle: "选题完善清单",
    workDescription: "从问题、范围和可行性三个维度完成个人确认",
    workItems: [
      { title: "核对题目与研究问题的一致性", meta: "个人自检", state: "completed" },
      { title: "补充研究对象与时间范围说明", meta: "范围界定", state: "active" },
      { title: "形成 150 字选题摘要", meta: "待处理", state: "pending" },
    ],
  },
  task: {
    cards: [
      { label: "课题目的", value: "由导师下达：说明本课题应达到的目的，学生核对后执行", state: "completed" },
      { label: "任务内容与要求", value: "包含原始数据、技术要求、工作要求；必须与最终完成情况一致", state: "completed" },
      { label: "成果要求", value: "明确论文、图表、实物或其他成果要求", state: "active" },
      { label: "主要参考文献", value: "按学校规范和导师下达要求填写参考文献，并核对引用格式", state: "pending" },
      { label: "工作进度计划", value: "按“起讫日期：工作内容”逐项核对，与后续指导记录时间对应", state: "active" },
      { label: "审核与下达", value: "专业负责人、学院负责人审核后生效；审核状态和下达日期待填写", state: "pending" },
    ],
    stats: [],
    workTitle: "学生接收确认",
    workDescription: "逐项核对任务书与个人信息，确认后转为个人执行计划",
    workItems: [
      { title: "核对题目、姓名、学院、专业、班级、学号与导师", meta: "学生核对", state: "completed" },
      { title: "确认目的、任务内容、成果要求与参考文献", meta: "学生确认", state: "active" },
      { title: "将进度计划同步为个人阶段待办", meta: "执行计划", state: "pending" },
    ],
  },
  translation: {
    cards: [
      { label: "外文原文", value: "Digital transformation and firm innovation.pdf · 18 页", state: "completed" },
      { label: "翻译稿", value: "已完成 2,460 / 约 3,000 汉字，当前版本 V2.1", state: "active" },
      { label: "术语表", value: "digital transformation 等 36 个术语已统一", state: "active" },
      { label: "格式检查", value: "标题层级、图表编号和参考信息待核对", state: "pending" },
    ],
    stats: [
      { label: "翻译进度", value: "82%", detail: "剩余 540 字" },
      { label: "术语", value: "36 个", detail: "已统一 31 个" },
      { label: "段落", value: "42 段", detail: "已校对 34 段" },
      { label: "当前版本", value: "V2.1", detail: "今天已保存" },
    ],
    workTitle: "翻译校对清单",
    workDescription: "原文、译文和术语逐项对应",
    workItems: [
      { title: "补译研究局限与未来展望", meta: "剩余 3 段", state: "active" },
      { title: "统一企业创新相关术语", meta: "31 / 36", state: "active" },
      { title: "核对原文作者、期刊与 DOI", meta: "待处理", state: "pending" },
    ],
  },
  midterm: {
    cards: [
      { label: "学生电子签名", value: "用于确认本次中期检查填报内容", state: "pending" },
      { label: "论文基本信息", value: "题目、论文类型、关键词、选题来源、研究方向", state: "completed" },
      { label: "导师信息", value: "指导教师姓名及相关信息已核对", state: "completed" },
      { label: "实际进度与计划对照", value: "填写已完成内容、当前阶段、与任务书计划的差异及原因", state: "active" },
      { label: "阶段质量与成果", value: "列明文献、数据、初稿、外文翻译等已形成材料及质量情况", state: "active" },
      { label: "问题与下一步计划", value: "填写当前困难、解决方案和下一阶段具体安排", state: "pending" },
    ],
    stats: [
      { label: "截止日期", value: "2026-03-18", detail: "学校通知" },
      { label: "学生签名", value: "待确认", detail: "必填" },
      { label: "信息字段", value: "8 类", detail: "逐项核对" },
      { label: "阶段材料", value: "按实际关联", detail: "不得虚构" },
    ],
    workTitle: "中期自检事项",
    workDescription: "检查成果、风险和后续计划是否完整",
    workItems: [
      { title: "核对题目、类型、关键词、来源、方向和导师信息", meta: "信息核对", state: "completed" },
      { title: "更新实际进度、质量及与任务书计划差异", meta: "学生填写", state: "active" },
      { title: "完成电子签名并整理中期检查材料", meta: "提交前确认", state: "pending" },
    ],
  },
  calendar: {
    cards: [
      { label: "08 月 28 日", value: "完成变量定义和样本筛选说明", state: "active" },
      { label: "09 月 05 日", value: "完成基准回归与结果表整理", state: "pending" },
      { label: "09 月 18 日", value: "完成稳健性与异质性检验", state: "pending" },
      { label: "10 月 01 日", value: "提交论文初稿并开始个人自检", state: "pending" },
    ],
    stats: [
      { label: "本月节点", value: "4 个", detail: "1 个临近" },
      { label: "已完成", value: "2 个", detail: "按时完成" },
      { label: "待办任务", value: "5 项", detail: "无逾期" },
      { label: "计划跨度", value: "38 天", detail: "至初稿完成" },
    ],
    workTitle: "节点提醒",
    workDescription: "近期节点与关联任务",
    workItems: [
      { title: "变量定义说明", meta: "3 天后", state: "active" },
      { title: "基准回归结果", meta: "11 天后", state: "pending" },
      { title: "论文初稿", meta: "37 天后", state: "pending" },
    ],
  },
};

function Badge({ state }: { state: StageState }) {
  const item = stageStates[state];
  return <span className={`foundation-badge ${item.tone}`}>{item.label}</span>;
}

export function FoundationPage({ kind }: { kind: Kind }) {
  if (kind === "settings") return <SettingsPage />;
  if (kind === "files") return <FilesPage />;
  const item = config[kind];
  const pageContent = contentByKind[kind];
  const [selected, setSelected] = useState<Card | null>(null);
  const [editableCards, setEditableCards] = useState<Card[]>([]);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftState, setDraftState] = useState<StageState>("pending");
  const [requirementDraft, setRequirementDraft] = useState<{currentValue:string;targetValue:string;unit:string;description:string;status:RequirementStatus}|null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selfCheckOpen, setSelfCheckOpen] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const createTask = useTaskStore((state) => state.create);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const projects = useProjectStore((state) => state.projects);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const browserPreview = typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);
  const requirements = useRequirementStore((state) => state.requirements);
  const loadRequirements = useRequirementStore((state) => state.load);
  const updateRequirement = useRequirementStore((state) => state.update);
  const [candidates, setCandidates] = useState<RuleCandidate[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const loadCandidates = () =>
    browserPreview
      ? Promise.resolve((setCandidates([]), setReviewError(null)))
      : activeProjectId
      ? new RuleCandidateRepository()
          .listByProject(activeProjectId)
          .then(setCandidates)
          .catch((error) =>
            setReviewError(
              error instanceof Error ? error.message : "无法读取候选规则。",
            ),
          )
      : undefined;
  useEffect(() => {
    if (kind === "requirements" && activeProjectId)
      void loadRequirements(activeProjectId);
  }, [activeProjectId, kind, loadRequirements]);
  useEffect(() => {
    if (kind === "requirements") void loadCandidates();
  }, [activeProjectId, kind]);
  useEffect(() => {
    const defaults = (pageContent?.cards ?? []).map((card, index) => kind === "topic" ? {
      ...card,
      value: index === 0 ? (activeProject?.title ?? "待填写") : "待填写",
      state: index === 0 && activeProject?.title ? "completed" as StageState : "pending" as StageState,
    } : card);
    const key = `thesisflow:${activeProjectId ?? "browser-preview"}:foundation:${kind}:cards`;
    try {
      const saved = localStorage.getItem(key);
      setEditableCards(saved ? JSON.parse(saved) as Card[] : defaults);
    } catch { setEditableCards(defaults); }
  }, [activeProject?.title, activeProjectId, kind, pageContent]);
  const review = async (
    candidate: RuleCandidate,
    action: "confirm" | "reject",
  ) => {
    try {
      if (action === "confirm") await ruleReviewService.confirm(candidate.id);
      else await ruleReviewService.reject(candidate.id);
      await Promise.all([
        loadRequirements(activeProjectId ?? ""),
        loadCandidates(),
      ]);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "规则操作失败。");
    }
  };
  const cards: Card[] =
    kind === "requirements"
      ? requirements.length
        ? requirements.map((rule) => ({
            label: rule.label,
            value:
              rule.targetValue === null
                ? "待统计 / 未配置目标"
                : `当前：${rule.currentValue}${rule.unit} · 目标：${rule.targetValue}${rule.unit}`,
            state: rule.status === "met" ? "completed" : rule.status === "unmet" ? "overdue" : rule.status === "waived" ? "pending" : "active",
            requirement: rule,
          }))
        : editableCards
      : editableCards;
  const completedCount = cards.filter((card) => card.state === "completed").length;
  const activeCount = cards.filter((card) => card.state === "active").length;
  const pendingCount = cards.filter((card) => card.state !== "completed").length;
  const completionRate = cards.length ? Math.round(completedCount / cards.length * 100) : 0;
  const requirementTarget = (keywords: string[]) => {
    const card = cards.find((entry) => keywords.some((keyword) => entry.label.includes(keyword)));
    if (!card) return "未配置";
    if (card.requirement?.targetValue !== null && card.requirement?.targetValue !== undefined) return `${card.requirement.targetValue.toLocaleString()} ${card.requirement.unit}`;
    const match = card.value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return match ? `${Number(match[0]).toLocaleString()} ${card.value.includes("篇") ? "篇" : card.value.includes("字") ? "字" : ""}`.trim() : "未配置";
  };
  const stats = kind === "requirements" ? [
    { label: "已确认规则", value: String(cards.length), detail: "当前项目实时数据" },
    { label: "篇幅要求", value: requirementTarget(["正文", "篇幅", "字数"]), detail: "来自当前规则" },
    { label: "参考文献", value: requirementTarget(["参考文献"]), detail: "来自当前规则" },
    { label: "待确认项", value: `${candidates.filter((candidate) => candidate.status === "pending").length} 项`, detail: "规则候选实时数据" },
  ] : kind === "topic" || kind === "task" ? [
    { label: "内容项", value: `${cards.length} 项`, detail: "当前项目" },
    { label: "已完成", value: `${completedCount} 项`, detail: "按卡片状态计算" },
    { label: "进行中", value: `${activeCount} 项`, detail: "按卡片状态计算" },
    { label: "完成度", value: `${completionRate}%`, detail: pendingCount ? `剩余 ${pendingCount} 项` : "全部完成" },
  ] : pageContent?.stats ?? [];
  const saveRecord = () => {
    localStorage.setItem(`thesisflow:${kind}:self-check`, JSON.stringify({ savedAt: new Date().toISOString(), cards: cards.map((card) => ({ label: card.label, value: card.value, state: card.state })) }));
    setSaved(true);
  };
  const addRevisionTask = async (title: string) => {
    if (!activeProject) return;
    await createTask({ id: crypto.randomUUID(), projectId: activeProject.id, workflowStageId: null, stageKey: kind, title: `核对：${title}`, description: `从“${item.title}”页面创建，用于跟踪需要补充、核对或修改的内容。`, sourceType: "manual", sourceReferenceId: null, priority: "medium", status: "todo", dueAt: null, completedAt: null, sortOrder: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setTaskCreated(true);
  };
  const editingEnabled = kind === "requirements" || kind === "topic" || kind === "task";
  const openCard = (card: Card) => {
    setSelected(card);
    setDraftLabel(card.label);
    setDraftValue(card.value);
    setDraftState(card.state);
    setEditError(null);
    setRequirementDraft(card.requirement ? {
      currentValue: String(card.requirement.currentValue),
      targetValue: card.requirement.targetValue === null ? "" : String(card.requirement.targetValue),
      unit: card.requirement.unit,
      description: card.requirement.description ?? "",
      status: card.requirement.status,
    } : null);
  };
  const saveCard = async () => {
    if (!selected || !draftLabel.trim()) return;
    setEditBusy(true);
    setEditError(null);
    try {
      if (selected.requirement && requirementDraft) {
        const currentValue = Number(requirementDraft.currentValue);
        const targetValue = requirementDraft.targetValue.trim() ? Number(requirementDraft.targetValue) : null;
        if (!Number.isFinite(currentValue) || (targetValue !== null && !Number.isFinite(targetValue))) throw new Error("当前值和目标值必须是有效数字。");
        await updateRequirement(selected.requirement.id, { label: draftLabel.trim(), currentValue, targetValue, unit: requirementDraft.unit.trim(), description: requirementDraft.description.trim() || null, status: requirementDraft.status });
      } else {
        const next = editableCards.map((card) => card.label === selected.label ? { ...card, label: draftLabel.trim(), value: draftValue.trim(), state: draftState } : card);
        setEditableCards(next);
        localStorage.setItem(`thesisflow:${activeProjectId ?? "browser-preview"}:foundation:${kind}:cards`, JSON.stringify(next));
      }
      setSelected(null);
    } catch (error) { setEditError(error instanceof Error ? error.message : "保存失败，请重试。"); }
    finally { setEditBusy(false); }
  };

  if (!activeProject && (kind === "requirements" || kind === "topic" || kind === "task")) {
    return <ProjectRequiredState title={`打开项目后编辑${item.title}`} description="统计和内容均按当前项目实时计算，不再展示演示数据。" />;
  }

  return (
    <section className="foundation-page">
      <header>
        <div>
          <p>{item.eyebrow}</p>
          <h1>{item.title}</h1>
          <span>{activeProject ? `${activeProject.title} · 学生工作区` : "浏览器预览内容"}</span>
        </div>
        <div>
          <Badge state={item.state} />
          <button onClick={saveRecord} title="将当前页面的规则、清单与状态保存到本地工作台">
            <Save size={14} />
            {saved ? (kind === "task" ? "接收记录已保存" : "自检记录已保存") : (kind === "task" ? "保存接收记录" : "保存自检记录")}
          </button>
          <button
            className="primary"
            onClick={() => { saveRecord(); setSelfCheckOpen(true); }}
          >
            <Send size={14} />
            {kind === "task" ? "核对任务书" : "运行自检"}
          </button>
        </div>
      </header>
      <p className="foundation-description">{item.description}</p>
      {stats.length > 0 && (
        <div className="foundation-stats">
          {stats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.detail}</small>
            </article>
          ))}
        </div>
      )}
      <div className="foundation-grid">
        {cards.length === 0 ? (
          <p>{kind === "requirements" ? "未配置已确认规则" : "暂无数据"}</p>
        ) : (
          cards.map((card) => (
            <article key={card.label}>
              <header>
                <FileText size={16} />
                <b>{card.label}</b>
                <Badge state={card.state} />
              </header>
              <p>{card.value}</p>
              <button onClick={() => openCard(card)}>
                {editingEnabled ? <><Pencil size={13} /> 编辑内容</> : <>查看详情 <Plus size={13} /></>}
              </button>
            </article>
          ))
        )}
      </div>
      {kind === "requirements" && (
        <section className="foundation-work">
          <header>
            <div>
              <h2>待确认规则候选</h2>
              <span>仅确认后才会更新要求或工作流</span>
            </div>
          </header>
          {reviewError && <p>{reviewError}</p>}
          {candidates.filter((candidate) => candidate.status === "pending")
            .length === 0 ? (
            <p>暂无待确认候选。当前规则可继续编辑或从学校文件中提取。</p>
          ) : (
            candidates
              .filter((candidate) => candidate.status === "pending")
              .map((candidate) => (
                <p key={candidate.id}>
                  <FileText size={14} />
                  <b>
                    {candidate.ruleKey}：{JSON.stringify(candidate.value)}
                    {candidate.unit ?? ""}
                  </b>
                  <span>{candidate.rawText}</span>
                  <button
                    className="primary"
                    onClick={() => void review(candidate, "confirm")}
                  >
                    确认
                  </button>
                  <button onClick={() => void review(candidate, "reject")}>
                    拒绝
                  </button>
                </p>
              ))
          )}
        </section>
      )}
      {selected && (
        <div className="foundation-dialog-backdrop" onMouseDown={() => setSelected(null)}>
        <section className="foundation-detail" role="dialog" aria-modal="true" aria-label={`${selected.label}详情`} onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <div>
              <p>{editingEnabled ? "编辑内容与状态" : "当前详情"}</p>
              <h2>{selected.label}</h2>
            </div>
            <button onClick={() => setSelected(null)}>关闭</button>
          </header>
          <div className={`foundation-detail-body ${editingEnabled ? "editing-form" : ""}`}>
            {!editingEnabled && <FileText size={18} />}
            {editingEnabled ? (
              <div className="foundation-edit-fields">
                <label><span>标题</span><input value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} /></label>
                {requirementDraft ? <>
                  <div className="foundation-number-fields">
                    <label><span>当前值</span><input type="number" value={requirementDraft.currentValue} onChange={(event) => setRequirementDraft({...requirementDraft,currentValue:event.target.value})} /></label>
                    <label><span>目标值</span><input type="number" value={requirementDraft.targetValue} onChange={(event) => setRequirementDraft({...requirementDraft,targetValue:event.target.value})} /></label>
                    <label><span>单位</span><input value={requirementDraft.unit} onChange={(event) => setRequirementDraft({...requirementDraft,unit:event.target.value})} /></label>
                  </div>
                  <label><span>规则说明</span><textarea value={requirementDraft.description} onChange={(event) => setRequirementDraft({...requirementDraft,description:event.target.value})} /></label>
                  <label><span>状态</span><select value={requirementDraft.status} onChange={(event) => setRequirementDraft({...requirementDraft,status:event.target.value as RequirementStatus})}><option value="pending">待核对</option><option value="met">已满足</option><option value="unmet">未满足</option><option value="waived">已豁免</option></select></label>
                </> : <>
                  <label><span>内容</span><textarea value={draftValue} onChange={(event) => setDraftValue(event.target.value)} /></label>
                  <label><span>状态</span><select value={draftState} onChange={(event) => setDraftState(event.target.value as StageState)}>{Object.entries(stageStates).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</select></label>
                </>}
                {editError && <p className="foundation-edit-error">{editError}</p>}
              </div>
            ) : <div>
              <b>
                {kind === "calendar"
                  ? "节点说明与关联工作"
                  : "修改建议与处理记录"}
              </b>
              <p>{selected.value}</p>
              {kind !== "calendar" && (
                <p className="detail-meta">
                  来源：{selected.label} · 当前状态：
                  {stageStates[selected.state].label}
                </p>
              )}
            </div>
            }
          </div>
          {editingEnabled ? <footer className="foundation-edit-actions"><button onClick={() => setSelected(null)}>取消</button><button className="primary" disabled={editBusy || !draftLabel.trim()} onClick={() => void saveCard()}><Save size={14}/>{editBusy ? "保存中…" : "保存修改"}</button></footer> : kind !== "calendar" && (
            <footer>
              <button className="primary" onClick={() => void addRevisionTask(selected.label)} title="把当前项目的待处理事项加入“修改任务”列表，供后续跟踪完成状态">
                <Sparkles size={14} />
                {taskCreated ? "已加入修改任务清单" : "加入修改任务清单"}
              </button>
              {taskCreated && (
                <span>
                  <CheckCircle2 size={14} />
                  已写入“修改任务”页面，可跟踪状态与截止日
                </span>
              )}
            </footer>
          )}
        </section></div>
      )}
      {selfCheckOpen && <div className="foundation-dialog-backdrop" onMouseDown={() => setSelfCheckOpen(false)}><section className="foundation-detail" role="dialog" aria-modal="true" aria-label="自检结果" onMouseDown={(event) => event.stopPropagation()}><header><div><p>本地自检结果</p><h2>{item.title}自检</h2></div><button onClick={() => setSelfCheckOpen(false)}>关闭</button></header><div className="foundation-detail-body"><CheckCircle2 size={18}/><div><b>已检查 {cards.length} 项内容并保存本地记录</b><p>“运行自检”会核对当前页面卡片是否存在空值、待处理状态或未确认规则；它不会提交到任何外部系统。</p></div></div></section></div>}
      <section className="foundation-work">
        <header>
          <div>
            <h2>{pageContent?.workTitle ?? "当前工作"}</h2>
            <span>{pageContent?.workDescription ?? "集中管理当前阶段的待办事项"}</span>
          </div>
          <button onClick={() => void addRevisionTask(pageContent?.workTitle ?? "当前页面待办")}>
            <Sparkles size={14} />
            加入修改任务清单
          </button>
        </header>
        {(pageContent?.workItems ?? [
          { title: "核对当前页面信息", meta: "个人自检", state: "active" as StageState },
          { title: "补充缺失材料与说明", meta: "待处理", state: "pending" as StageState },
        ]).map((work, index) => (
          <p key={`${work.title}-${index}`}>
            <CheckCircle2 size={14} />
            <b>{work.title}</b>
            <span>{work.meta}</span>
            <Badge state={work.state} />
          </p>
        ))}
        {taskCreated && (
          <div className="foundation-task-result">
            <CheckCircle2 size={14} />
            已生成关联任务，可前往“修改任务”继续处理。
          </div>
        )}
      </section>
    </section>
  );
}
