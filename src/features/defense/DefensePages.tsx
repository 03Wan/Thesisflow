import { useState } from "react";
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
const archiveItems = [
  "论文最终稿 Word",
  "论文最终稿 PDF",
  "任务书",
  "开题报告",
  "外文原文",
  "外文翻译",
  "论文修改记录",
  "论文自检报告",
  "答辩自检表",
  "答辩记录",
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
export function DefensePreparationPage() {
  const [seconds, setSeconds] = useState(300);
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
        <button className="def-primary">开始答辩准备</button>
      </Title>
      <div className="def-entry-grid">
        {entries.map(([t, I, d]) => (
          <Card key={t}>
            <I size={21} />
            <div>
              <b>{t}</b>
              <p>{d}</p>
            </div>
            <button>
              打开 <ChevronRight size={13} />
            </button>
          </Card>
        ))}
      </div>
      <div className="prep-grid">
        <Card className="ppt-preview">
          <header>
            <h2>PPT 预览</h2>
            <button>生成预演稿（占位）</button>
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
          <button>
            <FileDown size={14} />
            导出讲稿（占位）
          </button>
        </Card>
        <Card className="timer-card">
          <Timer size={20} />
          <strong>
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </strong>
          <span>学校建议陈述 5–10 分钟</span>
          <button onClick={() => setSeconds((s) => (s === 300 ? 299 : 300))}>
            {seconds === 300 ? "开始计时（占位）" : "重置计时"}
          </button>
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
              <button>练习</button>
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
    </section>
  );
}
export function MockDefensePage() {
  const [running, setRunning] = useState(false);
  return (
    <section className="def-page">
      <Title title="模拟答辩">
        <Badge tone="amber">AI 语音与评分均为 Mock</Badge>
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
              <button onClick={() => setRunning(!running)}>
                <Mic size={15} />
                {running ? "暂停录音（占位）" : "开始回答（占位）"}
              </button>
              <strong>03:18</strong>
              <span>建议控制在 90 秒内</span>
            </footer>
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
            当前回答已用 78 秒，可在结论处收束。
          </p>
          <button className="def-primary">
            <Sparkles size={14} />
            生成改进建议（占位）
          </button>
        </aside>
      </div>
    </section>
  );
}
export function DefenseRecordPage() {
  return (
    <section className="def-page">
      <Title title="答辩记录">
        <Badge tone="green">记录已保存 / Mock</Badge>
        <button className="def-primary">转为修改任务</button>
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
        本页为学生自检与记录 Mock，不代表学校正式答辩意见或成绩。
      </p>
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
  return (
    <section className="def-page">
      <Title title="最终稿">
        <Badge tone="green">具备提交条件 / Mock</Badge>
        <button className="def-primary">
          <FileDown size={15} />
          导出 PDF（占位）
        </button>
        <button className="def-secondary">
          <FileDown size={15} />
          导出 DOCX（占位）
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
          ["最终查重状态", "学校正式报告需以学院系统为准", "待上传"],
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
      <p className="mock-note">
        导出按钮仅作为前端交互占位，不生成真实 DOCX、PDF 或学校正式结论。
      </p>
    </section>
  );
}
export function ArchivePage() {
  const [created, setCreated] = useState(false);
  const missing = ["查重报告", "其他附件"];
  return (
    <section className="def-page">
      <Title title="材料归档">
        <Badge tone="amber">归档完整度 85%</Badge>
        <button className="def-primary" onClick={() => setCreated(true)}>
          <FolderArchive size={15} />
          一键生成归档包（占位）
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
          已生成归档包预演状态（仅 Mock，未创建真实文件）。
        </div>
      )}
    </section>
  );
}
