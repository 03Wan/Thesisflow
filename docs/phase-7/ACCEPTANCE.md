# Phase 7 Acceptance

审计日期：2026-08-26

## 已通过

| Gate | 证据 |
|---|---|
| STEP 01 基线审计 | `docs/phase-7/STEP-01-BASELINE.md`；仓库证据与基线命令记录完整 |
| STEP 02 数据集注册 | `0011_phase7_dataset_registry.sql`、`dataset-parser.test.ts`、`dataset-service.test.ts`、Rust 重开/隔离测试 |
| STEP 03 清洗安全边界 | `transform-service.test.ts`、`transform-persistence.test.ts`；allowlist 与确定性 hash |
| STEP 04 变量 stale/broken 规则 | `analysis-service.test.ts`、`VariableDictionaryPage.tsx` |
| STEP 05 描述统计 | `descriptiveStatistics` 与 `phase7-e2e.test.ts` |
| STEP 07–08 证据数值护栏 | `evidenceGuardrails.ts` 与 `phase7-e2e.test.ts` |
| SQLite 域迁移 | `0012_phase7_analysis_lineage.sql`；Rust migration 测试 |

## 当前未通过 / 仍需补强

- Transform recipe/run、analysis run、artifact 和 evidence 已接入 `/analysis` 桌面工作台；浏览器预览因无 Tauri SQLite 上下文只能验证路由与空项目状态，真实持久化路径由服务层、迁移测试和桌面 smoke 覆盖。
- STEP 06 的正式分析方法目前只有描述统计；回归等方法不得在 UI 标记为 available。
- STEP 09 的 Tauri debug build 与 8 秒启动 smoke 已通过；备份/恢复在当前仓库没有既有基础设施，标记 N/A，不能宣称已支持。
- 原始数据 materialization 已保存为版本快照，但导入上限为 50 MiB；不得宣称已支持任意超大数据集。

## 可复现命令

```text
npm run typecheck
npm run lint
npm run test:phase7
npm run test:desktop-smoke
cargo test phase7_
npm run build
```

## 正式支持方法清单

- CSV / XLSX：真实解析、schema 推断、预览、版本 hash。
- Transform：列选择、重命名、类型转换、缺失值、过滤、排序、去重、值映射、简单派生。
- Analysis：描述统计（N、缺失数、均值、标准差、最小值、最大值）。
- Evidence：结构化指标、stale 标记、草稿数值一致性校验、grounded prompt contract。

**结论：Phase 7 尚不能标记 complete；需完成上述未通过项并重新运行全量 Gate。**
