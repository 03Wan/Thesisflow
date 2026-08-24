import type { AIProvider, AIRequest, AIResponse, AIStreamEvent, ResolvedProviderConfig, AIConnectionResult, AICapabilities, AIError } from "@/ai/domain";
import { OpenAIAdapter } from "@/ai/adapters/openai";
import { AnthropicAdapter } from "@/ai/adapters/anthropic";
import { GeminiAdapter } from "@/ai/adapters/gemini";
import { DeepSeekAdapter } from "@/ai/adapters/deepseek";

export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();
  register(provider: AIProvider): this { if (!provider.key) throw new Error("Provider key 不能为空。"); if (this.providers.has(provider.key)) throw new Error(`Provider 已注册：${provider.key}`); this.providers.set(provider.key, provider); return this; }
  get(providerKey: string): AIProvider { const provider = this.providers.get(providerKey); if (!provider) throw new Error(`Provider 未注册：${providerKey}`); return provider; }
  list(): AIProvider[] { return [...this.providers.values()]; }
}

export type FakeProviderMode = "success" | "slow_stream" | "disconnect" | "rate_limit" | "auth_error" | "transient_5xx" | "timeout" | "malformed_json" | "schema_invalid" | "usage_missing" | "very_long_response" | "late_delta_after_cancel";
export class FakeProvider implements AIProvider {
  readonly key = "fake";
  readonly displayName = "Fake Provider";
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

export const providerRegistry = new ProviderRegistry().register(new FakeProvider()).register(new OpenAIAdapter()).register(new AnthropicAdapter()).register(new GeminiAdapter()).register(new DeepSeekAdapter());
