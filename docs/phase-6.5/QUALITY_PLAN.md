# Phase 6.5 Quality Plan

## STEP 02 status (2026-08-26)

Step 4 is now partially complete: shared page-state components are in place and the de-Mock-affected routes have page-level Loading / Empty / Ready / Error coverage through the common workspace shell. Step 2 test-double isolation is also complete for the identified TypeScript runtime doubles. The next dependency is real domain actions and the projection invalidation work in Steps 5–7. This recovery intentionally does not create user facts, alter requirement parsing, or recreate a teacher actor/approval flow.

## STEP 03 remaining limitations

1. The recovered domain routes deliberately expose data-bound shells, not reconstructed fake editors/checkers. Per-domain data views and mutations must be implemented only after their repository contracts are available.
2. The focused regression suite runs in jsdom. Playwright screenshots validate the browser preview, but the CLI context is not persistent across invocations and cannot prove a Tauri application restart.
3. The project still lacks a CI-managed `test:desktop-smoke` that creates a real project, imports/parses a real fixture, relaunches Tauri, verifies project isolation, and proves delete/undo filesystem/database consistency.
4. Existing React `act` warnings, PDF standard-font warnings, and bundle-size warnings are non-blocking but remain quality debt.

## 1. 优先级

### P0 — 阻止发布

1. 正式 bundle 仍含并引用 Mock 业务组件与字符串。
2. `/topic`、`/task-book` 可显示硬编码完成状态；这是未被全局空态拦截的正式路径。
3. 20 条路由只有统一空状态，没有页面 skeleton、真实 action 与页面级 loading/error。
4. `/teacher-review` 的模拟评分和“本地点击即同意答辩”会伪造外部教师结论；须改为学生归档真实外部记录。
5. `revisionMock`、写作样稿、数据样本、查重率、评分、答辩记录等不得进入正式源码图。
6. 解析投影缺少撤销/重放/来源失效闭环；错误确认可污染 requirements、overview 与 timeline。

### P1 — P0 后立即完成

1. 保留 `advisor_sessions`，明确其为学生拥有的外部指导记录；消除系统导师 actor 语义，不删除已有记录。
2. 补齐文献、要求、项目、文件、任务的页面级 loading/empty/error/retry 测试。
3. 合并路由单一事实源，修复 `appRoutes` 漏掉 `/projects`、`/version-history`、`/plagiarism` 的漂移。
4. 扩大 lint 到 TS/TSX、AI、parser、rules、features、tests；Rust 增加 fmt/clippy。
5. 增加独立 integration 和 desktop smoke scripts。

### P2 — 稳定性与性能

1. 清理 PDF font warning 与 React `act` warning。
2. 拆分主 bundle；建立 bundle size budget。
3. 为解析并发、缓存失效、超大文件、OCR 待办和 AI 失败建立可观测指标。

## 2. 后续 8 步依赖

| 步骤 | 工作 | 依赖 | 完成判据 |
|---:|---|---|---|
| 1 | 冻结正式数据边界与 route inventory | 本 ADR | 所有 route、store、repository、projection owner 有清单；禁止新增 actor |
| 2 | 隔离 test doubles 与 mock source | 1 | Fake Provider/Parser/SecretStore/revision fixtures 只在 test scope；bundle 扫描为零 |
| 3 | 重塑并保留外部指导/评阅/答辩结论记录 | 1 | `/teacher-review`、`advisor_sessions` 和导航保留；无 RBAC/审批 action；评分和结论均有真实来源与学生录入 provenance |
| 4 | 建立每路由真实 skeleton 和四态 | 2、3 | 移除 `awaitingRealDataRoutes` 全局遮罩；每页 loading/empty/error/ready 有测试 |
| 5 | 接通项目初始化、文件解析、规则核对 | 4 | 空项目不生成事实；解析候选有 provenance；学生核对是唯一激活入口 |
| 6 | 实现投影撤销/重放与下游失效 | 5 | rule 变更会一致更新 requirement/timeline/overview；删除来源无孤儿数据 |
| 7 | 逐域接入真实 action | 4、6 | 顺序：要求/时间线 → 写作/大纲 → 文献 → 数据 → 定稿/答辩/归档；无静态 KPI |
| 8 | 建立 CI/release gate 并执行全量回归 | 2–7 | typecheck、全量 lint、unit、integration、build、bundle scan、desktop smoke 全绿 |

