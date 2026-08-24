import type { ProjectFileCategory } from "@/types/domain";

export const SUPPORTED_FILE_EXTENSIONS = ["doc", "docx", "pdf", "xlsx", "xls", "csv", "bib", "ris", "txt", "md"] as const;
export const PROJECT_FILE_CATEGORIES: readonly ProjectFileCategory[] = ["school_rule", "template", "literature", "data", "proposal", "thesis", "translation", "review", "defense", "plagiarism", "archive", "other"];
export const CATEGORY_LABELS: Record<ProjectFileCategory, string> = { school_rule: "学校要求", template: "模板", literature: "文献", data: "数据", proposal: "开题", thesis: "论文正文", translation: "外文翻译", review: "评阅", defense: "答辩", plagiarism: "查重", archive: "归档", other: "其他" };
export const CATEGORY_DIRECTORIES: Record<ProjectFileCategory, string> = { school_rule: "01_学校要求", template: "01_学校要求", literature: "03_文献", data: "05_数据", proposal: "04_开题", thesis: "06_论文正文", translation: "07_外文翻译", review: "09_查重与评阅", defense: "10_答辩", plagiarism: "09_查重与评阅", archive: "12_归档", other: ".thesisflow/imports" };

export function extensionOf(path: string) { return path.split(".").pop()?.toLowerCase() ?? ""; }
export function isSupportedFile(path: string) { return SUPPORTED_FILE_EXTENSIONS.includes(extensionOf(path) as typeof SUPPORTED_FILE_EXTENSIONS[number]); }
export function inferProjectFileCategory(path: string): ProjectFileCategory {
  const extension = extensionOf(path);
  if (["bib", "ris"].includes(extension)) return "literature";
  if (["xlsx", "xls", "csv"].includes(extension)) return "data";
  if (["doc", "docx", "pdf", "txt", "md"].includes(extension)) return "thesis";
  return "other";
}
