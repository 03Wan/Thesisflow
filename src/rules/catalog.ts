export type CanonicalRuleValueType = "number" | "percent" | "range" | "date" | "date_range" | "text" | "boolean" | "count";
export type CanonicalRule = { key: string; category: string; valueType: CanonicalRuleValueType; unit?: string; scope: string };
const rows: Array<[string, CanonicalRuleValueType, string?]> = [
["paper.body_words.target","number","words"],["paper.body_words.min","number","words"],["references.total.min","count","items"],["references.foreign.min","count","items"],["references.journal.min","count","items"],["abstract.zh.words.approx","number","words"],["abstract.en.content_words.approx","number","words"],["plagiarism.total.max_percent","percent","%"],["aigc.max_percent","percent","%"],["advisor.sessions.min","count","sessions"],["proposal.literature_review.words.min","number","words"],["proposal.references.min","count","items"],["taskbook.references.zh.min","count","items"],["taskbook.references.foreign.min","count","items"],["translation.required","boolean"],["translation.source_printed_chars.approx","number","chars"],["translation.zh_chars.approx","number","chars"],["defense.presentation_minutes.min","number","minutes"],["defense.presentation_minutes.max","number","minutes"],["defense.question_count.min","count","items"],["defense.preparation_minutes.min","number","minutes"],["defense.answer_minutes.max","number","minutes"],
["deadline.topic_confirm","date"],["deadline.taskbook","date"],["deadline.proposal","date"],["deadline.first_draft","date"],["deadline.midterm","date"],["deadline.final_draft","date"],["deadline.review","date"],["deadline.inspection","date"],["deadline.defense","date"],["deadline.final_submission","date"],["deadline.archive","date"]];
export const canonicalRuleCatalog: Record<string, CanonicalRule> = Object.fromEntries(rows.map(([key,valueType,unit])=>[key,{key,valueType,unit,category:key.split(".")[0],scope:"project"}]));

export const ruleLabels: Record<string, string> = {
  "paper.body_words.target": "论文正文目标字数",
  "paper.body_words.min": "论文正文最低字数",
  "references.total.min": "参考文献最低篇数",
  "references.foreign.min": "外文文献最低篇数",
  "references.journal.min": "期刊文献最低篇数",
  "abstract.zh.words.approx": "中文摘要参考字数",
  "abstract.en.content_words.approx": "英文摘要参考实词数",
  "plagiarism.total.max_percent": "文字复制比上限",
  "aigc.max_percent": "AIGC 检测比例上限",
  "advisor.sessions.min": "指导记录最低次数",
  "proposal.literature_review.words.min": "开题文献综述最低字数",
  "proposal.references.min": "开题报告参考文献最低篇数",
  "taskbook.references.zh.min": "任务书中文文献最低篇数",
  "taskbook.references.foreign.min": "任务书外文文献最低篇数",
  "translation.required": "外文资料翻译要求",
  "translation.source_printed_chars.approx": "外文资料参考印刷符号数",
  "translation.zh_chars.approx": "译文参考字数",
  "defense.presentation_minutes.min": "答辩陈述最短时长",
  "defense.presentation_minutes.max": "答辩陈述最长时长",
  "defense.question_count.min": "答辩最低提问数",
  "defense.preparation_minutes.min": "答辩最低准备时长",
  "defense.answer_minutes.max": "答辩回答最长时长",
  "deadline.topic_confirm": "选题确认截止日期",
  "deadline.taskbook": "任务书截止日期",
  "deadline.proposal": "开题报告截止日期",
  "deadline.first_draft": "论文初稿截止日期",
  "deadline.midterm": "中期检查截止日期",
  "deadline.final_draft": "论文定稿截止日期",
  "deadline.review": "论文评阅截止日期",
  "deadline.inspection": "论文抽检截止日期",
  "deadline.defense": "论文答辩日期",
  "deadline.final_submission": "论文最终稿提交日期",
  "deadline.archive": "材料归档截止日期",
};

export const ruleLabel = (key: string) => ruleLabels[key] ?? "未识别规则";
