import type { DocumentParseInput, DocumentParseResult, DocumentParser } from "@/types/document";

export class FakeDocumentParser implements DocumentParser {
  readonly id = "fake-text";
  readonly version = "1.0.0";

  supports(input: Pick<DocumentParseInput, "mimeType">): boolean {
    return input.mimeType === "text/plain" || input.mimeType === "text/markdown";
  }

  async parse(input: DocumentParseInput): Promise<DocumentParseResult> {
    const lines = input.text.split(/\r?\n/);
    return {
      status: "parsed",
      warnings: [],
      document: {
        documentId: input.documentId, projectFileId: input.projectFileId, title: input.title,
        mimeType: input.mimeType, language: null, pageCount: null, metadata: { parser: this.id }, warnings: [],
        blocks: lines.reduce<NonNullable<DocumentParseResult["document"]>["blocks"]>((blocks, text, lineIndex) => {
          if (!text) return blocks;
          blocks.push({
            id: `${input.documentId}:line:${lineIndex + 1}`,
            type: text.startsWith("#") ? "heading" : "paragraph",
            text,
            order: blocks.length,
            level: text.startsWith("#") ? text.match(/^#+/)?.[0].length : undefined,
            locator: { format: "txt_md", lineStart: lineIndex + 1, lineEnd: lineIndex + 1 },
            metadata: {},
          });
          return blocks;
        }, []),
      },
    };
  }
}
