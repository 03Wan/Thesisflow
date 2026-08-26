# PostMockRegressionMatrix

## STEP 02 — UI/data-boundary recovery (2026-08-26)

- Removed the `AppShell.awaitingRealDataRoutes` overlay: it no longer conceals route-level loading, empty, error, and ready states.
- Replaced the former 20 dormant/static domain pages, plus `/topic` and `/task-book`, with `WorkspacePage`. It reads project, file, task, workflow, and requirement stores only; empty projects render the full information architecture and a navigable, real entry CTA rather than generated business records.
- Restored reusable `ViewShell`, `PageHeader`, `SectionCard`, `DetailTabs`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, and retry actions. Template cards are explicitly marked `template` or `recommendation`; they are UI configuration, never user data or institutional requirements.
- `/requirements` now uses the existing candidate repository and review service to display, confirm, or reject real parsed candidates. No requirement extraction or projection algorithm changed.
- Deleted the former static page component sources from the production route graph. The production-bundle scan found none of the prior thesis/sample/score Mock strings (the command exits 1 when no match is found).
- `/teacher-review` remains a student-owned archival workspace for externally obtained assessment/defense conclusions. It does not invent a teacher score or turn a local click into an approval. `advisor_sessions` and external guidance records remain in scope.

The rows below are the STEP 01 baseline. Their `Critical` findings for the recovered routes are resolved only at the UI/data-boundary level; their domain-specific real write/read actions remain the next implementation phase.

## STEP 03 — acceptance comparison (2026-08-26)

| Scope | STEP 01 | Current result | Acceptance status |
|---|---|---|---|
| 20 formerly masked routes + `/topic` + `/task-book` | Global empty overlay hid a dormant static page or a hard-coded page | Shared route shell keeps header, tabs, toolbar, Loading / Empty / Ready / Error; no generated thesis, literature, score, task, or KPI | UI state **closed** |
| Fresh project | Could expose old static page state or a blank shell | Empty information architecture with a real navigation CTA; browser visual check captured | **closed** for shared shell |
| Ready state | Old page arrays/percentages supplied apparent data | Query-derived file/task/requirement/workflow counts only, and data-section slots stay explicitly ungenerated | **closed** for shared shell; domain detail views pending |
| Error/retry | Requirement loading error was not represented in its store; failures could be swallowed | Requirement store has `isLoading`/`error`; workspace waits for all current-project store IDs and renders retryable error | **closed** for shared shell |
| Project switching/deep links | Async loads could show an arbitrary fallback project | Workspace/requirements select the explicit active project; workspace blocks Ready until every store reports the same project ID | **closed** for recovered routes |
| Test doubles | `FakeProvider`, `FakeSecretStore`, `FakeDocumentParser` lived under production `src/` and fake provider was registered | Moved to `src/test/support`; production registry contains real adapters only; `test:production-boundary` is green | **closed** |
| Visual regression | None | Playwright visual checks captured `projects-empty.png`, `writing-empty.png`, and the post-create project overview `workspace-ready.png`; focused regression command added | **partial**: screenshots are artifacts, not yet CI-managed Electron tests |
| Restart / native persistence | No end-to-end restart proof | Repository/service tests pass; a real Tauri close/relaunch scenario is still absent | **open** |
| Delete / undo | Files/tasks have real delete paths but no uniform undo contract | No fake success state introduced; destructive actions remain owned by file/task/project pages | **open**: database/file consistency and undo need desktop E2E |

### Evidence generated in this pass

- Browser artifacts: `output/playwright/projects-empty.png`, `output/playwright/writing-empty.png`, `output/playwright/workspace-ready.png`.
- Regression command: `npm run test:regression` (workspace four-state, route state, project service, failure-path tests).
- Production boundary command: `npm run test:production-boundary` (forbidden business Mock data and test doubles in runtime `src/`).

## 口径

- `Skeleton`：该路由是否保留领域页面骨架。`缺` 表示被 `AppShell` 的统一 `DataEmptyState` 完全替换。
- `状态缺口`：E = empty，R = error，L = loading；`—` 表示该路由仅重定向。
- `真实 action`：必须写入/读取真实 store、repository、文件或明确的用户本地草稿；仅切换 React state、弹提示、导出硬编码内容不算。
- `静态数据`：纯字段/标签/格式配置不算；论文内容、项目状态、KPI、日期、文件、评分、结论、任务、统计算。
- “当前状态”同时记录 route 实际渲染与被遮罩的底层组件，防止把“看不见 Mock”误判成“已移除 Mock”。

