# Phase 10 Route Inventory

审计日期：2026-08-26。学生是唯一产品主体；学校原文中的教师/导师/评阅者仅作为外部来源文本，不产生系统角色或审批流。

| Route | State | Boundary |
|---|---|---|
| `/projects` | supported | 项目创建、切换、归档，项目隔离 |
| `/requirements` | supported | 原文解析 → candidate → 学生确认 |
| `/literature` | supported | 本地文献元数据、笔记与证据链 |
| `/data` | supported | 数据导入、变量/transform、正式分析与 artifact |
| `/writing` | supported | 多章节正文、citation、evidence、AI proposal、DOCX export |
| `/finalization` | supported | Phase 9 checks、Final RC、导出与快照 |
| `/defense-prep`, `/mock-defense`, `/defense` | limited | Phase 10 domain service 已支持来源可追溯素材与学生练习；现有旧页面不作为可靠数据源，录音/真实评委预测不支持 |
| `/archive` | limited | Phase 10 manifest/verify/recovery service 已支持；桌面 UI 的完整 archive picker/import 尚未宣称 supported |
| `/teacher-review`, `/advisor-review`, `/reviewer-review` | disabled | 仅保留外部材料归档语义；无教师账号、审批、评分或协作写入 |

`supported` 表示已有真实持久化链路并有测试；`limited` 表示能力存在但交付边界显式受限；`disabled` 不提供伪成功操作。
