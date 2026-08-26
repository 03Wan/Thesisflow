import type { AIConnectionResult, AICapabilities, AIError, AIProvider, AIRequest, AIResponse, AIStreamEvent, ResolvedProviderConfig } from "@/ai/domain";
import type { SecretStore } from "@/ai/secretStore";
import type { DocumentParseInput, DocumentParseResult, DocumentParser } from "@/types/document";

export type FakeProviderMode = "success" | "slow_stream" | "disconnect" | "rate_limit" | "auth_error" | "transient_5xx" | "timeout" | "malformed_json" | "schema_invalid" | "usage_missing" | "very_long_response" | "late_delta_after_cancel";

export class FakeProvider implements AIProvider {
  readonly key = "fake"; readonly displayName = "Fake Provider";
  readonly models = [{ id: "fake-text-v1", displayName: "Fake Text v1", providerKey: "fake", capabilities: new Set(["text_generation", "streaming", "structured_output"] as const), source: "cached" as const }];
  constructor(private readonly mode: FakeProviderMode = "success") {}
  getCapabilities(): AICapabilities { return this.models[0].capabilities; }
  async testConnection(_config: ResolvedProviderConfig, signal?: AbortSignal): Promise<AIConnectionResult> { if (signal?.aborted) return { status: "unknown", messageSafe: "Request cancelled." }; try { await this.outcome(); return { status: "success" }; } catch (error) { const normalized = this.normalizeError(error); return { status: normalized.code === "auth_error" ? "auth_error" : normalized.code === "rate_limited" ? "rate_limited" : normalized.code === "timeout" ? "network_error" : "unknown", messageSafe: normalized.messageSafe }; } }
  async generate(request: AIRequest, _config: ResolvedProviderConfig, signal: AbortSignal): Promise<AIResponse> { if (signal.aborted) throw new DOMException("Aborted", "AbortError"); await this.outcome(); const text = this.mode === "malformed_json" ? "{bad" : this.mode === "schema_invalid" ? "{}" : this.mode === "very_long_response" ? "x".repeat(20_000) : `Fake response for ${request.task.key}`; return { text, structured: request.structuredOutput ? (this.mode === "schema_invalid" ? {} : { ok: true }) : undefined, usage: this.mode === "usage_missing" ? undefined : { inputUnits: 0, outputUnits: 0 } }; }
  async *stream(request: AIRequest, config: ResolvedProviderConfig, signal: AbortSignal): AsyncIterable<AIStreamEvent> { yield { type: "start" }; if (this.mode === "slow_stream") await new Promise(resolve => setTimeout(resolve, 10)); const response = await this.generate(request, config, signal); if (signal.aborted) { yield { type: "cancelled" }; return; } yield { type: "text_delta", text: response.text }; if (this.mode === "late_delta_after_cancel") { await new Promise(resolve => setTimeout(resolve, 10)); if (signal.aborted) { yield { type: "cancelled" }; return; } yield { type: "text_delta", text: "late" }; } if (response.usage) yield { type: "usage", usage: response.usage }; yield { type: "completed", response: { ...response, text: response.text } }; }
  normalizeError(error: unknown): AIError { if (error instanceof DOMException && error.name === "AbortError") return { code: "cancelled", messageSafe: "Request cancelled.", retryable: false }; const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 0; if (status === 401) return { code: "auth_error", messageSafe: "Provider authentication failed.", retryable: false }; if (status === 429) return { code: "rate_limited", messageSafe: "Provider rate limit reached.", retryable: true }; if (status >= 500) return { code: "provider_unavailable", messageSafe: "Provider is temporarily unavailable.", retryable: true }; if (error instanceof Error && /timeout/i.test(error.message)) return { code: "timeout", messageSafe: "Provider request timed out.", retryable: true }; return { code: "unknown", messageSafe: "Provider request failed.", retryable: false }; }
  normalizeUsage(): undefined { return undefined; }
  private async outcome() { if (this.mode === "auth_error") throw { status: 401 }; if (this.mode === "rate_limit") throw { status: 429 }; if (this.mode === "disconnect" || this.mode === "transient_5xx") throw { status: 503 }; if (this.mode === "timeout") throw new Error("timeout"); }
}

export class FakeSecretStore implements SecretStore {
  private readonly values = new Map<string, string>();
  async saveSecret(ref: string, value: string): Promise<void> { if (!ref || !value) throw new Error("密钥引用和值不能为空。"); this.values.set(ref, value); }
  async getSecret(ref: string): Promise<string> { const value = this.values.get(ref); if (!value) throw new Error("测试密钥不存在。"); return value; }
  async deleteSecret(ref: string): Promise<void> { this.values.delete(ref); }
  async hasSecret(ref: string): Promise<boolean> { return this.values.has(ref); }
}

export class FakeDocumentParser implements DocumentParser {
  readonly id = "fake-text"; readonly version = "1.0.0";
  supports(input: Pick<DocumentParseInput, "mimeType">): boolean { return input.mimeType === "text/plain" || input.mimeType === "text/markdown"; }
  async parse(input: DocumentParseInput): Promise<DocumentParseResult> { const lines = input.text.split(/\r?\n/); return { status: "parsed", warnings: [], document: { documentId: input.documentId, projectFileId: input.projectFileId, title: input.title, mimeType: input.mimeType, language: null, pageCount: null, metadata: { parser: this.id }, warnings: [], blocks: lines.reduce<NonNullable<DocumentParseResult["document"]>["blocks"]>((blocks, text, lineIndex) => { if (!text) return blocks; blocks.push({ id: `${input.documentId}:line:${lineIndex + 1}`, type: text.startsWith("#") ? "heading" : "paragraph", text, order: blocks.length, level: text.startsWith("#") ? text.match(/^#+/)?.[0].length : undefined, locator: { format: "txt_md", lineStart: lineIndex + 1, lineEnd: lineIndex + 1 }, metadata: {} }); return blocks; }, []) } }; }
}
