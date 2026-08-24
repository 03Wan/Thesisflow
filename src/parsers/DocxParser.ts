import JSZip from "jszip";
import type { DocumentBlock, DocumentParseInput, DocumentParseResult, DocumentParser, SourceLocator } from "@/types/document";

const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const cleanText = (value: string) => value.replace(/\u00a0/g, " ").replace(/[\t\r\n ]+/g, " ").trim();
type XmlElementParent = XMLDocument | Element;
const elements = (node: XmlElementParent, name: string): Element[] => Array.from(node.getElementsByTagNameNS(wordNamespace, name));
const first = (node: XmlElementParent, name: string) => elements(node, name)[0];
const attr = (node: Element | undefined, name: string) => node?.getAttributeNS(wordNamespace, name) ?? node?.getAttribute(`w:${name}`) ?? node?.getAttribute(name) ?? undefined;

function xml(text: string): XMLDocument {
  const parsed = new DOMParser().parseFromString(text, "application/xml");
  if (parsed.getElementsByTagName("parsererror").length) throw new Error("invalid OOXML XML");
  return parsed;
}

function paragraphText(paragraph: Element) { return cleanText(elements(paragraph, "t").map((item) => item.textContent ?? "").join("")); }
function paragraphKind(paragraph: Element) {
  const style = attr(first(paragraph, "pStyle"), "val");
  const heading = style?.match(/^Heading(\d+)$/i);
  return { type: heading ? "heading" as const : first(paragraph, "numPr") ? "list_item" as const : "paragraph" as const, style, level: heading ? Number(heading[1]) : undefined };
}

export class DocxParser implements DocumentParser {
  readonly id = "docx-ooxml";
  readonly version = "1.0.0";

  supports(input: Pick<DocumentParseInput, "mimeType">): boolean { return input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; }

  async parse(input: DocumentParseInput): Promise<DocumentParseResult> {
    if (!input.bytes) return { status: "failed", warnings: [], error: { code: "io_error", message: "DOCX parser requires local bytes.", recoverable: true } };
    try {
      input.onProgress?.(0, 3);
      const zip = await JSZip.loadAsync(input.bytes);
      const documentFile = zip.file("word/document.xml");
      if (!documentFile) throw new Error("word/document.xml missing");
      const documentXml = xml(await documentFile.async("text"));
      input.onProgress?.(1, 3);
      const coreFile = zip.file("docProps/core.xml");
      const core = coreFile ? xml(await coreFile.async("text")) : undefined;
      const metadata: Record<string, unknown> = {};
      if (core) {
        const title = core.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "title")[0]?.textContent;
        const creator = core.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "creator")[0]?.textContent;
        if (title) metadata.coreTitle = cleanText(title);
        if (creator) metadata.creator = cleanText(creator);
      }
      const blocks: DocumentBlock[] = [];
      let order = 0;
      let paragraphIndex = 0;
      let tableIndex = 0;
      const headingPath: string[] = [];
      const pushParagraph = (paragraph: Element, locator: SourceLocator, extra: Record<string, unknown> = {}) => {
        const text = paragraphText(paragraph); const kind = paragraphKind(paragraph);
        if (!text) return;
        if (kind.type === "heading") { const level = kind.level ?? 1; headingPath.splice(level - 1); headingPath[level - 1] = text; }
        blocks.push({ id: `${input.documentId}:block:${order}`, type: kind.type, text, order: order++, level: kind.level, style: kind.style, locator: { ...locator, format: "docx", headingPath: [...headingPath] }, metadata: extra });
      };
      const body = documentXml.getElementsByTagNameNS(wordNamespace, "body")[0];
      if (!body) throw new Error("document body missing");
      for (const node of Array.from(body.children)) {
        if (node.localName === "p") { pushParagraph(node, { format: "docx", paragraphIndex: paragraphIndex++ }); continue; }
        if (node.localName !== "tbl") continue;
        const currentTable = tableIndex++;
        const rows = Array.from(node.getElementsByTagNameNS(wordNamespace, "tr"));
        const tableText = cleanText(rows.map((row) => Array.from(row.getElementsByTagNameNS(wordNamespace, "tc")).map((cell) => paragraphText(cell)).join("\t")).join("\n"));
        blocks.push({ id: `${input.documentId}:block:${order}`, type: "table", text: tableText, order: order++, locator: { format: "docx", tableIndex: currentTable, headingPath: [...headingPath] }, metadata: { rowCount: rows.length } });
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.getElementsByTagNameNS(wordNamespace, "tc"));
          blocks.push({ id: `${input.documentId}:block:${order}`, type: "table_row", text: cleanText(cells.map((cell) => paragraphText(cell)).join("\t")), order: order++, locator: { format: "docx", tableIndex: currentTable, row: rowIndex, headingPath: [...headingPath] }, metadata: { cellCount: cells.length } });
          cells.forEach((cell, cellIndex) => blocks.push({ id: `${input.documentId}:block:${order}`, type: "table_cell", text: paragraphText(cell), order: order++, locator: { format: "docx", tableIndex: currentTable, row: rowIndex, cell: cellIndex, headingPath: [...headingPath] }, metadata: {} }));
        });
      }
      input.onProgress?.(2, 3);
      for (const [name, type] of [["word/header1.xml", "header"], ["word/footer1.xml", "footer"]] as const) {
        const part = zip.file(name); if (!part) continue;
        const partXml = xml(await part.async("text"));
        Array.from(partXml.getElementsByTagNameNS(wordNamespace, "p")).forEach((paragraph, index) => {
          const text = paragraphText(paragraph); if (!text) return;
          blocks.push({ id: `${input.documentId}:block:${order}`, type, text, order: order++, locator: { format: "docx", paragraphIndex: index, headingPath: [...headingPath] }, metadata: { part: name } });
        });
      }
      input.onProgress?.(3, 3);
      return { status: "parsed", warnings: [], document: { documentId: input.documentId, projectFileId: input.projectFileId, title: String(metadata.coreTitle ?? input.title), mimeType: input.mimeType, language: null, pageCount: null, blocks, metadata, warnings: [] } };
    } catch (error) {
      return { status: "failed", warnings: [], error: { code: "invalid_document", message: error instanceof Error ? `Unable to parse DOCX: ${error.message}` : "Unable to parse DOCX.", recoverable: false } };
    }
  }
}
