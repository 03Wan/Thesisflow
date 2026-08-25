import { describe, expect, it } from "vitest";
import { cleanMarkdownResponse, normalizedDocumentToMarkdownSource } from "@/services/aiDocumentParsingService";
import type { NormalizedDocument } from "@/types/document";

describe("AI document parsing helpers", () => {
  it("turns normalized blocks into compact Markdown source without duplicate table cells", () => {
    const document: NormalizedDocument = {
      documentId: "parse-1", projectFileId: "file-1", title: "规则", mimeType: "text/plain", language: null, pageCount: null, metadata: {}, warnings: [],
      blocks: [
        { id: "h", type: "heading", text: "学校要求", order: 0, level: 2, locator: { format: "txt_md", lineStart: 1, lineEnd: 1 }, metadata: {} },
        { id: "r", type: "table_row", text: "项目\t要求", order: 1, locator: { format: "txt_md", lineStart: 2, lineEnd: 2 }, metadata: {} },
        { id: "c", type: "table_cell", text: "项目", order: 2, locator: { format: "txt_md", lineStart: 2, lineEnd: 2 }, metadata: {} },
      ],
    };
    expect(normalizedDocumentToMarkdownSource(document)).toBe("## 学校要求\n\n| 项目 | 要求 |");
  });

  it("removes a single Markdown code fence from provider output", () => {
    expect(cleanMarkdownResponse("```markdown\n# 标题\n```")) .toBe("# 标题");
  });
});
