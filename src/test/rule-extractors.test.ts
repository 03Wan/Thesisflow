import { describe, expect, it } from "vitest";
import { candidatesConflict, extractDeadline, extractRuleCandidates, parseChineseNumber } from "@/rules/extractors";
import { canonicalRuleCatalog } from "@/rules/catalog";

const doc = (text: string) => ({ documentId: "p", projectFileId: "f", title: "x", mimeType: "text/plain", language: null, pageCount: null, metadata: {}, warnings: [], blocks: text.split(/\r?\n/).filter(Boolean).map((line, index) => ({ id: `b-${index}`, type: "paragraph" as const, text: line, order: index, locator: { format: "txt_md" as const, lineStart: index + 1, lineEnd: index + 1 }, metadata: {} })) });

describe("deterministic rule extraction", () => {
  it("has a stable catalog and parses Chinese numbers", () => { expect(Object.keys(canonicalRuleCatalog)).toContain("deadline.defense"); expect(parseChineseNumber("一万")).toBe(10000); });
  it("separates general and Tibetan body-word rules in the same block", () => {
    const candidates = extractRuleCandidates(doc("毕业论文的正文字数为一万汉字左右，藏族学生毕业论文字数不少于六千汉字。"));
    expect(candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleKey: "paper.body_words.target", value: { value: 10000, qualifier: "approximate" }, condition: null }),
      expect.objectContaining({ ruleKey: "paper.body_words.min", value: 6000, condition: expect.objectContaining({ value: "tibetan" }) }),
    ]));
  });
  it("extracts multiple reference, abstract, translation and defense rules from dense clauses", () => {
    const text = [
      "查阅文献20篇以上，其中外文文献不少于2篇，期刊论文的文献数量不应少于18篇。",
      "中文摘要约300字左右。外文摘要约250个实词左右（藏族学生不需要外文摘要）。",
      "除知识产权、电子商务及法律、藏族学生外，其他专业学生完成与课题相关的1万印刷符号左右的外文资料译文（约3000汉字）一篇。",
      "学生准备PPT，陈述毕业论文主要内容（5-10分钟）。答辩小组提问（不少于3个问题）。学生准备不少于10分钟。学生回答问题（10分钟以内）。",
    ].join("\n");
    const candidates = extractRuleCandidates(doc(text)); const keys = candidates.map((candidate) => candidate.ruleKey);
    expect(keys).toEqual(expect.arrayContaining(["references.total.min", "references.foreign.min", "references.journal.min", "abstract.zh.words.approx", "abstract.en.content_words.approx", "translation.required", "translation.source_printed_chars.approx", "translation.zh_chars.approx", "defense.presentation_minutes.min", "defense.presentation_minutes.max", "defense.question_count.min", "defense.preparation_minutes.min", "defense.answer_minutes.max"]));
    expect(candidates.find((candidate) => candidate.ruleKey === "translation.required")?.condition).toMatchObject({ operator: "not_in" });
  });
  it("extracts plagiarism/AIGC limits, batches and deadline families", () => {
    const text = ["文字复制比和AIGC检测结果一般不得超过30%。", "总文字复制比不超过30%，藏族学生不超过40%。", "完成开题报告 2026年1月7日前", "论文评阅（第一批次）2026年4月16日前", "论文答辩 2026年4月25-26日 论文第一批次答辩", "论文答辩 2026年5月10-11日 论文第二批次答辩", "提交论文最终稿 2026年5月16日前"].join("\n");
    const candidates = extractRuleCandidates(doc(text));
    expect(candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleKey: "aigc.max_percent", value: 30 }), expect.objectContaining({ ruleKey: "deadline.proposal" }),
      expect.objectContaining({ ruleKey: "plagiarism.total.max_percent", value: 40, condition: expect.objectContaining({ value: "tibetan" }) }),
      expect.objectContaining({ ruleKey: "deadline.review", condition: expect.objectContaining({ value: "first" }) }),
      expect.objectContaining({ ruleKey: "deadline.defense", condition: expect.objectContaining({ value: "first" }) }),
      expect.objectContaining({ ruleKey: "deadline.defense", condition: expect.objectContaining({ value: "second" }) }),
      expect.objectContaining({ ruleKey: "deadline.final_submission" }),
    ]));
    expect(extractDeadline("2026 年 4 月 25-26 日")).toMatchObject({ value: { start: "2026-04-25", end: "2026-04-26" } });
  });
  it("keeps different conditions out of conflict", () => {
    const first = extractRuleCandidates(doc("普通学生正文约10000字"))[0];
    const second = { ...first, value: 6000, condition: { field: "student_group", operator: "equals" as const, value: "tibetan" } };
    expect(candidatesConflict(first, second)).toBe(false);
  });
});
