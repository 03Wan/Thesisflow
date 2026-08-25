import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  CircleHelp,
  FileDown,
  FileText,
  FileWarning,
  FolderArchive,
  ListChecks,
  LockKeyhole,
  Mic,
  Presentation,
  Send,
  Sparkles,
  Timer,
  UsersRound,
} from "lucide-react";
import "./defense.css";
import "./dialog.css";
import "./defense-workspace.css";
import { exportArchivePackage, exportFinalManuscript, exportTextReport } from "@/lib/manuscript-export";
import { exportDefensePptx, type DefenseSlide } from "@/lib/defense-pptx";
const archiveItems = [
  "论文最终稿 Word",
  "论文最终稿 PDF",
  "任务书",
  "开题报告",
  "外文原文",
  "外文翻译",
  "学术诚信承诺书",
  "指导情况记录表",
  "论文修改记录",
  "论文自检报告",
  "答辩自检表",
  "答辩记录",
  "指导教师评阅表",
  "评阅教师评阅表",
  "总评成绩",
  "查重报告",
  "其他附件",
];
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`def-card ${className}`}>{children}</section>;
}
function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`def-badge ${tone}`}>{children}</span>;
}
function Title({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="def-title">
      <div>
        <p>答辩与完成阶段</p>
        <h1>{title}</h1>
      </div>
      <div>{children}</div>
    </header>
  );
}
function ActionDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="def-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="def-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <header><h2>{title}</h2><button aria-label="关闭窗口" onClick={onClose}>×</button></header>
      <div>{children}</div><footer><button className="def-primary" onClick={onClose}>知道了</button></footer>
    </section>
  </div>;
}
const formatClock = (totalSeconds: number) => `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
export function DefensePreparationPage() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<"ppt" | "script" | "checklist" | null>(null);
  const [slides, setSlides] = useState<DefenseSlide[]>([
    { title: "封面", body: "论文题目、学生姓名、专业班级、指导教师" }, { title: "研究背景", body: "现实背景与研究价值" },
    { title: "研究问题", body: "核心问题、研究边界与目标" }, { title: "文献综述", body: "主要研究脉络与研究缺口" },
    { title: "理论机制", body: "理论基础、作用路径与研究假设" }, { title: "研究设计", body: "样本、数据、变量与模型" },
    { title: "描述性统计", body: "样本特征与变量分布" }, { title: "实证结果", body: "基准结果与经济意义" },
    { title: "稳健性与内生性", body: "稳健性、内生性及识别策略" }, { title: "进一步分析", body: "机制或异质性分析" },
    { title: "结论与建议", body: "主要结论、启示与局限" }, { title: "致谢", body: "感谢各位老师，请批评指正" },
  ]);
  const [script, setScript] = useState("各位老师好，我汇报的题目是《数字经济对企业创新的影响研究》。本研究关注数字化转型如何通过资源配置效率影响企业创新绩效。接下来我将从研究问题、理论机制、研究设计、主要发现和结论五个方面进行汇报。\n\n请在此继续完善讲稿，并结合实际论文内容核对全部表述。");
  const checklistLabels = ["PPT 已按 5–10 分钟陈述时长精简", "最终稿与答辩稿内容一致", "至少准备 3 个答辩问题", "设备、字体和视频已离线测试", "任务书、开题报告、外文翻译等材料可查"];
  const [checklist, setChecklist] = useState<boolean[]>(() => { try { return JSON.parse(localStorage.getItem("thesisflow-defense-checklist") || "[]"); } catch { return []; } });
  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);
  const entries = [
    ["生成PPT", Presentation, "基于论文结构生成 12 页答辩提纲"],
    ["5分钟讲稿", FileText, "按学校 5–10 分钟陈述规则组织"],
    ["模拟答辩", UsersRound, "AI 评委提问与评分预演"],
    ["答辩清单", ListChecks, "材料、设备与流程核对"],
  ] as const;
  return (
    <section className="def-page">
      <Title title="答辩准备">
        <Badge tone="blue">陈述时长 5 分钟</Badge>
        <button className="def-primary" onClick={() => setWorkspace("checklist")}>开始答辩准备</button>
      </Title>
      <div className="def-entry-grid">
        {entries.map(([t, I, d], index) => (
          <Card key={t}>
            <I size={21} />
            <div>
              <b>{t}</b>
              <p>{d}</p>
            </div>
            <button onClick={() => index === 2 ? navigate("/mock-defense") : setWorkspace(index === 0 ? "ppt" : index === 1 ? "script" : "checklist")}>
              打开 <ChevronRight size={13} />
            </button>
          </Card>
        ))}
      </div>
      {workspace && <Card className="def-workspace">
        <header><div><span>当前工作区</span><h2>{workspace === "ppt" ? "答辩 PPT" : workspace === "script" ? "5 分钟讲稿" : "答辩清单"}</h2></div><button className="def-secondary" onClick={() => setWorkspace(null)}>收起</button></header>
        {workspace === "ppt" && <><div className="slide-editor-list">{slides.map((slide, index) => <article key={index}><b>{String(index + 1).padStart(2, "0")}</b><input aria-label={`第 ${index + 1} 页标题`} value={slide.title} onChange={(event) => setSlides((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}/><textarea aria-label={`第 ${index + 1} 页内容`} value={slide.body} onChange={(event) => setSlides((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value } : item))}/></article>)}</div><footer><span>共 {slides.length} 页，可编辑后导出为真实 PPTX 文件。</span><button className="def-primary" onClick={() => void exportDefensePptx(slides)}><FileDown size={14}/>下载 PPTX</button></footer></>}
        {workspace === "script" && <><textarea className="script-editor" value={script} onChange={(event) => setScript(event.target.value)}/><footer><span>{script.length} 字，建议按实际语速试讲并计时。</span><button className="def-primary" onClick={() => exportTextReport("答辩5分钟讲稿.txt", script)}><FileDown size={14}/>导出讲稿</button></footer></>}
        {workspace === "checklist" && <div className="def-checklist">{checklistLabels.map((label, index) => <label key={label}><input type="checkbox" checked={Boolean(checklist[index])} onChange={(event) => { const next = checklistLabels.map((_, itemIndex) => itemIndex === index ? event.target.checked : Boolean(checklist[itemIndex])); setChecklist(next); localStorage.setItem("thesisflow-defense-checklist", JSON.stringify(next)); }}/><span>{label}</span></label>)}</div>}
      </Card>}
      <div className="prep-grid">
        <Card className="ppt-preview">
          <header>
            <h2>PPT 预览</h2>
            <button onClick={() => setAction("已生成答辩预演稿，可按页练习。")}>生成预演稿</button>
          </header>
          <div>
            <Presentation size={34} />
            <b>数字经济对企业创新的影响</b>
            <span>第 1 / 12 页 · 封面与研究问题</span>
          </div>
          <footer>
            <i />
            <i />
            <i className="active" />
            <i />
            <i />
            <span>…</span>
          </footer>
        </Card>
        <Card className="script-card">
          <header>
            <h2>5分钟讲稿</h2>
            <Badge tone="green">约 4′42″</Badge>
          </header>
          <p>
            各位老师好，我汇报的题目是《数字经济对企业创新的影响研究》。本研究关注数字化转型如何通过资源配置效率影响企业创新绩效……
          </p>
          <button onClick={() => exportTextReport("答辩5分钟讲稿.txt", script)}>
            <FileDown size={14} />
            导出讲稿
          </button>
        </Card>
        <Card className="timer-card">
          <Timer size={20} />
          <strong aria-live="polite">{formatClock(seconds)}</strong>
          <span>学校建议陈述 5–10 分钟</span>
          <div className="timer-actions">
            <button onClick={() => {
              if (seconds === 0) setSeconds(300);
              setTimerRunning((current) => !current);
            }}>
              {timerRunning ? "暂停计时" : seconds === 300 || seconds === 0 ? "开始计时" : "继续计时"}
            </button>
            {seconds !== 300 && <button onClick={() => { setTimerRunning(false); setSeconds(300); }}>重新计时</button>}
          </div>
        </Card>
      </div>
      <div className="prep-bottom">
        <Card>
          <h2>高频问题</h2>
          {[
            "研究创新点体现在哪里？",
            "核心变量为何这样测量？",
            "如何处理内生性问题？",
          ].map((q) => (
            <p key={q}>
              <CircleHelp size={14} />
              {q}
              <button onClick={() => setAction(`开始练习：${q}`)}>练习</button>
            </p>
          ))}
        </Card>
        <Card>
          <h2>预演评分</h2>
          <div className="mini-scores">
            完整性 88　逻辑 84　准确性 86　表达 82
          </div>
          <p className="task-row">
            <FileWarning size={14} />
            改进任务：补充工具变量选择依据 <Badge tone="amber">待处理</Badge>
          </p>
        </Card>
      </div>
      {action && <ActionDialog title="答辩准备" onClose={() => setAction(null)}><p>{action}</p></ActionDialog>}
    </section>
  );
}
export function MockDefensePage() {
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  const toggleRecording = async () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRunning(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.onstop = () => { recorderRef.current = null; };
      recorder.start(); streamRef.current = stream; recorderRef.current = recorder;
      setRecordingError(null); setElapsedSeconds(0); setRunning(true);
    } catch (error) { setRecordingError(error instanceof Error ? `无法开始录音：${error.message}` : "无法获取麦克风权限。"); }
  };
  return (
    <section className="def-page">
      <Title title="模拟答辩">
        <Badge tone="amber">AI 语音与评分预演</Badge>
      </Title>
      <div className="mock-layout">
        <main>
          <Card className="jury">
            <header>
              <div>
                <UsersRound size={17} />
                <b>AI 评委区</b>
              </div>
              <Badge tone="blue">第 2 / 6 题</Badge>
            </header>
            <p>
              请解释数字化转型影响企业创新的核心作用机制，以及你将如何验证这一机制？
            </p>
            <div className="wave">
              {Array.from({ length: 38 }, (_, i) => (
                <i key={i} style={{ height: `${12 + ((i * 13) % 37)}px` }} />
              ))}
            </div>
            <footer>
              <button onClick={() => void toggleRecording()}>
                <Mic size={15} />
                {running ? "暂停录音" : "开始回答"}
              </button>
              <strong aria-live="polite">{formatClock(elapsedSeconds)}</strong>
              <span>建议控制在 90 秒内</span>
            </footer>
            {recordingError && <p className="mock-note">{recordingError}</p>}
          </Card>
          <Card className="answer-record">
            <header>
              <h2>回答记录</h2>
              <span>自动转写为交互占位</span>
            </header>
            <p>
              本研究认为，数字化转型主要通过降低信息搜寻成本和提升资源配置效率促进企业创新。在实证部分，我将采用中介效应模型进行检验……
            </p>
          </Card>
          <div className="live-score">
            {[
              ["完整性", 88],
              ["逻辑", 84],
              ["准确性", 86],
              ["表达", 82],
              ["时间控制", 90],
            ].map(([n, v]) => (
              <Card key={String(n)}>
                <span>{n}</span>
                <b>{v}</b>
                <i>
                  <em style={{ width: `${v}%` }} />
                </i>
              </Card>
            ))}
          </div>
        </main>
        <aside className="mock-advice">
          <h2>实时建议</h2>
          <p>
            <CheckCircle2 size={14} />
            已说明核心机制，论证结构清晰。
          </p>
          <p>
            <FileWarning size={14} />
            建议补充资源配置效率的具体衡量方式。
          </p>
          <p>
            <Clock3 size={14} />
            {elapsedSeconds === 0 ? "开始回答后将实时记录用时。" : `当前回答已用 ${elapsedSeconds} 秒${elapsedSeconds >= 75 ? "，建议在结论处收束。" : "。"}`}
          </p>
          <button className="def-primary" onClick={() => setAdviceOpen(true)}>
            <Sparkles size={14} />
            生成改进建议
          </button>
        </aside>
      </div>
      {adviceOpen && <ActionDialog title="回答改进建议" onClose={() => setAdviceOpen(false)}><p>已生成建议：补充资源配置效率的衡量口径，并在结尾回扣研究假设。</p></ActionDialog>}
    </section>
  );
}
export function DefenseRecordPage() {
  const [taskOpen, setTaskOpen] = useState(false);
  return (
    <section className="def-page">
      <Title title="答辩记录">
        <Badge tone="green">记录已保存</Badge>
        <button className="def-primary" onClick={() => setTaskOpen(true)}>转为修改任务</button>
      </Title>
      <Card className="record-info">
        <div>
          <small>答辩时间</small>
          <b>2026-06-08 09:00</b>
        </div>
        <div>
          <small>地点</small>
          <b>经管楼 A302</b>
        </div>
        <div>
          <small>答辩老师</small>
          <b>李教授、王教授、陈教授</b>
        </div>
        <div>
          <small>模拟成绩</small>
          <b>86 / 100</b>
        </div>
      </Card>
      <div className="record-grid">
        <Card>
          <h2>答辩问题与回答</h2>
          {[
            [
              "数字化转型的创新点是什么？",
              "从资源配置效率解释数字技术对创新绩效的微观传导机制。",
            ],
            [
              "如何缓解内生性问题？",
              "采用工具变量、滞后变量和倾向得分匹配进行交叉检验。",
            ],
          ].map((x) => (
            <article key={x[0]}>
              <b>问：{x[0]}</b>
              <p>答：{x[1]}</p>
            </article>
          ))}
        </Card>
        <Card>
          <h2>答辩意见</h2>
          <p>
            研究框架完整，建议进一步明确工具变量选择逻辑，并在结论中强化实践启示。
          </p>
          <h2>附件</h2>
          <p className="attachment">
            <FileText size={14} />
            答辩记录表.pdf <Badge tone="green">已关联</Badge>
          </p>
        </Card>
      </div>
      <p className="mock-note">
        本页记录仅用于本地答辩准备与修改跟踪。
      </p>
      {taskOpen && <ActionDialog title="已创建修改任务" onClose={() => setTaskOpen(false)}><p>已将工具变量依据与结论实践启示添加至修改任务清单。</p></ActionDialog>}
    </section>
  );
}
export function PostDefenseRevisionPage() {
  const [done, setDone] = useState<string[]>([]);
  const tasks = [
    "补充工具变量选择依据",
    "强化结论的实践启示",
    "核验表 4-2 数据来源",
  ];
  const remain = tasks.filter((t) => !done.includes(t));
  return (
    <section className="def-page">
      <Title title="答辩后修改">
        <Badge tone={remain.length ? "amber" : "green"}>
          完成 {done.length}/{tasks.length}
        </Badge>
      </Title>
      <div className="revision-flow">
        <Card>
          <h2>答辩意见</h2>
          <p>
            工具变量选择逻辑需进一步说明；结论需补充针对制造业转型的实践启示。
          </p>
        </Card>
        <ChevronRight size={18} />
        <Card>
          <h2>修改任务</h2>
          <p>{tasks.length} 项任务已从答辩意见生成</p>
        </Card>
        <ChevronRight size={18} />
        <Card>
          <h2>完成情况</h2>
          <p>
            {remain.length
              ? `仍有 ${remain.length} 项待完成`
              : "全部任务已完成"}
          </p>
        </Card>
      </div>
      <Card className="post-tasks">
        {tasks.map((t) => {
          const complete = done.includes(t);
          return (
            <article key={t}>
              <span>
                {complete ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <FileWarning size={16} />
                )}
              </span>
              <b>{t}</b>
              <Badge tone={complete ? "green" : "amber"}>
                {complete ? "已完成" : "待处理"}
              </Badge>
              <button
                onClick={() =>
                  setDone((list) =>
                    complete ? list.filter((x) => x !== t) : [...list, t],
                  )
                }
              >
                {complete ? "撤销" : "标记完成"}
              </button>
            </article>
          );
        })}
      </Card>
      <div className={remain.length ? "stage-block" : "stage-pass"}>
        {remain.length ? (
          <>
            <LockKeyhole size={15} />
            未全部完成答辩后修改，不可进入最终稿。
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            全部修改已完成，具备进入最终稿的 Mock 条件。
          </>
        )}
      </div>
    </section>
  );
}
export function FinalManuscriptPage() {
  const [exportType, setExportType] = useState<"PDF" | "DOCX" | null>(null);
  const [exporting, setExporting] = useState<"PDF" | "DOCX" | null>(null);
  const exportFile = async (type: "PDF" | "DOCX") => { setExporting(type); await exportFinalManuscript(type); setExporting(null); setExportType(type); };
  return (
    <section className="def-page">
      <Title title="最终稿">
        <Badge tone="green">具备提交条件</Badge>
        <button className="def-primary" disabled={!!exporting} onClick={() => void exportFile("PDF")}>
          <FileDown size={15} />
          {exporting === "PDF" ? "正在生成…" : "导出 PDF"}
        </button>
        <button className="def-secondary" disabled={!!exporting} onClick={() => void exportFile("DOCX")}>
          <FileDown size={15} />
          {exporting === "DOCX" ? "正在生成…" : "导出 DOCX"}
        </button>
      </Title>
      <Card className="final-file">
        <FileText size={27} />
        <div>
          <b>数字经济对企业创新的影响研究_最终稿.docx</b>
          <span>1.84 MB · V4.0 · 2026-06-10 16:20</span>
        </div>
        <Badge tone="green">最终版本</Badge>
      </Card>
      <div className="final-review-grid">
        {[
          ["最终自检", "结构、格式与附件已完成核验", "已通过"],
          ["个人确认", "学生已确认当前版本", "已确认"],
          ["最终查重状态", "可导入本地查重或自检报告进行留档", "待上传"],
        ].map(([t, d, s], i) => (
          <Card key={t}>
            <span>
              {i === 2 ? <FileWarning size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <h2>{t}</h2>
            <p>{d}</p>
            <Badge tone={i === 2 ? "amber" : "green"}>{s}</Badge>
          </Card>
        ))}
      </div>
      {exportType && <ActionDialog title={`${exportType} 已下载`} onClose={() => setExportType(null)}><p>已生成并下载最终稿 {exportType} 文件。</p></ActionDialog>}
    </section>
  );
}
export function ArchivePage() {
  const [created, setCreated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const createPackage = async () => { setExporting(true); await exportArchivePackage(); setExporting(false); setCreated(true); setDialogOpen(true); };
  const missing = ["查重报告", "其他附件"];
  return (
    <section className="def-page">
      <Title title="材料归档">
        <Badge tone="amber">归档完整度 85%</Badge>
        <button className="def-primary" disabled={exporting} onClick={() => void createPackage()}>
          <FolderArchive size={15} />
          {exporting ? "正在打包…" : "一键生成归档包"}
        </button>
      </Title>
      <div className="archive-layout">
        <Card className="archive-check">
          <header>
            <div>
              <h2>材料 Checklist</h2>
              <span>12 类归档材料</span>
            </div>
            <Badge tone="amber">缺失 {missing.length} 项</Badge>
          </header>
          {archiveItems.map((item) => {
            const absent = missing.includes(item);
            return (
              <p key={item}>
                {absent ? (
                  <FileWarning size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>{item}</span>
                <Badge tone={absent ? "amber" : "green"}>
                  {absent ? "缺失" : "已齐备"}
                </Badge>
              </p>
            );
          })}
        </Card>
        <div>
          <Card className="archive-progress">
            <h2>归档完整度</h2>
            <strong>
              85<small>%</small>
            </strong>
            <i>
              <em />
            </i>
            <p>完成 11 / 13 项归档材料关联</p>
          </Card>
          <Card className="archive-tree">
            <h2>归档目录预览</h2>
            <pre>
              毕业论文归档包/{"\n"}├─ 01_论文最终稿/{"\n"}├─ 02_过程材料/{"\n"}
              ├─ 03_评阅与答辩/{"\n"}└─ 04_查重与附件/
            </pre>
          </Card>
        </div>
      </div>
      {created && (
        <div className="archive-created">
          <CheckCircle2 size={15} />
          已生成归档包，等待缺失材料补齐后即可提交。
        </div>
      )}
      {dialogOpen && <ActionDialog title="归档包已下载" onClose={() => setDialogOpen(false)}><p>ZIP 归档包已生成并下载，其中包含 PDF、DOCX 和归档说明。</p></ActionDialog>}
    </section>
  );
}
