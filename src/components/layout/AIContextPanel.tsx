import {
  ChevronRight,
  Sparkles,
  X,
  Send,
  Square,
  Eye,
  RotateCcw,
  Trash2,
  MapPin,
  ShieldCheck,
  Bot,
  MessageSquareText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/project-store";
import { useTaskStore } from "@/stores/task-store";
import { askConfiguredProvider, getActiveBrowserProvider } from "@/ai/providerClient";

type WorkspaceGuide = {
  label: string;
  purpose: string;
  action: string;
  suggestions?: string[];
};

const workspaceGuides: Record<string, WorkspaceGuide> = {
  "/overview": { label: "项目总览", purpose: "汇总项目进度、待办任务和近期节点，帮助确定下一步。", action: "生成本地项目检查", suggestions: ["请按截止时间列出本周最优先的任务。", "当前项目进度为什么停滞？", "哪些任务可以合并处理？"] },
  "/requirements": { label: "论文要求", purpose: "核对字数、参考文献和规则项是否已补齐。", action: "检查要求完成情况", suggestions: ["哪些硬性要求尚未满足？", "请按影响程度排序缺失项。", "如何补齐参考文献要求？"] },
  "/topic": { label: "选题", purpose: "梳理选题依据、研究问题与待补充信息。", action: "检查选题材料" },
  "/task-book": { label: "任务书", purpose: "检查任务目标、时间安排和材料完整性。", action: "检查任务书" },
  "/proposal": { label: "开题报告", purpose: "围绕研究背景、问题、方法与进度计划提供开题阶段支持。", action: "检查开题材料", suggestions: ["开题报告还缺少哪些关键论证？", "研究问题与研究方法是否匹配？", "请为进度计划列出可执行里程碑。"] },
  "/research-design": { label: "研究设计", purpose: "围绕假设、变量、样本与识别策略提供设计阶段支持。", action: "检查研究设计", suggestions: ["变量定义有哪些可测量性风险？", "请检查假设与识别策略是否一致。", "数据来源还需要补充哪些说明？"] },
  "/implementation": { label: "数据 / 调研", purpose: "汇总数据处理与调研任务，标出待处理项。", action: "检查数据任务", suggestions: ["数据清洗下一步应该做什么？", "样本筛选规则是否完整？", "请检查变量缺失与异常值风险。"] },
  "/outline": { label: "论文大纲", purpose: "检查章节结构和仍待补充的写作任务。", action: "检查大纲任务", suggestions: ["大纲章节之间是否存在重复？", "这一章需要哪些证据支持？", "请生成下一节的写作提纲。"] },
  "/translation": { label: "外文翻译", purpose: "提示翻译稿、术语核对和待提交材料。", action: "检查翻译材料" },
  "/midterm": { label: "中期检查", purpose: "汇总中期节点与尚未完成的检查材料。", action: "检查中期材料" },
  "/guidance": { label: "导师指导", purpose: "整理本地指导记录关联的待修改任务。", action: "检查修改任务" },
  "/revisions": { label: "修改任务", purpose: "按状态梳理待处理、等待确认和 AI 建议任务。", action: "汇总修改任务", suggestions: ["先处理哪些修改任务？", "哪些任务需要导师确认？", "请把待办拆成可执行步骤。"] },
  "/compliance": { label: "全文智评", purpose: "列出本地检查结果，不会替代人工或外部查重。", action: "查看本地检查范围" },
  "/advisor-review": { label: "引用核验", purpose: "定位待核验引用，便于逐条确认来源。", action: "汇总引用核验任务" },
  "/reviewer-review": { label: "格式检查", purpose: "聚合格式问题和可以处理的本地修改项。", action: "汇总格式检查项" },
  "/finalization": { label: "论文定稿", purpose: "检查定稿前仍待完成的本地事项。", action: "检查定稿事项" },
  "/final-manuscript": { label: "最终稿", purpose: "提示最终稿导出前的完成情况。", action: "检查导出准备" },
  "/archive": { label: "材料归档", purpose: "检查归档包前的材料与待办项。", action: "检查归档准备" },
};

export function AIContextPanel() {
  const setOpen = useWorkspaceStore((state) => state.setAiPanelOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<
    | "idle"
    | "preparing"
    | "queued"
    | "streaming"
    | "completed"
    | "error"
    | "cancelled"
  >("idle");
  const [preview, setPreview] = useState(false);
  const [question, setQuestion] = useState("");
  const activeProject = useProjectStore((store) =>
    store.projects.find((project) => project.id === store.activeProjectId),
  );
  const tasks = useTaskStore((store) => store.tasks);
  const taskProjectId = useTaskStore((store) => store.projectId);
  const loadTasks = useTaskStore((store) => store.load);
  useEffect(() => {
    if (activeProject && taskProjectId !== activeProject.id) void loadTasks(activeProject.id);
  }, [activeProject, taskProjectId, loadTasks]);
  const queueItems = useMemo(() => {
    const pendingCount = tasks.filter((task) => task.status === "todo" || task.status === "waiting").length;
    const aiSuggestionCount = tasks.filter((task) => task.sourceType === "ai" && task.status !== "done").length;
    return [
      { label: `待处理问题 (${pendingCount})`, destination: "/revisions?filter=todo" },
      { label: `修改建议 (${aiSuggestionCount})`, destination: "/revisions?source=ai" },
      { label: "引用核验", destination: "/advisor-review" },
    ];
  }, [tasks]);
  const guide = workspaceGuides[location.pathname] ?? {
    label: "论文工作台",
    purpose: "根据当前页面的本地项目数据，汇总可继续处理的任务。",
    action: "生成本地检查结果", suggestions: ["当前页面最重要的下一步是什么？", "请检查本页待补充内容。", "请说明建议的依据与边界。"],
  };
  const currentWorkspace = guide.label;
  const activeProvider = getActiveBrowserProvider();
  const [advisorText, setAdvisorText] = useState<string | null>(null);
  const evaluate = () => {
    if (!activeProject) {
      setState("error");
      setAdvisorText("尚未打开项目，因此无法读取项目进度或任务。请先在“项目”中创建或打开一个本地项目。");
      return;
    }
    const pending = tasks.filter((task) => task.status === "todo" || task.status === "waiting");
    const overdue = pending.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now());
    const phase = activeProject.currentStage?.trim() || "尚未设置阶段";
    const summary = [
      `本地检查结果：${guide.label}`,
      `项目「${activeProject.title}」当前处于「${phase}」，总体进度 ${activeProject.progress}%。`,
      `当前项目共有 ${pending.length} 项待处理任务${overdue.length ? `，其中 ${overdue.length} 项已逾期` : ""}。`,
      pending[0] ? `建议先处理：「${pending[0].title}」。` : "当前没有待处理任务，可继续补充本页面材料或进入下一阶段。",
    ].join("\n");
    setState("completed");
    setAdvisorText(summary);
  };
  const askProvider = async () => {
    if (!activeProvider) {
      setState("error");
      setAdvisorText("尚未发现启用的模型。请到“设置 → AI 设置”保存 API Key、启用一个供应商，再返回此处提问。");
      return;
    }
    setState("streaming");
    const prompt = question.trim() || `请基于以下本地工作区信息，给出简洁、可执行的下一步建议：页面=${guide.label}；项目=${activeProject?.title ?? "未打开"}；阶段=${activeProject?.currentStage ?? "未设置"}；待处理任务=${tasks.filter((task) => task.status === "todo" || task.status === "waiting").length}。`;
    try {
      const answer = await askConfiguredProvider(activeProvider, prompt);
      setAdvisorText(answer || "模型未返回可显示的文本。");
      setState("completed");
    } catch {
      setAdvisorText("连接请求未完成。请检查 API Key、模型 ID、Base URL 与网络连接后重试。错误详情不会显示在页面中，以避免暴露密钥。");
      setState("error");
    }
  };
  const clear = () => {
    setAdvisorText(null);
    setPreview(false);
    setState("idle");
  };
  const isRunning =
    state === "preparing" || state === "queued" || state === "streaming";
  const stateLabel = {
    idle: "就绪",
    preparing: "准备中",
    queued: "排队中",
    streaming: "生成中",
    completed: "已完成",
    error: "需设置",
    cancelled: "已停止",
  }[state];
  return (
    <aside className="ai-panel" aria-label="AI 上下文">
      <div className="panel-heading ai-panel-heading">
        <div>
          <Sparkles size={15} />
          <strong>AI 论文助手</strong>
        </div>
        <button
          className="icon-button"
          onClick={() => setOpen(false)}
          aria-label="收起 AI 上下文"
        >
          <X size={16} />
        </button>
      </div>
      <div className="ai-panel-scroll">
        <div className="ai-context-header">
          <div>
            <p className="eyebrow">当前工作区</p>
            <h3>{currentWorkspace}</h3>
          </div>
          <span className={`ai-status ai-status-${state}`}>
            <i />
            {stateLabel}
          </span>
        </div>
        <section className="ai-flow-step ai-flow-context">
          <div className="ai-flow-title"><b>1</b><strong>理解当前页面</strong></div>
          <div className="ai-context-card">
            <Bot size={17} />
            <div><strong>当前：{currentWorkspace}</strong><p>{guide.purpose}</p></div>
          </div>
          <div className={`ai-provider-line ${activeProvider ? "is-ready" : ""}`}><ShieldCheck size={14} />{activeProvider ? `已连接：${activeProvider.name}` : "未连接模型：可先使用本地检查"}</div>
        </section>
        <section className="ai-flow-step ai-flow-suggestions">
          <div className="ai-flow-title"><b>2</b><strong>提问或选择建议</strong><span>依据不足会提示</span></div>
          {(guide.suggestions ?? ["当前页面最重要的下一步是什么？", "请检查本页待补充内容。", "请说明建议的依据与边界。"]).map((suggestion) => <button key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
        </section>
        {state === "completed" && advisorText && (
          <section className="ai-flow-step ai-flow-answer">
            <div className="ai-flow-title"><b>AI</b><strong>{activeProvider ? `${activeProvider.name} 回复` : "本地检查结果"}</strong></div>
            <article>{advisorText.split("\n").map((line) => <p key={line}>{line}</p>)}</article>
            <button className="settings-text-button" onClick={() => navigate("/revisions?filter=todo")}><MapPin size={13} />查看待处理任务</button>
          </section>
        )}
        <section className="ai-flow-step ai-flow-compose">
          <div className="ai-flow-title"><b>3</b><strong>应用下一步</strong><span>不会直接改写内容</span></div>
          <label className="ai-question-input"><span>向 {activeProvider?.name ?? "已启用模型"} 提问</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="输入你的问题或下一步需求…" /></label>
          <div className="ai-compose-actions"><button className="ai-local-check" onClick={evaluate}>本地检查</button><button className="ai-primary-action" disabled={isRunning} onClick={askProvider}>{isRunning ? "模型正在回复…" : activeProvider ? "发送" : "去配置"}<Send size={14} /></button></div>
        </section>
        <div className="ai-tool-grid" aria-label="AI 对话工具">
          <button disabled={!isRunning} onClick={() => setState("cancelled")}>
            <Square size={14} />
            <span>停止</span>
          </button>
          <button
            disabled={
              state !== "error" &&
              state !== "cancelled" &&
              state !== "completed"
            }
            onClick={evaluate}
          >
            <RotateCcw size={14} />
            <span>重试</span>
          </button>
          <button
            className={preview ? "is-active" : ""}
            onClick={() => setPreview(!preview)}
          >
            <Eye size={14} />
            <span>上下文</span>
          </button>
          <button onClick={clear}>
            <Trash2 size={14} />
            <span>清空</span>
          </button>
        </div>
        {state === "error" && (
          <div className="ai-summary ai-result-card">
            <strong>无法生成本地检查结果</strong>
            <p>
              {advisorText}
            </p>
            <button
              className="settings-text-button"
              onClick={() => navigate("/projects")}
            >
              前往项目
            </button>
          </div>
        )}
        {state === "cancelled" && (
          <div className="ai-summary ai-result-card">
            <strong>已停止</strong>
            <p>已停止当前 UI 会话；迟到的流式内容不会写入此面板。</p>
          </div>
        )}
        {preview && (
          <div className="ai-summary ai-result-card">
            <strong>本次上下文</strong>
            <p>
              将发送：当前项目
              ID、标题与基础元数据、当前阶段、已确认规则、逾期或阻塞任务、修改任务数量及用户选择的少量来源。
            </p>
            <p>不会发送 API Key、其他项目、整份文件或未选择的大段正文。</p>
          </div>
        )}
        <div className="ai-queue-heading">
          <span>
            <MessageSquareText size={14} />
            工作队列
          </span>
          <small>3 项</small>
        </div>
        {queueItems.map((item) => (
          <button
            className={`ai-queue-row ${location.pathname + location.search === item.destination ? "is-active" : ""}`}
            key={item.destination}
            onClick={() => navigate(item.destination)}
          >
            <span>{item.label}</span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
    </aside>
  );
}
