# Phase 7 · STEP 01 基线审计

审计日期：2026-08-26
范围：仅核对当前仓库已存在且可由代码或测试证明的能力；本步骤不新增数据分析功能。

## 结论

项目已具备可复用的本地数据基础设施，但尚未具备 Phase 7 所需的“数据集版本 → 变换 → 变量 → 分析运行 → 证据”闭环。后续实现应扩展现有的 SQLite、`project_files`、本地文件存储、解析编排器和项目隔离模式；不得把文档解析结果或 UI 占位展示认定为统计分析能力。

## 已有能力（有仓库证据）

| 能力 | 证据 | Phase 7 复用方式 |
|---|---|---|
| 本地持久化与项目隔离 | `src-tauri/migrations/0001_core_entities.sql`：`thesis_projects`、`project_files` 及 `project_id` 外键/索引 | 新领域表一律带 `project_id`，查询以其为边界。 |
| 本地文件导入与项目目录存储 | `src-tauri/src/lib.rs`：`import_project_file` | 原始数据文件继续经该受控路径导入；后续要补 SHA-256、不可变快照与数据集语义。 |
| CSV / XLSX 本地解析 | `src/parsers/SpreadsheetParsers.ts`；`src/test/spreadsheet-parser.test.ts` | 可复用 SheetJS 与 CSV 解码逻辑来建立真实 dataset preview/schema。 |
| 解析 hash、缓存与失败状态 | `src/services/parseOrchestrator.ts` | 可复用 SHA-256 实现、取消控制器、并发槽与 stale 状态模式；不能直接把 `DocumentParse` 当作 dataset version。 |
| 任务/作业先例 | `literature_import_jobs` 和 `literature_import_job_items` 迁移 | 长时 transform / analysis 可沿用“状态、错误、日志、可重试”的持久化模式。 |
| 研究设计与确认需求 | `src/features/research/ProposalDesignPage.tsx`、`src/services/requirementService.ts` | 变量映射只建立引用，不复制第二套研究设计事实。 |

## 当前不支持（不得在 UI 标为可用）

| 缺口 | 审计依据 | 风险 / 后续落点 |
|---|---|---|
| Dataset / dataset_version 领域模型 | 现有迁移、`src/types/domain.ts`、repositories 中均无对应实体 | STEP 02 新增版本、hash、schema、行列计数及项目隔离。 |
| 原始数据不可变保证 | `project_files.checksum` 存在但原生导入当前返回 `checksum: None` | STEP 02 必须在真实读取成功后计算 SHA-256 并保存快照语义。 |
| 数据预览与全量统计边界 | 表格解析器输出的是文档块；无 dataset preview / profile 服务 | STEP 02–05 分别建立预览、schema 与真实统计执行器。 |
| Transform recipe / lineage | 无 transform 表、服务、测试或 UI | STEP 03 新建派生版本，不原地改 raw。 |
| 变量字典与版本失效检测 | 无 variable definition / stale mapping 模型 | STEP 04 建立显式映射与 stale/broken 状态。 |
| 描述统计、诊断、模型执行 | 无统计引擎、analysis spec/run 或数值回归测试 | STEP 05–06 只对真实实现且有测试的方法显示“可用”。 |
| Result artifact / evidence block | 无 artifact、evidence 或引用完整性模型 | STEP 07 建立结构化结果和上游 stale 传播。 |
| AI 数值护栏 | AI 基础设施存在，但没有 evidence-scoped 数值校验 contract | STEP 08 仅允许基于真实 evidence 的解释。 |

## 已发现的风险

1. `XlsxParser` 和 `CsvParser` 的职责是“文档内容归一化”，不是数据集版本管理或统计计算；复用解析器时需在独立数据域中明确 header、类型、缺失值和预览边界。
2. `project_files` 已接受数据类别和表格文件扩展名，但原生导入尚未写入 checksum；将其直接用作数据可追溯性会产生伪 hash/伪版本风险。
3. 解析编排器的 `stale` 仅覆盖重解析文档，不能替代 transform、变量、结果和 evidence 的 lineage invalidation。
4. 当前测试基线通过，但没有覆盖任一真实统计方法、数据集版本持久化或项目级分析隔离；Phase 7 测试必须新增这些覆盖。
5. `npm run test` 通过时会输出既有 React `act(...)` 警告；这不阻断本次基线，但应在后续 UI 测试调整时避免把新警告混入。

## 架构决策

1. 在现有 SQLite migration 链中新增 Phase 7 表，沿用 repository → service → store → UI 分层。
2. 将原始文件保留为 `project_files` 的受控存储对象；`datasets` / `dataset_versions` 只引用该对象和不可变解析快照。
3. 将 parsing、transform、analysis 均建模为可失败、可记录日志、可取消（在既有能力允许时）的运行；只有真实完成的 run 能生成结果。
4. 以版本/输入 hash 和显式引用实现 stale 传播；绝不静默重写历史结果或 evidence。
5. AI 只能消费选定的、结构化的真实 evidence，不能写入统计数值或正式论文正文。

## 可复现基线

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS：25 files / 71 tests；有既有 React `act(...)` 警告与 PDF fixture 警告。 |
| `npm run build` | PASS；有既有大 chunk 警告。 |

## STEP 01 Gate

- [x] 现有能力与缺口有 repo 证据
- [x] 当前支持格式/执行器来自实际代码而非猜测
- [x] 已将假计算/静态统计/结果追溯风险列入矩阵
- [x] 架构明确复用既有基础设施
- [x] 基线测试结果可复现
- [x] 未新增任何虚假分析功能

**Gate：PASS。下一步：STEP 02（Dataset Registry + Immutable Raw Data）。**