不得并行绕过的依赖：第 7 步不能在第 6 步前把解析结果用于下游；第 4 步不能通过恢复旧数组来“补 UI”；第 3 步不能仅隐藏模拟操作，必须把保留的记录能力接到真实来源数据。

## 3. 目标测试矩阵

| 层 | 必测项 | 当前 | 目标门禁 |
|---|---|---|---|
| Static | TypeScript project references | PASS | 每 PR 必过 |
| Lint | TS/TSX + Rust fmt/clippy | PARTIAL | 0 error；正式目录不得命中 mock allowlist 外关键词 |
| Unit | parser、rule extractor、projection、store | PASS/PARTIAL | 加入撤销、重放、来源删除、跨项目隔离 |
| Component | 每 route 四态与真实 action | MAJOR GAP | 每条主要 route 至少 loading/empty/error/ready |
| Integration | file → parse → candidate → verify → projection | 无独立 script | 独立 `test:integration`，使用临时 DB/真实小文件 fixture |
| Security/domain | 单学生 actor、无角色/审批 | GAP | schema/API/UI 静态扫描 + 行为测试 |
| Build | Vite production | PASS with warnings | bundle budget + forbidden-string scan |
| Desktop | Tauri build/launch/database migration | PARTIAL | 独立 `test:desktop-smoke`，新旧 DB、CRUD、解析、重启持久化 |
| Provider | real opt-in smoke | SKIPPED | 非阻断 nightly；无凭据时明确 skip |

## 4. 建议新增脚本（计划，不在本阶段实施）

```json
{
  "lint": "eslint src --max-warnings=0",
  "test:unit": "vitest run --project unit",
  "test:integration": "vitest run --project integration",
  "test:bundle-policy": "node scripts/assert-production-boundaries.mjs",
  "test:desktop-smoke": "node scripts/desktop-smoke.mjs",
  "quality": "npm run typecheck && npm run lint && npm run test:unit && npm run test:integration && npm run build && npm run test:bundle-policy && npm run test:desktop-smoke"
}
```

## 5. 关键场景

### 项目初始化

- 新项目只产生空目录、项目元数据、19 个未完成/首阶段进行中的结构行。
- 失败时目录与 DB 事务一致回滚。
- 首次进入所有页面不出现学生未输入的论文题目、数据、进度、统计、教师意见或分数。

### 要求/解析/时间线

- 正常、损坏、空文本层、unsupported、needs OCR、取消、缓存命中、reparse。
- 抽取错误停在 pending candidate；未核对不能进入 requirement/deadline。
- 核对后 source locator 可打开；编辑确认留 audit；冲突不覆盖旧规则。
- reparse、source delete、rule revoke 后投影撤销；overview 与 timeline 同步。

### 写作/文献/数据

- 写作从真实 manuscript/document 读取；空文稿只显示编辑 skeleton。
- AI 输出未核验不得变成论文正文、引用事实或任务。
- 文献统计只由真实 repository 计算；无全文时禁用全文 action 并说明原因。
- 数据页只显示真实导入文件与解析 schema；不展示 `panel_data.dta` 等样本。

### 单学生主体

- 数据库与 API 无用户角色、教师审批状态或跨用户权限。
- 外部指导/评阅/通知只作为学生录入的 source record；actor 固定为 local student。
- 来源原文中的“导师/教师/老师”不触发误报，但 UI action、route、schema identifier 必须通过审计。

## 6. Exit criteria

- `REGRESSION_MATRIX.md` 中无 Critical/High 未处置项。
- production bundle forbidden strings 为零（业务名称“模拟答辩”单独 allowlist）。
- 所有主要路由均有可见 skeleton 与四态，不使用全局空态掩盖组件。
- 无教师/导师/审核人系统角色、教师端、审批流或协作权限。
- 全量质量命令在干净 checkout 和升级前数据库副本上各执行一次并通过。
