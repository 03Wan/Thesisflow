import type { DocumentBlock, NormalizedDocument, SourceLocator } from "@/types/document";
import type { LiteratureChunk } from "@/types/literature";

export type EmbeddingModelDescriptor = { providerKey: string; modelId: string; dimensions: number; normalization: "l2" | "none"; };
export type EmbeddingTask = { texts: readonly string[]; model: EmbeddingModelDescriptor; };
export interface EmbeddingProvider { readonly key: string; listModels(): Promise<EmbeddingModelDescriptor[]>; embed(task: EmbeddingTask, signal?: AbortSignal): Promise<number[][]>; }
export type VectorHit = { chunkId: string; score: number; };
export interface VectorIndex { readonly key: string; upsert(version: string, vectors: Array<{ chunkId: string; vector: number[] }>): Promise<void>; search(version: string, vector: number[], topK: number): Promise<VectorHit[]>; remove(chunkIds: readonly string[]): Promise<void>; }
export type RetrievalResult = { chunkId: string; literatureId: string; score: number; retrievalMethod: "lexical" | "semantic" | "hybrid"; sourceLocator: SourceLocator; snippet: string; };
export type RetrievalBudget = { topK: number; perDocumentCap: number; totalContextChars: number; };
export const embeddingVersion = (chunkingVersion: string, model: EmbeddingModelDescriptor) => `${chunkingVersion}:${model.providerKey}/${model.modelId}:${model.dimensions}:${model.normalization}`;
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2,"0")).join("");
const pageKey = (block: DocumentBlock) => block.locator.format === "pdf" ? `${block.locator.pageNumber}:${block.text.trim()}` : "";
/** Structural, provenance-preserving chunks; headings are never split from their following content. */
export async function chunkNormalizedDocument(literatureId: string, document: NormalizedDocument, maxCharacters = 1400): Promise<LiteratureChunk[]> {
  const output: LiteratureChunk[] = []; let pending: DocumentBlock[] = []; let headings: string[] = []; const repeated = new Map<string, number>();
  for (const block of document.blocks) if (block.type === "header" || block.type === "footer") repeated.set(pageKey(block), (repeated.get(pageKey(block)) ?? 0) + 1);
  const flush = async () => { const usable = pending.filter(block => !((block.type === "header" || block.type === "footer") && (repeated.get(pageKey(block)) ?? 0) > 1)); if (!usable.length) { pending=[]; return; } const text = usable.map(x => x.text).join("\n"); const last = usable.at(-1)!; output.push({ id: crypto.randomUUID(), literatureId, projectFileId: document.projectFileId, documentParseId: document.documentId, chunkOrder: output.length, text, textHash: await hash(text), tokenEstimate: Math.ceil(text.length / 4), headingPath: headings.join(" > ") || null, locatorJson: JSON.stringify(last.locator), createdAt: new Date().toISOString() }); pending=[]; };
  for (const block of document.blocks) { if (block.type === "heading") { await flush(); headings = headings.slice(0, Math.max(0, (block.level ?? 1) - 1)); headings.push(block.text); pending.push(block); continue; } const current = pending.reduce((size, item) => size + item.text.length, 0); if (pending.length && current + block.text.length > maxCharacters) await flush(); pending.push(block); }
  await flush(); return output;
}
export class LiteratureRetriever {
  constructor(private readonly lexical: (query: string) => Promise<RetrievalResult[]>, private readonly semantic?: (query: string) => Promise<RetrievalResult[]>) {}
  async retrieve(query: string, budget: RetrievalBudget): Promise<RetrievalResult[]> { const lexical = await this.lexical(query); const semantic = this.semantic ? await this.semantic(query).catch(() => []) : []; const byId = new Map<string, RetrievalResult>(); for (const hit of [...lexical, ...semantic]) { const prior = byId.get(hit.chunkId); byId.set(hit.chunkId, prior ? { ...hit, score: prior.score + hit.score, retrievalMethod: "hybrid" } : hit); } const docs = new Map<string,number>(); let chars = 0; const output: RetrievalResult[] = []; for (const hit of [...byId.values()].sort((a,b) => b.score-a.score)) { if (output.length >= budget.topK || (docs.get(hit.literatureId) ?? 0) >= budget.perDocumentCap || chars + hit.snippet.length > budget.totalContextChars) continue; output.push(hit); chars += hit.snippet.length; docs.set(hit.literatureId, (docs.get(hit.literatureId) ?? 0) + 1); } return output; }
}