## 路由矩阵

| Route | 原预期模块 | 当前状态 | Skeleton | 状态缺口 | 真实 action | 静态数组/硬编码统计 | 风险 |
|---|---|---|---|---|---|---|---|
| `/` | 入口 | 重定向 `/overview` | 不适用 | — | 是 | 否 | Low |
| `/overview` | 项目总览 | 真实 project/workflow/file/task/requirement 聚合；部分错误态分散 | 有 | R/L 部分 | 是 | 仅流程映射 | Medium |
| `/projects` | 项目初始化与管理 | Tauri 真实 CRUD，浏览器为显式 session fallback | 有 | 基本齐 | 是 | 否 | Low |
| `/requirements` | 论文要求与抽取核对 | 真实 requirements + pending candidates；requirement load 缺 error/loading；确认会投影下游 | 有 | R/L | 是 | 否 | High |
| `/topic` | 学生选题 | 项目标题真实，其余卡片/完成工作项由模板初始化并存 localStorage | 有 | R/L | 部分 | 是 | Critical |
| `/task-book` | 学生接收与执行记录 | 运行路径显示硬编码完成状态，并包含导师下达/专业学院审核产品语义 | 有 | E/R/L | 部分 | 是 | Critical |
| `/literature` | 文献库/检索/卡片 | 真实 workspace repository；部分追踪/批量/卡片 action 仅本地 UI 提示或有限实现 | 有 | 基本齐 | 部分 | 视图配置为主 | Medium |
| `/proposal` | 开题报告 | 按项目创建空字段并存 localStorage；要求模板硬编码；“提交教师审核”是本地状态 | 有 | R/L | 部分 | 配置 + 审核 gate | High |
| `/research-design` | 研究设计 | 空卡片 skeleton + localStorage/AI 建议；未接真实文稿、文献和数据 | 有 | R/L | 部分 | 字段配置 | High |
| `/guidance` | 学生归档外部指导记录 | 真实 CRUD，实体保留；需明确导师姓名/意见是外部来源、写入者仅为学生 | 有 | L 展示弱 | 是 | 否 | High |
| `/revisions` | 学生修改任务 | 真实 task CRUD；source type 含 advisor/review 等角色化来源 | 有 | L 展示弱 | 是 | 否 | High |
| `/files` | 文件中心与解析 | 真实 import/list/remove/open/local parse/AI-to-MD；浏览器明确降级 | 有 | 基本齐 | 是 | 否 | Medium |
| `/settings` | 本地设置/AI provider | 真实本地设置与 native secret boundary | 有 | R/L 部分 | 是 | provider 定义属配置 | Medium |
| `/translation` | 外文翻译 | route 被统一空态替换；底层组件仍含文件名、字数、版本、进度样本 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/midterm` | 中期检查 | route 被统一空态替换；底层含固定截止日、完成状态与统计 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/calendar` | 节点日历/时间线 | route 被统一空态替换；底层有固定日期、任务和 KPI，未接 workflow deadline | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/implementation` | 数据/调研 | route 被统一空态替换；底层含示例文件、变量、行数和 UI-only 分析 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/outline` | 论文大纲 | route 被统一空态替换；底层 chapterData 含进度、问题、证据、引用数 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/writing` | 正文写作 | route 被统一空态替换；底层 Tiptap 用固定论文正文、统计和 Mock action 初始化 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/compliance` | 全文质量检查 | route 被统一空态替换；底层 AI 直接评估 `revisionMock.audits` | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/advisor-review` | 引用核验 | route 被统一空态替换；底层使用固定引用、DOI、状态并可导出 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/reviewer-review` | 格式检查 | route 被统一空态替换；底层 formatItems 为固定检查结果 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/version-history` | 版本历史 | route 被统一空态替换；底层固定版本数组，恢复明确为占位 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/finalization` | 论文定稿 | route 被统一空态替换；底层固定 94% readiness，按钮“模拟已处理” | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/plagiarism` | 学生记录查重报告 | route 被统一空态替换；底层固定 23.7%、章节率和高风险段落 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/teacher-review` | 学生归档教师评阅/答辩结论 | route 被统一空态替换；底层有模拟教师评分与本地“同意答辩”，需替换为真实外部记录 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/sampling` | 学生抽检自检 | route 被统一空态替换；底层固定风险清单和 Mock gate | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/defense-prep` | 答辩准备 | route 被统一空态替换；底层固定论文讲稿、幻灯片与问题，虽可真实导出 | 缺 | E/R/L | 部分但输入假 | 是，bundle 中 | Critical |
| `/mock-defense` | 学生模拟答辩练习 | 业务名称可保留；route 被统一空态替换；底层录音真实但转写/建议为占位 | 缺 | E/R/L | 部分 | 固定题库/反馈 | High |
| `/defense` | 学生记录线下答辩 | route 被统一空态替换；底层固定老师、问答与记录 | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/post-defense-revision` | 答辩后修改任务 | route 被统一空态替换；底层固定修改项与 Mock 完成 gate | 缺 | E/R/L | 否 | 是，bundle 中 | Critical |
| `/final-manuscript` | 最终稿导出 | route 被统一空态替换；底层导出 action 未绑定真实 manuscript/version | 缺 | E/R/L | 部分但输入假 | 是，bundle 中 | Critical |
| `/archive` | 材料归档 | route 被统一空态替换；底层固定 17 项材料清单和打包行为 | 缺 | E/R/L | 部分但输入假 | 是，bundle 中 | Critical |
| `*` | 未知路由 | 重定向 `/overview`，无 Not Found 反馈 | 不适用 | E | 否 | 否 | Low |

## 受损路由汇总

### P0：统一空态导致功能完全不可用（20 条）

`/translation`、`/midterm`、`/calendar`、`/implementation`、`/outline`、`/writing`、`/compliance`、`/advisor-review`、`/reviewer-review`、`/version-history`、`/finalization`、`/plagiarism`、`/teacher-review`、`/sampling`、`/defense-prep`、`/mock-defense`、`/defense`、`/post-defense-revision`、`/final-manuscript`、`/archive`。

源码集合与上面清单均为 20 条（见 `AppShell.awaitingRealDataRoutes`）。`/teacher-review` 恢复为“外部评阅/答辩结论归档”页面 skeleton，不恢复模拟评分 UI。

### P0：仍在正式路径展示硬编码业务状态

- `/topic`
- `/task-book`

### P1：已有真实能力但边界不完整

- `/requirements`：解析候选、核对与投影闭环不完整。
- `/proposal`、`/research-design`：真实项目草稿存在，但要求/文稿/文献/数据未贯通。
- `/guidance`：真实 CRUD 保留，需明确为学生记录外部指导事实。
- `/revisions`：真实 CRUD，来源类型角色化。
- `/literature`：真实 repository，但部分 action 仍是 UI notice。
- `/overview`、`/files`、`/settings`：主体真实，补状态与端到端验证。

## Mock / fixture 分类

### 正式 bundle 或正式路由图：必须删除/隔离

- `src/features/revision/RevisionPages.tsx`: `revisionMock` 及 audits/tasks/guidance/citations。
- `src/features/writing/WritingPage.tsx`: 固定 outline、problemGroups、documentHtml、Mock action 文案。
- `src/features/work/DataOutlinePages.tsx`: 固定文件、变量、章节统计和 `仅 UI / Mock`。
- `src/features/final/FinalPages.tsx`: 查重率、教师评分、抽检 gate、模拟结论。
- `src/features/defense/DefensePages.tsx`: 固定论文主题、讲稿、问题、答辩记录与归档材料状态。
- `src/features/foundation/FoundationPages.tsx`: topic/task-book 运行时硬编码状态；translation/midterm/calendar 的 dormant 样本。
- `src/ai/providerRegistry.ts`: FakeProvider 定义和默认注册位于正式目录；当前 app bundle 未检出该字符串，但必须移入 test scope。
- `src/parsers/FakeDocumentParser.ts`、`src/ai/secretStore.ts` 的 FakeSecretStore、`src/ai/readonlyAdvisor.ts`：当前 app graph 未执行或仅被测试使用，仍未满足“测试替身只在 test scope”。
- `src-tauri/src/secret_store.rs` 的 FakeSecretStore 在 `#[cfg(test)]` 使用，但实现定义本身未加 cfg；应加 `#[cfg(test)]` 或迁移 test module。

