# Phase 3 三江学院真实资料验收报告

- 验收日期：2026-08-24
- 原件：`product-reference/2026届法商学院本科毕业论文工作细则（20251118）.doc`
- 原件 SHA/内容处理：原件保持不变；使用 `word-extractor` 仅作验收文本读取，不进入生产 parser/service。
- 结论：**未通过端到端验收；不可作为 Phase 3 完成依据。**

## Legacy import

| Expected | Extracted | Locator | Condition | Status | PASS/FAIL | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 原 `.doc` 保留并安全降级 | 本机未发现 LibreOffice/antiword/catdoc | 原文件路径 | 无 | `unsupported` | PASS | 生产 adapter 未打包 Office，提示另存 DOCX/PDF。 |
| 内容等价 DOCX/PDF 回归 | 尚未生成 | — | — | — | FAIL | 真实内容已用验收工具读取，但尚未生成并导入等价 fixture。 |

## 已从原件读取并人工核对的关键事实

| Expected | Extracted | Locator | Condition | Status | PASS/FAIL | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 正文约 10000 汉字 | 原文含“正文字数为一万汉字左右” | 第七条/内容要求 | 普通学生 | pending | PARTIAL | 当前 extractor 可识别正文近似值；同 block 多条件仍不完整。 |
| 藏族正文 ≥6000 | 原文含“藏族学生…不少于六千汉字” | 第七条/内容要求 | 藏族学生 | pending | PARTIAL | 条件结构可表达，尚未真实 candidate 持久化。 |
| 文献≥20、外文≥2、期刊≥18 | 原文完整包含三项 | 第七条/内容要求 | 无 | pending | FAIL | 现有 deterministic extractor 未覆盖同段三项独立数值。 |
| 中文/英文摘要与藏族例外 | 原文完整包含 | 第七条/内容要求 | 藏族学生 | pending | FAIL | 尚未实现对应 extractor。 |
| 指导≥6 | 原文“不得少于6次” | 指导过程阶段 | 无 | pending | PARTIAL | 可识别数量，尚未落库。 |
| 复制比/AIGC ≤30%，藏族≤40% | 原文完整包含 | 第四条/第十七条 | 藏族学生 | pending | PARTIAL | 基础百分比可识别；AIGC 与双条件持久化待补。 |
| 翻译例外及 1万/3000 | 原文完整包含 | 第七条/内容要求 | 知识产权、电子商务及法律、藏族学生例外 | pending | FAIL | 例外为复合 `not_in` 条件，尚未实现。 |
| 答辩 5–10/问题≥3/准备≥10/回答≤10 | 原文完整包含 | 第十七条/答辩流程 | 无 | pending | FAIL | 当前仅覆盖 presentation range。 |
| 所列日期与两批答辩 | 原文进度表完整包含 | 第六条/工作进度计划 | 第一/第二批 | pending | FAIL | parser 尚未保留真实表格上下文，deadline mapper 未覆盖全部 key/batch。 |

## UI review / confirm / apply

| Expected | Extracted | Locator | Condition | Status | PASS/FAIL | Notes |
| --- | --- | --- | --- | --- | --- |
| UI review 与 source viewer | 未执行 | — | — | — | FAIL | Rule review UI/repository 尚未实现。 |
| confirm → thesis_rules/audit | 未执行 | — | — | — | FAIL | 不允许手工伪造确认。 |
| Requirements/Workflow apply | 未执行 | — | — | — | FAIL | 不允许 pending deadline 修改 workflow。 |

## Required remediation before rerun

1. 生成真实内容等价的 DOCX/PDF fixture，并以 production parsers 导入/解析。
2. 扩展 deterministic extractor：多值同段、摘要、翻译复合例外、答辩问题/准备/回答、全部 deadline 与 batch。
3. 实现候选持久化、review/confirm/audit/conflict/version 与 source viewer。
4. 仅在确认规则后更新 Requirements/Workflow，再重跑本报告的每一行。
