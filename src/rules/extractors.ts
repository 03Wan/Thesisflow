import type { NormalizedDocument, RuleCandidate, RuleCondition } from "@/types/document";

const chinese: Record<string, number> = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 百: 100, 千: 1000, 万: 10000 };

export const parseChineseNumber = (raw: string) => {
  if (/^\d+$/.test(raw)) return Number(raw);
  let total = 0; let current = 0;
  for (const character of raw) {
    const value = chinese[character];
    if (value === undefined) return null;
    if (value >= 10) { current ||= 1; total += current * value; current = 0; }
    else current = value;
  }
  return total + current;
};

const valueOf = (raw: string | undefined) => raw ? parseChineseNumber(raw) : null;
const equals = (field: string, value: unknown): RuleCondition => ({ field, operator: "equals", value });
const notIn = (field: string, value: unknown[]): RuleCondition => ({ field, operator: "not_in", value });
const iso = (year: string, month: string, day: string) => `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

export function extractDeadline(text: string) {
  const range = text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[-至]\s*(\d{1,2})\s*日/);
  if (range) return { value: { start: iso(range[1], range[2], range[3]), end: iso(range[1], range[2], range[4]) }, beforeOrOn: false };
  const single = text.match(/(20\d{2})\s*[年-]\s*(\d{1,2})\s*[月-]\s*(\d{1,2})\s*日?(前|前截止)?/);
  return single ? { value: iso(single[1], single[2], single[3]), beforeOrOn: Boolean(single[4]) } : null;
}

const deadlineKey = (text: string) => {
  if (/选题/.test(text)) return "deadline.topic_confirm";
  if (/任务书/.test(text)) return "deadline.taskbook";
  if (/开题/.test(text)) return "deadline.proposal";
  if (/初稿/.test(text)) return "deadline.first_draft";
  if (/中期/.test(text)) return "deadline.midterm";
  if (/定稿|查重/.test(text)) return "deadline.final_draft";
  if (/评阅/.test(text)) return "deadline.review";
  if (/抽检/.test(text)) return "deadline.inspection";
  if (/最终稿/.test(text)) return "deadline.final_submission";
  if (/答辩/.test(text)) return "deadline.defense";
  if (/归档/.test(text)) return "deadline.archive";
  return null;
};

const batchCondition = (text: string): RuleCondition | null => /第一批/.test(text) ? equals("defense_batch", "first") : /第二批|补答辩|二次答辩/.test(text) ? equals("defense_batch", "second") : null;

export function extractRuleCandidates(document: NormalizedDocument): RuleCandidate[] {
  const output: RuleCandidate[] = [];
  let lastDeadlineKey: string | null = null;

  document.blocks.forEach((block, blockIndex) => {
    const text = block.text.replace(/\s+/g, " ").trim();
    if (!text) return;
    const add = (ruleKey: string, value: unknown, unit: string | null, confidence = 0.9, condition: RuleCondition | null = null, exception: RuleCondition | null = null, rawText = text) => output.push({
      id: `${document.documentId}:candidate:${blockIndex}:${output.length}`, projectId: "", projectFileId: document.projectFileId,
      documentParseId: document.documentId, ruleKey, category: ruleKey.split(".")[0], value, unit, rawText, locator: block.locator,
      confidence, extractor: "deterministic-v2", condition, exception, status: "pending", createdAt: "", updatedAt: "",
    });

    const key = deadlineKey(text);
    if (key) lastDeadlineKey = key;
    const deadline = extractDeadline(text);
    if (deadline && (key ?? lastDeadlineKey)) add(key ?? lastDeadlineKey!, deadline, null, 0.95, batchCondition(text));

    for (const match of text.matchAll(/(藏族学生)?(?:毕业论文的?)?(?:正文(?:字数)?|字数)(?:为|约|不少于|不得少于)?\s*([零一二三四五六七八九十百千万\d]+)\s*(?:汉字|字|字符)(?:左右)?/g)) {
      const value = valueOf(match[2]); if (value === null) continue;
      const context = text.slice(Math.max(0, match.index! - 8), match.index! + match[0].length);
      const tibetan = Boolean(match[1]); const approximate = /约|左右/.test(match[0]);
      add(approximate ? "paper.body_words.target" : "paper.body_words.min", approximate ? { value, qualifier: "approximate" } : value, "words", 0.95, tibetan ? equals("student_group", "tibetan") : null, null, context);
    }

    const referenceRules: Array<[RegExp, string]> = [
      [/(?:查阅)?文献\s*([零一二三四五六七八九十百千万\d]+)\s*篇以上/, "references.total.min"],
      [/外文文献(?:不少于|至少)\s*([零一二三四五六七八九十百千万\d]+)\s*篇/, "references.foreign.min"],
      [/期刊论文的?文献数量(?:不应少于|不少于|至少)\s*([零一二三四五六七八九十百千万\d]+)\s*篇/, "references.journal.min"],
    ];
    for (const [pattern, ruleKey] of referenceRules) {
      const match = text.match(pattern); const value = valueOf(match?.[1]);
      if (value !== null) add(ruleKey, value, "items", 0.95, null, null, match![0]);
    }

    const zhAbstract = text.match(/中文摘要约\s*([零一二三四五六七八九十百千万\d]+)\s*字/); const zhWords = valueOf(zhAbstract?.[1]);
    if (zhWords !== null) add("abstract.zh.words.approx", { value: zhWords, qualifier: "approximate" }, "words", 0.95, null, null, zhAbstract![0]);
    const enAbstract = text.match(/外文摘要约\s*([零一二三四五六七八九十百千万\d]+)\s*个?实词/); const enWords = valueOf(enAbstract?.[1]);
    if (enWords !== null) add("abstract.en.content_words.approx", { value: enWords, qualifier: "approximate" }, "words", 0.95, null, null, enAbstract![0]);
    if (/藏族学生不需要外文摘要/.test(text)) add("abstract.en.content_words.approx", false, null, 0.98, equals("student_group", "tibetan"), null, "藏族学生不需要外文摘要");

    const sessions = text.match(/指导记录要求?(?:不得|应)?不少于\s*([零一二三四五六七八九十百千万\d]+)\s*次/); const sessionCount = valueOf(sessions?.[1]);
    if (sessionCount !== null) add("advisor.sessions.min", sessionCount, "sessions", 0.98, null, null, sessions![0]);

    const combinedAi = text.match(/文字复制比和\s*AIGC\s*检测结果一般不得超过\s*(\d+)\s*%/i);
    if (combinedAi) { const value = Number(combinedAi[1]); add("plagiarism.total.max_percent", value, "%", 0.98, null, null, combinedAi[0]); add("aigc.max_percent", value, "%", 0.98, null, null, combinedAi[0]); }
    for (const match of text.matchAll(/(?:总)?文字复制比(?:一般)?不超过\s*(\d+)\s*%/g)) {
      const context = text.slice(Math.max(0, match.index! - 12), match.index! + match[0].length);
      add("plagiarism.total.max_percent", Number(match[1]), "%", 0.98, /藏族/.test(context) ? equals("student_group", "tibetan") : null, null, context);
    }
    if (/文字复制比/.test(text)) for (const match of text.matchAll(/藏族学生不超过\s*(\d+)\s*%/g)) add("plagiarism.total.max_percent", Number(match[1]), "%", 0.98, equals("student_group", "tibetan"), null, match[0]);
    if (!combinedAi) for (const match of text.matchAll(/AIGC(?:检测结果)?(?:一般)?不得超过\s*(\d+)\s*%/gi)) add("aigc.max_percent", Number(match[1]), "%", 0.98, null, null, match[0]);

    const translation = text.match(/除(.+?)外，其他专业学生完成.+?([零一二三四五六七八九十百千万\d]+)\s*印刷符号.+?约\s*([零一二三四五六七八九十百千万\d]+)\s*汉字/);
    if (translation) {
      const excluded = translation[1].split(/[、，,及]/).map((value) => value.trim()).filter(Boolean);
      const condition = notIn("major_or_student_group", excluded);
      add("translation.required", true, null, 0.98, condition, null, translation[0]);
      add("translation.source_printed_chars.approx", { value: valueOf(translation[2]), qualifier: "approximate" }, "chars", 0.95, condition, null, translation[0]);
      add("translation.zh_chars.approx", { value: valueOf(translation[3]), qualifier: "approximate" }, "chars", 0.95, condition, null, translation[0]);
    }

    const presentation = text.match(/(?:陈述|答辩).{0,16}?(\d+)\s*[-至]\s*(\d+)\s*分钟/);
    if (presentation) { add("defense.presentation_minutes.min", Number(presentation[1]), "minutes", 0.98, null, null, presentation[0]); add("defense.presentation_minutes.max", Number(presentation[2]), "minutes", 0.98, null, null, presentation[0]); }
    const questions = text.match(/提问[^。；]{0,12}(?:不少于|至少)\s*([零一二三四五六七八九十百千万\d]+)\s*个问题/); const questionCount = valueOf(questions?.[1]);
    if (questionCount !== null) add("defense.question_count.min", questionCount, "items", 0.98, null, null, questions![0]);
    const preparation = text.match(/准备(?:时间)?(?:不得|应)?不少于\s*([零一二三四五六七八九十百千万\d]+)\s*分钟/); const preparationMinutes = valueOf(preparation?.[1]);
    if (preparationMinutes !== null) add("defense.preparation_minutes.min", preparationMinutes, "minutes", 0.98, null, null, preparation![0]);
    const answer = text.match(/回答问题[^。；]{0,12}?(\d+)\s*分钟以内/); if (answer) add("defense.answer_minutes.max", Number(answer[1]), "minutes", 0.98, null, null, answer[0]);
  });
  return output;
}

export const candidatesConflict = (left: RuleCandidate, right: RuleCandidate) => left.ruleKey === right.ruleKey && JSON.stringify(left.condition) === JSON.stringify(right.condition) && JSON.stringify(left.value) !== JSON.stringify(right.value);