### 允许的测试夹具

- `src/test/fixtures/**`：DOCX/PDF/sheets/text/literature fixtures。
- `scripts/generate-*-fixtures.mjs`：输出目标仅为 `src/test/fixtures/**`。
- `src/test/**/*.test.ts(x)` 与 `src/lib/defense-pptx.test.ts` 内的 `vi.mock`、fake transport、fixture builders。
- Rust `#[cfg(test)] mod tests` 内构造数据。

### 非业务误报

- `/mock-defense` 中 “mock” 是“模拟答辩”业务名称；允许 route 名，但不允许假问题/评分/反馈。
- HTML input `placeholder`、CSS class `*-placeholder` 是 UI 语义。
- Rust `crate-type = ["staticlib", ...]`、依赖 `lazy_static`/`jiff-static`。
- 文献字段 `sample` 表示论文样本，不是 sample data。
- 学校/论文来源原文中的教师称谓，只要保持为不可执行 source text，不视为系统角色。

## 要求驱动链路与错误传播

### 当前链路

1. `/files` 真实导入项目文件。
2. `ParseOrchestrator` 选择真实 parser、计算 hash、管理缓存/失败/取消。
3. `LocalParseStorage.persist` 保存 normalized document，并调用 `extractRuleCandidates` 生成 pending candidate。
4. `/requirements` 读取 candidate；本地学生点击“确认/拒绝”。
5. `RuleReviewService.confirm` 写 `thesis_rules` 和 audit log。
6. deadline key 投影到 `workflow_stages.deadline`；数值 key 投影到 `thesis_requirements.target_value`。
7. `/overview` 读取 requirements/workflow/tasks/files；后续 AI context 和各领域页理论上消费这些事实，但多数页面尚未接通。

