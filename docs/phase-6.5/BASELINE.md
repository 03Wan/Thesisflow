# Phase 6.5 Post-Mock 基线

> 冻结时间：2026-08-26 12:34:55 +08:00。本文是审计快照，不表示当前工作树可发布。

## 1. 范围与硬约束

- 唯一业务主体：学生。
- 不新增教师、导师、审核人角色，不建设教师端、审批流或师生协作权限。
- 测试夹具可以存在，但必须仅在 test scope；正式构建不得注册或展示假业务数据。
- 本阶段仅审计、冻结基线、建立测试矩阵和修复计划，没有恢复假数据，也没有重写 UI。

## 2. Git baseline

| 项 | 值 |
|---|---|
| Repository | `D:\桌面\项目\21` |
| Branch | `main` |
| HEAD / origin/main | `61d12ee3f4af55078743b316b5e83adf0f9d5fa1` / 同一提交 |
| Short SHA | `61d12ee` |
| Commit time | `2026-08-25T20:46:06+08:00` |
| Commit subject | `feat: add workbench tagline to sidebar brand` |
| Worktree | 审计开始前已 dirty；7 个 tracked 文件、8 insertions / 8 deletions |

审计开始前已有改动，本次未覆盖：

```text
README.en.md
README.md
package-lock.json
package.json
src-tauri/Cargo.lock
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
```

本阶段新增文件仅为 `docs/phase-6.5/*.md`。`dist/`、`src-tauri/target/` 与桌面 smoke 生成的 debug 数据库属于忽略的构建/运行产物。

## 3. 工具链

| 工具 | 版本 |
|---|---|
| OS | Windows NT 10.0.26200.0 |
| PowerShell | 7.6.4 |
| Node.js | v24.14.0 |
| npm | 11.9.0 |
| TypeScript | 5.6.3 |
| Rust | rustc 1.98.0 |
| Cargo | 1.98.0 |
| Git | 2.52.0.windows.1 |

## 4. 实际测试结果

| 检查 | 项目现有入口 / 审计命令 | 结果 | 时间 | 备注 |
|---|---|---:|---:|---|
| Typecheck | `npm run typecheck` | PASS | 9.41s | exit 0 |
| Lint | `npm run lint` | PASS | 4.20s | 仅覆盖 `src/{lib,repositories,services,stores,types}/**/*.ts` |
| Unit + component/service integration | `npm test` | PASS | 34.90s | 37 files passed、1 skipped；145 tests passed、2 skipped |
| Dedicated integration script | 无 | NOT AVAILABLE | — | `package.json` 没有 `integration` script；不能把混合 Vitest 套件冒充独立 integration gate |
| Web production build | `npm run build` | PASS | 31.39s | 2607 modules；主 JS 2,688.67 kB、gzip 862.49 kB；有 >500 kB 警告 |
| Rust unit/migration tests | `cargo test --manifest-path src-tauri/Cargo.toml` | PASS | 73.98s | 9 passed |
| Desktop compile smoke | `npm run tauri -- build --debug --no-bundle` | PASS | 69.63s | 产出 `src-tauri/target/debug/thesisflow.exe` |
| Desktop launch smoke | 启动 debug exe，观察 8 秒后终止 | PASS (partial) | 8s | 进程保持存活并创建 SQLite；未覆盖窗口交互、路由点击和端到端业务 |

非失败告警：

- PDF 测试提示未配置 `standardFontDataUrl`。
- `app-shell` 与 `overview-page` 测试存在 React `act(...)` 告警。
- 2 个真实 Provider smoke 因缺少 opt-in 环境/凭据而跳过。
- Vite 报告 Tauri core 静态/动态混合导入和大 chunk。
- Rust 链接器输出 import library 信息，被编译器记录为一条 linker warning。

## 5. 基线结论

当前基线是“核心存储、解析、项目 CRUD 可编译且测试通过”，不是“Post-Mock 完成”：

1. `AppShell` 用统一 `DataEmptyState` 屏蔽了 19 条尚未接入真实数据的路由；用户看不到旧 Mock，但对应 UI skeleton、真实 action 和页面级状态也一起消失。
2. 被屏蔽组件仍被正式路由 import，并进入 production bundle。构建产物可检出 `数据研究 mock`、`Mock 编辑上下文`、`仅 Mock`、`历史 Mock 结果`、`模拟得分`。
3. `/topic`、`/task-book` 未被屏蔽，仍由硬编码卡片状态/工作项初始化；它们会在正式路由显示非来源驱动状态。
4. `/compliance`、`/advisor-review`、`/version-history` 等底层组件共享 `revisionMock`；虽被路由屏蔽，仍属正式源码与构建依赖。
5. `/teacher-review`、`/guidance`、`advisor_sessions`、`advisor_name` 等形成教师/导师相关业务语义。没有发现登录角色、RBAC 或教师端；这些实体保留为学生归档外部指导、评阅和答辩结论的能力，但当前模拟数据/模拟操作必须替换为真实来源记录。
6. 文件解析到要求的链路有来源与人工确认边界，但确认后的错误可写入 `thesis_rules`、要求统计和时间线 deadline；目前缺少端到端回滚、冲突处理 UI 和下游失效测试。

发布判定：**NO-GO**，直至 `QUALITY_PLAN.md` 的 P0 门禁通过。
