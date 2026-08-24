import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

const out = path.resolve("src/test/fixtures/docx");
const esc = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paragraph = (text, style = "") => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}</w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
const list = (text) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
const table = (rows) => `<w:tbl>${rows.map((row) => `<w:tr>${row.map((cell) => `<w:tc>${paragraph(cell)}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`;

async function docx(name, body, { header = "", footer = "" } = {}) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  zip.file("docProps/core.xml", `<?xml version="1.0"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(name)}</dc:title><dc:creator>ThesisFlow Fixture</dc:creator></cp:coreProperties>`);
  zip.file("word/document.xml", `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
  if (header) zip.file("word/header1.xml", `<?xml version="1.0"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${paragraph(header)}</w:hdr>`);
  if (footer) zip.file("word/footer1.xml", `<?xml version="1.0"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${paragraph(footer)}</w:ftr>`);
  await writeFile(path.join(out, name), await zip.generateAsync({ type: "nodebuffer" }));
}

await mkdir(out, { recursive: true });
await docx("headings.docx", `${paragraph("第一章 绪论", "Heading1")}${paragraph("研究背景", "Heading2")}${paragraph("正文 100% 保留")}`);
await docx("tables.docx", `${paragraph("表格说明")}${table([["指标", "数值"], ["完成率", "80%"]])}`);
await docx("mixed.docx", `${paragraph("研究设计", "Heading1")}${paragraph("  保留  2026-08-24  与 50%  ")}${list("第一项")}${list("第二项")}${table([["变量", "定义"]])}`, { header: "学校要求", footer: "第 1 页" });
await writeFile(path.join(out, "corrupted.docx"), Buffer.from("not a zip document"));
