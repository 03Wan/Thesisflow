# Phase 3 三江学院真实资料验收报告 — 复审

- 验收日期：2026-08-24
- 原件：`product-reference/2026届法商学院本科毕业论文工作细则（20251118）.doc`
- 原件处理：文件保持不变；`word-extractor` 只用于自动化验收读取，不进入生产 parser/service
- 结论：**真实内容 deterministic extraction PASS；legacy `.doc` 生产导入仍遵守“本机转换器或安全降级”边界。**

## 自动化结果

`phase3-sanjiang-real-fixture.test.ts` 直接读取上述原件并断言以下标签：

| Requirement | Expected | Result |
| --- | --- | --- |
| 正文一般要求 | 约 10,000 汉字 | PASS |
| 藏族正文 | 不少于 6,000 汉字，独立条件 | PASS |
| 文献总数 | ≥20 | PASS |
| 外文文献 | ≥2 | PASS |
| 期刊文献 | ≥18 | PASS |
| 中文摘要 | 约 300 字 | PASS |
| 外文摘要 | 约 250 实词；藏族学生不需要 | PASS |
| 指导记录 | ≥6 次 | PASS |
| 文字复制比/AIGC | 一般 ≤30% | PASS |
| 藏族文字复制比 | ≤40%，独立条件 | PASS |
| 外文翻译 | 排除知识产权、电子商务及法律、藏族学生；约 1 万印刷符号/3,000 汉字 | PASS |
| 答辩陈述 | 5–10 分钟 | PASS |
| 答辩问题 | ≥3 | PASS |
| 准备时间 | ≥10 分钟 | PASS |
| 回答时间 | ≤10 分钟 | PASS |
| 第一/第二批答辩 | 分别保留日期范围与 batch 条件 | PASS |

## 边界说明

- 该测试证明真实原文内容可被 deterministic-v2 正确识别，不把验收工具伪装成生产 `.doc` parser。
- 生产 `LegacyDocParser` 只调用本机已安装/显式配置的受控转换器。当前环境未证明存在可用转换器，因此不能宣称原 `.doc` 已通过生产转换。
- 转换器不可用时保留原文件并提示另存为 DOCX/PDF，属于 ADR 明确接受的安全行为。
- 候选规则仍须用户逐项确认；测试不会自动写入 active rule、Requirement 或 Workflow。

## 修复结论

旧报告中“同段三项文献、摘要、翻译复合例外、答辩问题/准备/回答、两批答辩无法识别”的缺口已通过代码和真实 fixture 回归修复。剩余工作是打包产品的 legacy converter 环境验收、精确 source viewer 和冲突解决 UI，而不是 deterministic extraction 缺口。
