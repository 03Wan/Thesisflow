# ThesisFlow Phase 9 Acceptance

日期：2026-08-26
范围：学生自检、引用/来源核验、实证证据一致性、结构自检、导出提醒、Issue Center、Final Freeze / Release Candidate。

## 交付结果

| Gate | 结果 | 证据 |
| --- | --- | --- |
| 统一检查语义 | PASS | `src/types/phase9.ts` 定义 `PASS / FAIL / REVIEW / UNSUPPORTED`，未知不会默认通过 |
| Confirmed requirement coverage | PASS | `runPhase9Checks` 按正式 requirement 生成 observed / expected / evidence |
| 引用与来源核验 | PASS | citation record 与当前 literature ID 交叉核验，孤儿引用为 blocking FAIL |
| 实证一致性 | PASS | evidence link 的 stale 状态产生 high issue；未绑定统计表述只生成 REVIEW |
| 逻辑自检 | PASS | 确定性结构问题与启发式 REVIEW 分层，未引入质量总分 |
| Issue Center | PASS | fingerprint 合并；已忽略问题保留 dismissed 风险；重检后消失的问题变为 stale |
| Final Freeze | PASS | RC 记录 revision、requirement/citation/evidence/QA/export hash 与 backup snapshot |
| 黑盒回归 | PASS | `src/test/phase9-service.test.ts` 4/4 |

## 黑盒场景

已覆盖：

1. 自然语言 requirement 显示 REVIEW；没有可靠导出能力时显示 UNSUPPORTED。
2. 删除文献后 citation 变为 FAIL；evidence stale 后产生高优先级问题。
3. 既有 dismissed issue 在重检后保留；消失的 issue 标记 stale，避免重复轰炸。
4. 有 manualCheck 的导出 manifest 必须由学生确认后才能创建 Ready RC。
5. RC 使用 hash 和深拷贝 backup，后续正文版本不会覆盖旧快照。

## 运行证据

```text
npm run typecheck                         PASS
npm run lint                              PASS
npm test                                  PASS (34 files / 90 tests)
npm run build                             PASS
npm run test:production-boundary          PASS
npm run test:desktop-smoke                PASS (Tauri alive for 8 seconds)
npm test -- --run src/test/phase9-service.test.ts   PASS (4 tests)
```

Phase 9 页面入口：`/finalization`，导航文案为“论文定稿 · Phase 9”。页面不提供教师审核、导师审批、签字或协作状态。