### 错误如何进入下游

| 错误点 | 当前阻挡 | 仍可能污染 | 缺口 |
|---|---|---|---|
| parser 错字/断表/错误日期 | candidate 默认为 pending | 学生误确认后成为 active rule | 缺并排 source preview、置信度阈值与编辑确认 E2E |
| 同 key 不同值 | active rule 冲突检查 | 不同 condition、旧来源或未识别语义仍可并存 | 无 conflict UI；错误信息称“审核页” |
| 错 deadline | 仅确认后投影 | `workflow_stages.deadline` → overview/upcoming timeline | 只在原 deadline 为 null 时写入；无撤销/更正重放 |
| 错 numeric target | 仅确认后投影 | requirements KPI 与完成率 | currentValue 不由真实文稿/文献持续计算；可产生误导百分比 |
| reparse/source deletion | content hash 使旧 parse stale | 已激活 rule/requirement/deadline 仍保留 | 无 provenance invalidation / orphan cleanup |
| AI 转 Markdown | 先本地 parse，并要求真实 provider | 新 Markdown 文件可能被再次解析 | 需防止派生文件重复投影与 source lineage 循环 |

传播风险结论：当前人工核对边界是正确方向，但不是完整安全闭环。最危险的下游是时间线 deadline 和总览 KPI；写作、文献、数据页多数尚未消费这些值，当前更多表现为断链而非错误传播。

## 产品角色扫描

未发现：认证用户表、RBAC、教师登录入口、教师端路由组、远程协作 ACL。

必须删除或隔离的“模拟/系统 actor”实现：

- `/teacher-review` 中的模拟教师/评阅教师评分、模拟意见与本地点击即“同意答辩”的实现。保留 route、Sidebar 导航、页面和真实外部记录的展示/归档能力。
- `FoundationPages`/`ProposalDesignPage` 中可执行的“提交指导教师审核”“专业审核”gate；可保留为来源说明，不得成为系统状态机。
- `TaskSourceType = advisor/review` 等产品 actor 化命名，迁移为中性 `external_feedback`/`formal_notice` source。
- `AdvisorSessionsPage`、advisor store/service/repository、`advisor_sessions`、`advisor_name`：保留并固定为学生拥有的 external guidance record；导师姓名、意见、评分与答辩结论均为来源元数据，不能获得系统 actor 能力。
- `rule_audit_log.actor = local_user` 改为明确 `local_student`，并保持无其他 actor 值。

可保留但需注明 provenance：学校原文、材料清单或学生手工记录中的“导师/教师/老师/评阅教师”字符串；文献作者表的 `role=author` 与产品权限无关。

## 其他结构性发现

- `appRoutes` 并非 route 单一事实源，漏列 `/projects`、`/version-history`、`/plagiarism`，却被测试当成完整注册表使用。
- `RoutePlaceholder` 已定义但未使用。
- 当前 lint 不覆盖 `src/features/**/*.tsx`、`src/ai`、`src/parsers`、`src/rules`、tests 和 Rust，恰好漏掉多数 P0 证据。
- 路由壳测试验证“都在 AppShell 内”，没有验证被遮罩页面的领域 UI 或真实 action。
