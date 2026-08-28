import { canonicalRuleCatalog, ruleLabel } from "@/rules/catalog";
import type { RuleCandidate, SourceLocator } from "@/types/document";

const deadlineEvidence: Record<string, RegExp> = {
  "deadline.topic_confirm": /选题/,
  "deadline.taskbook": /任务书/,
  "deadline.proposal": /开题/,
  "deadline.first_draft": /初稿/,
  "deadline.midterm": /中期/,
  "deadline.final_draft": /定稿|查重/,
  "deadline.review": /评阅/,
  "deadline.inspection": /抽检/,
  "deadline.defense": /答辩/,
  "deadline.final_submission": /最终稿/,
  "deadline.archive": /归档/,
};

export const isReviewableCandidate = (candidate: RuleCandidate) => {
  if (!canonicalRuleCatalog[candidate.ruleKey]) return false;
  const evidence = deadlineEvidence[candidate.ruleKey];
  return !evidence || evidence.test(candidate.rawText);
};

const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, stable(nested)])) : value;
const candidateSignature = (candidate: RuleCandidate) => JSON.stringify([candidate.ruleKey, stable(candidate.value), stable(candidate.condition), stable(candidate.exception)]);

/** Collapse equivalent semantic candidates even when parsers report different source locations/files. */
export const dedupeCandidates = (candidates: RuleCandidate[]) => {
  const best = new Map<string, RuleCandidate>();
  for (const candidate of candidates) {
    const signature = candidateSignature(candidate); const previous = best.get(signature);
    if (!previous || candidate.confidence > previous.confidence || (candidate.confidence === previous.confidence && candidate.rawText.length > previous.rawText.length)) best.set(signature, candidate);
  }
  return [...best.values()];
};

const unitLabels: Record<string, string> = { words: "字", items: "篇/项", sessions: "次", chars: "字符", minutes: "分钟", "%": "%" };
const dateText = (value: string) => value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1年$2月$3日");

export const formatCandidateValue = (candidate: RuleCandidate) => {
  const value = candidate.value;
  const structured = value && typeof value === "object" ? value as { value?: unknown; beforeOrOn?: boolean; qualifier?: string } : null;
  if (candidate.category === "deadline" && structured) {
    const date = structured.value;
    if (typeof date === "string") return `${dateText(date)}${structured.beforeOrOn ? "（含当日）" : ""}`;
    if (date && typeof date === "object" && "start" in date && "end" in date) return `${dateText(String(date.start))} 至 ${dateText(String(date.end))}`;
  }
  const nested = structured && "value" in structured ? structured.value : value;
  if (typeof nested === "boolean") return nested ? "需要" : "不需要";
  return `${String(nested)}${candidate.unit ? unitLabels[candidate.unit] ?? candidate.unit : ""}${structured?.qualifier ? "（约）" : ""}`;
};

export const formatLocator = (locator: SourceLocator): string => {
  if (locator.format === "pdf") return `第 ${locator.pageNumber} 页`;
  if (locator.format === "docx") return locator.tableIndex !== undefined ? `表格 ${locator.tableIndex + 1}${locator.row !== undefined ? `，第 ${locator.row + 1} 行` : ""}` : `第 ${(locator.paragraphIndex ?? 0) + 1} 段`;
  if (locator.format === "xlsx") return `${locator.sheet}！${locator.cellRange}`;
  if (locator.format === "txt_md") return `第 ${locator.lineStart} 行`;
  return formatLocator(locator.locator);
};

export const candidateTitle = (candidate: RuleCandidate) => ruleLabel(candidate.ruleKey);
