import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Plus,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import {
  mockRules,
  stageStates,
  type StageState,
} from "@/data/mock/workflow";
import { useProjectStore } from "@/stores/project-store";
import { useRequirementStore } from "@/stores/requirement-store";
import { RuleCandidateRepository } from "@/repositories/ruleCandidateRepository";
import { ruleReviewService } from "@/services/ruleReviewService";
import type { RuleCandidate } from "@/types/document";
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
type Card = { label: string; value: string; state: StageState };
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
    title: "任务书",
    eyebrow: "准备阶段 / 培养任务",
    state: "completed",
    description: "任务目标、研究内容、时间节点与责任确认。",
  },
  translation: {
    title: "外文翻译",
    eyebrow: "写作阶段 / 翻译材料",
    state: "overdue",
    description: "外文原文、翻译稿与术语核对工作区。",
  },
  midterm: {
    title: "中期检查",
    eyebrow: "写作阶段 / 阶段检查",
    state: "completed",
    description: "检查研究进度、阶段成果和待改进问题。",
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
    description: "本地界面与通知偏好 Mock 设置。",
  },
};

const contentByKind: Partial<Record<Kind, FoundationContent>> = {
  topic: {
    cards: [
      { label: "论文题目", value: "数字经济对企业创新的影响研究", state: "completed" },
      { label: "核心研究问题", value: "数字化转型如何影响企业创新绩效，其传导机制是什么？", state: "completed" },
      { label: "研究边界", value: "2010—2023 年沪深 A 股制造业上市公司", state: "active" },
      { label: "预期创新点", value: "从资源配置效率视角解释数字化转型的创新效应", state: "active" },
    ],
    stats: [
      { label: "题目版本", value: "V1.3", detail: "已自动保存" },
      { label: "核心问题", value: "2 个", detail: "边界清晰" },
      { label: "关键词", value: "5 个", detail: "已关联检索" },
      { label: "完成度", value: "82%", detail: "待完善创新点" },
    ],
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
      { label: "任务目标", value: "完成研究设计、实证分析、论文写作与材料归档", state: "completed" },
      { label: "主要研究内容", value: "理论机制、变量设计、基准回归、扩展检验与结论", state: "completed" },
      { label: "预期成果", value: "毕业论文正文、数据说明、答辩材料与最终归档包", state: "active" },
      { label: "计划周期", value: "2026 年 2 月—2026 年 6 月，共 18 周", state: "active" },
    ],
    stats: [
      { label: "总任务", value: "12 项", detail: "按阶段拆分" },
      { label: "已完成", value: "4 项", detail: "准备阶段" },
      { label: "进行中", value: "3 项", detail: "研究阶段" },
      { label: "剩余周期", value: "11 周", detail: "按计划推进" },
    ],
    workTitle: "近期任务安排",
    workDescription: "将任务书要求转成可执行的个人计划",
    workItems: [
      { title: "完成数据来源与样本口径说明", meta: "本周", state: "active" },
      { title: "整理变量定义表", meta: "下周", state: "pending" },
      { title: "建立论文目录与章节目标", meta: "已完成", state: "completed" },
    ],
  },
  translation: {
    cards: [
      { label: "外文原文", value: "Digital transformation and firm innovation.pdf · 18 页", state: "completed" },
      { label: "翻译稿", value: "已完成 2,460 / 3,000 字，当前版本 V2.1", state: "active" },
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
      { label: "当前进度", value: "已完成研究设计和数据准备，正在进行基准模型分析", state: "active" },
      { label: "阶段成果", value: "文献库 28 篇、变量表 1 份、清洗后样本 18,426 条", state: "completed" },
      { label: "主要问题", value: "工具变量可得性和稳健性方案仍需进一步验证", state: "active" },
      { label: "下一阶段计划", value: "完成实证分析并启动结果章节写作", state: "pending" },
    ],
    stats: [
      { label: "总体进度", value: "56%", detail: "符合当前计划" },
      { label: "完成节点", value: "7 个", detail: "共 12 个" },
      { label: "阶段文件", value: "9 份", detail: "已关联项目" },
      { label: "待解决问题", value: "3 项", detail: "无阻塞项" },
    ],
    workTitle: "中期自检事项",
    workDescription: "检查成果、风险和后续计划是否完整",
    workItems: [
      { title: "更新实际进度与原计划差异", meta: "已完成", state: "completed" },
      { title: "补充当前困难及解决方案", meta: "进行中", state: "active" },
      { title: "整理中期检查材料包", meta: "待处理", state: "pending" },
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
  const [selected, setSelected] = useState<Card | null>(null);
  const [saved, setSaved] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const projects = useProjectStore((state) => state.projects);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const browserPreview = typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);
  const requirements = useRequirementStore((state) => state.requirements);
  const loadRequirements = useRequirementStore((state) => state.load);
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
  const pageContent = contentByKind[kind];
  const fallbackRequirements = mockRules.map((rule) => ({
    label: rule.label,
    value: rule.value,
    state: rule.state,
  }));
  const cards: Card[] =
    kind === "requirements"
      ? requirements.length
        ? requirements.map((rule) => ({
            label: rule.label,
            value:
              rule.targetValue === null
                ? "待统计 / 未配置目标"
                : `当前：${rule.currentValue}${rule.unit} · 目标：${rule.targetValue}${rule.unit}`,
            state:
              rule.targetValue !== null && rule.currentValue >= rule.targetValue
                ? "completed"
                : "active",
          }))
        : fallbackRequirements
      : pageContent?.cards ?? [];
  const stats =
    kind === "requirements"
      ? [
          { label: "已确认规则", value: String(cards.length), detail: "当前项目" },
          { label: "篇幅要求", value: "10,000 字", detail: "正文目标" },
          { label: "参考文献", value: "20 篇", detail: "建议下限" },
          { label: "待确认项", value: "0 项", detail: "规则候选" },
        ]
      : pageContent?.stats ?? [];

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
          <button onClick={() => setSaved(true)}>
            <Save size={14} />
            {saved ? "已保存" : "保存"}
          </button>
          <button
            className="primary"
            onClick={() => setSaved(true)}
          >
            <Send size={14} />
            完成自检
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
              <button onClick={() => setSelected(card)}>
                查看详情 <Plus size={13} />
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
        <section className="foundation-detail">
          <header>
            <div>
              <p>当前详情</p>
              <h2>{selected.label}</h2>
            </div>
            <button onClick={() => setSelected(null)}>关闭</button>
          </header>
          <div className="foundation-detail-body">
            <FileText size={18} />
            <div>
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
          </div>
          {kind !== "calendar" && (
            <footer>
              <button className="primary" onClick={() => setTaskCreated(true)}>
                <Sparkles size={14} />
                {taskCreated ? "已创建关联修改任务" : "创建关联修改任务"}
              </button>
              {taskCreated && (
                <span>
                  <CheckCircle2 size={14} />
                  任务已关联至“修改任务”页面
                </span>
              )}
            </footer>
          )}
        </section>
      )}
      <section className="foundation-work">
        <header>
          <div>
            <h2>{pageContent?.workTitle ?? "当前工作"}</h2>
            <span>{pageContent?.workDescription ?? "集中管理当前阶段的待办事项"}</span>
          </div>
          <button onClick={() => setTaskCreated(true)}>
            <Sparkles size={14} />
            创建修改任务
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
