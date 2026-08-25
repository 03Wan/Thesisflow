import { invoke } from "@tauri-apps/api/core";
import { askConfiguredProvider, getActiveBrowserProvider } from "@/ai/providerClient";
import { parsingService } from "@/services/parsingService";
import type { NormalizedDocument } from "@/types/document";
import type { ProjectFile } from "@/types/domain";

const MAX_AI_SOURCE_CHARS = 120_000;

export function normalizedDocumentToMarkdownSource(document: NormalizedDocument): string {
  return document.blocks
    .filter((block) => block.type !== "table" && block.type !== "table_cell")
    .map((block) => {
      if (block.type === "heading") return `${"#".repeat(Math.min(6, Math.max(1, block.level ?? 1)))} ${block.text}`;
      if (block.type === "list_item") return `- ${block.text}`;
      if (block.type === "table_row") return `| ${block.text.split("\t").join(" | ")} |`;
      return block.text;
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_AI_SOURCE_CHARS);
}

export function cleanMarkdownResponse(value: string): string {
  return value.trim().replace(/^```(?:markdown|md)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export class AiDocumentParsingService {
  async convertToMarkdown(file: ProjectFile): Promise<ProjectFile> {
    const provider = getActiveBrowserProvider();
    if (!provider) throw new Error("请先在“设置 → AI 设置”中保存并启用一个 AI Provider。");
    const parse = await parsingService.parseProjectFile(file.id);
    if (parse.status !== "parsed") throw new Error(parse.errorMessage || `本地预解析未完成：${parse.status}。`);
    const document = await invoke<NormalizedDocument>("read_normalized_document", { parseId: parse.id });
    const source = normalizedDocumentToMarkdownSource(document);
    if (!source.trim()) throw new Error("本地解析结果没有可发送给 AI 的正文文本。");
    const prompt = [
      "请把下面的本地文档抽取结果整理为忠实、完整、结构清晰的 Markdown。",
      "要求：不添加源文档没有的事实；保留标题层级、列表和表格；修复明显的断行；只输出 Markdown 正文，不要代码围栏和解释。",
      `源文件名：${file.originalName}`,
      "---",
      source,
    ].join("\n\n");
    const markdown = cleanMarkdownResponse(await askConfiguredProvider(provider, prompt));
    if (!markdown) throw new Error("AI 未返回可保存的 Markdown 内容。");
    return invoke<ProjectFile>("save_ai_markdown", { request: { projectId: file.projectId, sourceFileId: file.id, content: markdown } });
  }
}

export const aiDocumentParsingService = new AiDocumentParsingService();
