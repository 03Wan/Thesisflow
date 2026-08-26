import { describe, expect, it, vi } from "vitest";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import { FakeDocumentParser } from "@/test/support/test-doubles";
import { ParserRegistry } from "@/parsers/ParserRegistry";
import { DocumentParseService, summarizeDocument } from "@/services/documentParseService";

describe("ParserRegistry and normalized AST", () => {
  it("routes a text document to the test parser with real TXT/MD line locators", async () => {
    const registry = new ParserRegistry().register(new FakeDocumentParser());
    const { result } = await registry.parse({ documentId: "parse-1", projectId: "project-1", projectFileId: "file-1", title: "规则.md", mimeType: "text/markdown", text: "# 标题\n\n正文" });
    expect(result.status).toBe("parsed");
    expect(result.document?.pageCount).toBeNull();
    expect(result.document?.blocks).toMatchObject([
      { type: "heading", locator: { format: "txt_md", lineStart: 1, lineEnd: 1 } },
      { type: "paragraph", locator: { format: "txt_md", lineStart: 3, lineEnd: 3 } },
    ]);
    expect(summarizeDocument(result.document!)).toEqual({ mimeType: "text/markdown", language: null, pageCount: null, blockCount: 2, textLength: 6 });
  });

  it("does not invent a parser for an unsupported format", () => {
    expect(new ParserRegistry().register(new FakeDocumentParser()).find({ mimeType: "application/pdf" })).toBeUndefined();
  });

  it("hands the normalized document and only its metadata summary to native persistence", async () => {
    const document = (await new FakeDocumentParser().parse({ documentId: "parse-2", projectId: "project-1", projectFileId: "file-1", title: "规则.txt", mimeType: "text/plain", text: "要求" })).document!;
    invoke.mockResolvedValueOnce({ id: "parse-2", status: "parsed" });
    await expect(new DocumentParseService().persistParsedDocument({ id: "parse-2", projectId: "project-1", projectFileId: "file-1", parserType: "fake-text", parserVersion: "1.0.0", contentHash: "hash", document })).resolves.toMatchObject({ status: "parsed" });
    expect(invoke).toHaveBeenCalledWith("persist_normalized_document", expect.objectContaining({ request: expect.objectContaining({ blockCount: 1, textLength: 2, document }) }));
  });
});
