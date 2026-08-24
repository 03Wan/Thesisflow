import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractRuleCandidates } from "@/rules/extractors";

describe("Phase 3 Sanjiang real legacy-DOC fixture", () => {
  it("extracts the labelled requirements from the unchanged source document", async () => {
    // word-extractor is an acceptance-only reader for the unchanged legacy source; production keeps the converter/fallback boundary.
    // @ts-expect-error word-extractor 1.0.4 does not publish TypeScript declarations.
    const { default: WordExtractor } = await import("word-extractor");
    const source = resolve(process.cwd(), "product-reference", "2026届法商学院本科毕业论文工作细则（20251118）.doc");
    const body = (await new WordExtractor().extract(source)).getBody() as string;
    const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const document = {
      documentId: "sanjiang-2026", projectFileId: "sanjiang-source", title: "2026届法商学院本科毕业论文工作细则",
      mimeType: "application/msword", language: "zh-CN", pageCount: null, metadata: { acceptanceReader: "word-extractor" }, warnings: [],
      blocks: lines.map((text, index) => ({ id: `line-${index + 1}`, type: "paragraph" as const, text, order: index, locator: { format: "txt_md" as const, lineStart: index + 1, lineEnd: index + 1 }, metadata: {} })),
    };
    const candidates = extractRuleCandidates(document);
    const has = (ruleKey: string, value: unknown) => candidates.some((candidate) => candidate.ruleKey === ruleKey && JSON.stringify(candidate.value) === JSON.stringify(value));

    expect(has("references.total.min", 20)).toBe(true);
    expect(has("references.foreign.min", 2)).toBe(true);
    expect(has("references.journal.min", 18)).toBe(true);
    expect(has("advisor.sessions.min", 6)).toBe(true);
    expect(has("defense.question_count.min", 3)).toBe(true);
    expect(has("defense.preparation_minutes.min", 10)).toBe(true);
    expect(has("defense.answer_minutes.max", 10)).toBe(true);
    expect(has("aigc.max_percent", 30)).toBe(true);
    expect(candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleKey: "paper.body_words.target", value: { value: 10000, qualifier: "approximate" } }),
      expect.objectContaining({ ruleKey: "paper.body_words.min", value: 6000, condition: expect.objectContaining({ value: "tibetan" }) }),
      expect.objectContaining({ ruleKey: "plagiarism.total.max_percent", value: 40, condition: expect.objectContaining({ value: "tibetan" }) }),
      expect.objectContaining({ ruleKey: "translation.required", condition: expect.objectContaining({ operator: "not_in" }) }),
      expect.objectContaining({ ruleKey: "deadline.defense", condition: expect.objectContaining({ value: "first" }) }),
      expect.objectContaining({ ruleKey: "deadline.defense", condition: expect.objectContaining({ value: "second" }) }),
    ]));
  });
});
