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
import { fakeReadonlyAdvisor } from "@/ai/readonlyAdvisor";
import { useTaskStore } from "@/stores/task-store";

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
  const workspaceLabel: Record<string, string> = {
    "/overview": "项目总览",
    "/requirements": "论文要求",
    "/topic": "选题",
    "/task-book": "任务书",
    "/implementation": "数据 / 调研",
    "/outline": "论文大纲",
    "/translation": "外文翻译",
    "/midterm": "中期检查",
    "/guidance": "导师指导",
    "/revisions": "修改任务",
    "/compliance": "全文智评",
    "/advisor-review": "引用核验",
    "/reviewer-review": "格式检查",
    "/version-history": "版本历史",
    "/finalization": "论文定稿",
    "/plagiarism": "查重记录",
    "/teacher-review": "教师评阅",
    "/sampling": "论文抽检",
    "/defense-prep": "答辩准备",
    "/mock-defense": "模拟答辩",
    "/defense": "答辩记录",
    "/post-defense-revision": "答辩后修改",
    "/final-manuscript": "最终稿",
    "/archive": "材料归档",
    "/calendar": "节点日历",
  };
  const currentWorkspace = workspaceLabel[location.pathname] ?? "论文工作台";
  const [advisorText, setAdvisorText] = useState<string | null>(null);
  const evaluate = () => {
    if (!activeProject) {
      setState("error");
      setAdvisorText(null);
      return;
    }
    setState("preparing");
    window.setTimeout(() => setState("queued"), 100);
    window.setTimeout(() => setState("streaming"), 220);
    window.setTimeout(() => {
      setState("completed");
      setAdvisorText(fakeReadonlyAdvisor(activeProject).summary);
    }, 380);
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
        <div className="ai-conversation">
          <div className="ai-avatar">
            <Bot size={16} />
          </div>
          <div className="ai-message">
            <strong>需要我评估当前项目吗？</strong>
            <p>我会结合当前阶段、已确认规则和你选择的来源，整理下一步建议。</p>
            <span>
              <ShieldCheck size={12} />
              只读分析，不会修改项目内容
            </span>
          </div>
        </div>
        <button
          className="ai-primary-action"
          disabled={isRunning}
          onClick={evaluate}
        >
          <Sparkles size={15} />
          {isRunning ? "正在评估…" : "评估当前项目"}
          <Send size={14} />
        </button>
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
            <strong>尚未就绪</strong>
            <p>
              请先在“设置 → AI
              设置”保存密钥并完成连接测试。当前不会把请求发送到未知 Provider。
            </p>
            <button
              className="settings-text-button"
              onClick={() => navigate("/settings")}
            >
              前往 AI 设置
            </button>
          </div>
        )}
        {state === "cancelled" && (
          <div className="ai-summary ai-result-card">
            <strong>已停止</strong>
            <p>已停止当前 UI 会话；迟到的流式内容不会写入此面板。</p>
          </div>
        )}
        {advisorText && (
          <div className="ai-summary ai-result-card">
            <strong>AI 建议（开发 FakeProvider）</strong>
            <p>{advisorText}</p>
            <p>真实 Provider 连接未验收；不会将此结果写入项目事实或规则。</p>
            <button
              className="settings-text-button"
              onClick={() =>
                setAdvisorText(
                  "当前建议没有可核实的 Phase 3 source_ref；因此不能打开来源。",
                )
              }
            >
              <MapPin size={13} />
              查看来源
            </button>
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
