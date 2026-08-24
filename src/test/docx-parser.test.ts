import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DocxParser } from "@/parsers/DocxParser";
import { ParserRegistry } from "@/parsers/ParserRegistry";

const fixture = async (name: string) => new Uint8Array(await readFile(path.resolve("src/test/fixtures/docx", name)));
const input = async (name: string) => ({ documentId: `parse-${name}`, projectId: "project-1", projectFileId: "file-1", title: name, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", text: "", bytes: await fixture(name) });

describe("DocxParser fixtures", () => {
  it("extracts headings with DOCX paragraph locators and core properties", async () => {
    const result = await new ParserRegistry().register(new DocxParser()).parse(await input("headings.docx"));
    expect(result.result.status).toBe("parsed");
    expect(result.result.document).toMatchObject({ title: "headings.docx", metadata: { creator: "ThesisFlow Fixture" } });
    expect(result.result.document?.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ type: "heading", level: 1, locator: expect.objectContaining({ format: "docx", paragraphIndex: 0 }) }), expect.objectContaining({ type: "heading", level: 2, locator: expect.objectContaining({ paragraphIndex: 1 }) })]));
  });

  it("extracts tables, rows and cells in source order", async () => {
    const result = (await new DocxParser().parse(await input("tables.docx"))).document!;
    expect(result.blocks.map((block) => block.type)).toEqual(["paragraph", "table", "table_row", "table_cell", "table_cell", "table_row", "table_cell", "table_cell"]);
    expect(result.blocks.find((block) => block.type === "table_cell" && block.text === "80%")?.locator).toMatchObject({ format: "docx", tableIndex: 0, row: 1, cell: 1 });
  });

  it("cleans Unicode whitespace without changing dates or percentages and reads reliable headers/footers", async () => {
    const result = (await new DocxParser().parse(await input("mixed.docx"))).document!;
    expect(result.blocks.find((block) => block.type === "paragraph")?.text).toBe("保留 2026-08-24 与 50%");
    expect(result.blocks.filter((block) => block.type === "list_item")).toHaveLength(2);
    expect(result.blocks.map((block) => block.type)).toEqual(expect.arrayContaining(["header", "footer"]));
  });

  it("returns a structured error for corrupted DOCX", async () => {
    const result = await new DocxParser().parse(await input("corrupted.docx"));
    expect(result).toMatchObject({ status: "failed", error: { code: "invalid_document", recoverable: false } });
  });
});
