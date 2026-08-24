import type { SourceLocator } from "@/types/document";

export type SourceViewerLocation = { projectFileId: string; locator: SourceLocator; pageNumber: number | null; label: string };
export function toSourceViewerLocation(projectFileId: string, locator: SourceLocator): SourceViewerLocation { const pageNumber = locator.format === "pdf" ? locator.pageNumber : null; const label = pageNumber ? `PDF 第 ${pageNumber} 页` : locator.format === "docx" ? "DOCX 文本位置" : "文档位置"; return { projectFileId, locator, pageNumber, label }; }
export function serializeSourceViewerLocation(location: SourceViewerLocation) { return JSON.stringify({ projectFileId: location.projectFileId, locator: location.locator, pageNumber: location.pageNumber }); }
