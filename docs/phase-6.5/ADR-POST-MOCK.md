# ADR: Post-Mock 正式运行边界

- 状态：Accepted for Phase 6.5 remediation
- 日期：2026-08-26
- 决策范围：正式运行数据、学生单主体、解析结果进入下游的边界

## 背景

仓库已经用 `AppShell.awaitingRealDataRoutes` 将 19 条路由替换为统一空状态，但旧页面组件仍被正式路由引用并进入 bundle；部分未屏蔽页面仍用硬编码状态初始化。与此同时，代码保留教师评阅页、导师指导实体和“提交教师审核”等产品化语义，与学生唯一主体约束冲突。

## 决策

### D1. 正式构建不得依赖测试替身

- fake provider、fake parser、fake secret store、共享 revision mock 和任何业务 fixture 必须移动到 `src/test/**` 或显式 test-only package。
- 仅“模拟答辩”作为学生练习业务名称可以保留；其问题、反馈、讲稿与评分不能来自硬编码业务样本。
- CSS class、HTML `placeholder` 属性、Rust `staticlib`、第三方依赖中的 `static` 不作为假业务数据。
- 仅未被 import 还不够；production source graph、bundle 字符串扫描和路由行为都必须通过门禁。

### D2. 唯一 actor 是本地学生

- 不建立 `teacher/advisor/reviewer/supervisor` 登录身份、权限、收件箱、审批状态或协作写入。
- 学校原文中的“指导教师”“评阅教师”可以作为不可执行的来源文本保留，并附 source locator。
- 学生可以记录外部沟通事实，保留 `advisor_sessions`、教师评分和答辩资格结论；所有 CRUD actor 均为 `local_student`，教师/导师只作为外部来源姓名、评分主体或通知来源，不能登录、写入或在系统内执行确认。
- 保留 `/teacher-review` 路由，重塑为“教师评阅记录”：展示学生录入或导入的正式评分、意见和来源文件；禁止生成模拟教师分数、模拟意见或虚构结论。
- “同意答辩”保留为可追溯的线下结论记录，字段至少包括结论、记录时间、来源文件/来源说明和学生录入时间；移除会把本地点击伪装成教师决定的按钮。`提交审核`、`专业审批`同理只可记录线下提交/收到通知，不能成为系统审批流。

### D3. 空数据优先，保留页面骨架

- 无真实记录时显示对应页面 skeleton + scoped empty state，而不是全局拦截并隐藏整个页面。
- 每条业务路由必须有 loading、empty、error、ready 四态；有写操作的页面增加 submitting/success/retry。
- 不用静态数组填充 KPI、进度、日期、评分、文件、文献、数据集、章节完成度或检查结论。
- 纯配置项允许静态存在：字段定义、支持格式、状态标签、官方流程 key；官方日期只有在具备可追溯来源或用户确认后才可成为项目 deadline。

### D4. 解析结果不能直接成为事实

正式链路冻结为：

```text
project file
  -> parser result + warnings + source locator
  -> rule candidate (pending)
  -> 学生核对/编辑/拒绝
  -> active thesis rule + audit log
  -> projection
       -> thesis requirement target
       -> workflow deadline
       -> overview / timeline / downstream prompts
```

- `LocalParseStorage.persist` 可以生成 pending candidate，但不得直接改项目要求或时间线。
- “确认”是学生对机器抽取的事实核对，不是教师/审核人审批；UI 与代码术语统一为 `verify` / `accept_extraction`。
- 投影必须可重放、可撤销、可追踪到 `sourceFileId + parseId + locator + rule version`。
- 当文件重新解析、候选被 supersede、来源被删除或规则被撤销时，所有投影必须失效或重新计算，禁止留下孤立 deadline/KPI。
- AI 只能提供建议，不能绕过学生核对生成规则、任务、文献事实或论文结论。

### D5. 项目初始化只创建空容器

- `create_local_project` 可创建项目目录、项目元数据和空的 workflow stage rows。
- 初始化不得创建论文文本、文献、统计、成绩、教师意见、数据文件、答辩记录或“已完成”状态。
- workflow 定义是结构配置，不是完成事实；deadline 初始为 null，只有经来源确认后投影。
- Browser preview 的 localStorage fallback 必须遵守同一语义，不制造“当前项目”或完成状态作为业务记录。

## 当前偏差

| 偏差 | 证据 | 决策 |
|---|---|---|
| 19 路由被统一空状态完全替换 | `src/components/layout/AppShell.tsx` | 恢复各页真实 skeleton，不恢复样本数据 |
| Production bundle 含 Mock 文案 | `dist/assets/index-*.js` 扫描 | P0 删除正式依赖与静态业务样本 |
| active fake provider 注册代码位于正式目录 | `src/ai/providerRegistry.ts` | 将 fake 实现迁至 test scope；正式 registry 仅注册真实 adapter |
| `FakeDocumentParser`、TS/Rust FakeSecretStore 位于正式目录 | `src/parsers`、`src/ai`、`src-tauri/src` | test implementation 与 production interface 分离 |
| `revisionMock` 驱动质量/引用/版本页 | `src/features/revision/RevisionPages.tsx` | 真实 repository + 空状态；未接入前不渲染结论 |
| 教师评分与答辩结论模拟 | `/teacher-review`、`FinalPages.tsx` | 保留路由和记录能力，改为真实外部结果的学生归档；禁止模拟数据/模拟按钮 |
| 导师实体/表/repository | `advisor_sessions` 全链路 | 保留，并明确为学生拥有的外部指导记录；导师姓名/意见是来源元数据，不是系统角色 |
| 解析确认会投影 deadline/requirements | `ruleReviewService.ts` | 保留学生核对边界，补撤销/重放/失效与 E2E |

## 后果

- 短期内多个页面会保持真实空状态，但路由结构、操作入口和状态边界必须可测试。
- 数据模型迁移必须兼容已有本地记录；不得用删除数据库或重置项目作为修复手段。
- 对原文中的教师称谓进行数据与 UI 分层：来源文本可见，产品 actor 不存在。
- 所有修复按依赖顺序执行，详见 `QUALITY_PLAN.md`。
