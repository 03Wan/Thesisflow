import type { AICapabilities, AIConnectionResult, AIError, AIModelDescriptor, AIProvider, AIRequest, AIResponse, AIStreamEvent, AIUsage, ResolvedProviderConfig } from "@/ai/domain";

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
const official = (override: string | undefined, fallback: string) => (override ?? fallback).replace(/\/$/, "");
const safe = (value: unknown) => value instanceof Error ? value.message.replace(/(?:sk|rk|pk)_[\w-]+|Bearer\s+\S+/g, "[REDACTED]") : "Provider request failed";
export const normalizedError = (error: unknown): AIError => {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 0;
  if (status === 401 || status === 403) return { code: "auth_error", messageSafe: "Provider authentication failed.", retryable: false };
  if (status === 429) return { code: "rate_limited", messageSafe: "Provider rate limit reached.", retryable: true };
  if (status >= 500) return { code: "provider_unavailable", messageSafe: "Provider is temporarily unavailable.", retryable: true };
  if (error instanceof DOMException && error.name === "AbortError") return { code: "cancelled", messageSafe: "Request cancelled.", retryable: false };
  if (error instanceof Error && /timeout/i.test(error.message)) return { code: "timeout", messageSafe: "Provider request timed out.", retryable: true };
  return { code: "unknown", messageSafe: safe(error), retryable: false };
};
export const usage = (value: unknown): AIUsage | undefined => { const u = value as { input_tokens?: number; output_tokens?: number; cached_tokens?: number; prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }; if (!u || typeof u !== "object") return undefined; return { inputUnits: u.input_tokens ?? u.prompt_tokens, outputUnits: u.output_tokens ?? u.completion_tokens, cachedUnits: u.cached_tokens ?? u.prompt_tokens_details?.cached_tokens }; };
/** Context is serialized as labelled data; no document text is ever promoted to an instruction role. */
export const promptText = (request: AIRequest) => request.context.items.map((item) => `[${item.type ?? item.kind ?? "context"}]\n${item.text ?? item.content ?? JSON.stringify(item.data ?? {})}`).join("\n\n");
export const structured = (request: AIRequest) => request.structuredOutput ? { type: "json_schema", json_schema: { name: request.structuredOutput.key.replace(/[^A-Za-z0-9_-]/g, "_"), strict: true, schema: request.structuredOutput.jsonSchema } } : undefined;
export function parseStructured(request: AIRequest, text: string): unknown | undefined { if (!request.structuredOutput) return undefined; let value: unknown; try { value = JSON.parse(text); } catch { throw new Error("Structured output is not valid JSON."); } const schema = request.structuredOutput.jsonSchema; if (schema.type === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) throw new Error("Structured output does not match object schema."); if (Array.isArray(schema.required) && typeof value === "object" && value && schema.required.some((key) => !(key in (value as Record<string, unknown>)))) throw new Error("Structured output is missing required fields."); return value; }
export async function* sse(response: Response, signal: AbortSignal): AsyncIterable<AIStreamEvent> { if (!response.body) throw new Error("Streaming response has no body"); yield { type: "start" } as AIStreamEvent; const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; try { while (true) { if (signal.aborted) { yield { type: "cancelled" } as AIStreamEvent; return; } const part = await reader.read(); if (part.done) break; buffer += decoder.decode(part.value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) { if (!line.startsWith("data:")) continue; const data = line.slice(5).trim(); if (!data || data === "[DONE]") continue; try { const event = JSON.parse(data); const text = event.delta?.content ?? event.choices?.[0]?.delta?.content ?? event.delta?.text ?? event.output_text?.delta; if (text) yield { type: "text_delta", text } as AIStreamEvent; if (event.usage) yield { type: "usage", usage: usage(event.usage) ?? {} }; } catch { /* Ignore provider metadata; incomplete data remains buffered until newline. */ } } } yield { type: "completed", response: { text: "" } }; } finally { reader.releaseLock(); } }

export abstract class HttpProviderAdapter implements AIProvider {
  abstract readonly key: string; abstract readonly displayName: string; abstract readonly defaultBaseUrl: string; abstract readonly capabilities: AICapabilities;
  constructor(protected readonly fetcher: FetchLike = fetch) {}
  getCapabilities(): AICapabilities { return this.capabilities; }
  abstract generate(request: AIRequest, config: ResolvedProviderConfig, signal: AbortSignal): Promise<AIResponse>;
  abstract stream(request: AIRequest, config: ResolvedProviderConfig, signal: AbortSignal): AsyncIterable<AIStreamEvent>;
  normalizeError(error: unknown): AIError { return normalizedError(error); }
  normalizeUsage(response: unknown): AIUsage | undefined { return usage(response); }
  async testConnection(config: ResolvedProviderConfig, signal?: AbortSignal): Promise<AIConnectionResult> { try { const modelId = config.defaultModel ?? ""; await this.generate({ task: { key: "connection_test", displayName: "Connection test", requiredCapabilities: ["text_generation"] }, modelId, prompt: { key: "connection.test", version: "1", role: "user", enabled: true }, context: { items: [{ id: "ping", kind: "user_input", content: "ping", trusted: true }], manifest: { itemIds: ["ping"], totalCharacters: 4 } }, requestId: crypto.randomUUID() }, config, signal ?? new AbortController().signal); return { status: "success", modelId }; } catch (error) { const e = this.normalizeError(error); return { status: e.code === "auth_error" ? "auth_error" : e.code === "rate_limited" ? "rate_limited" : e.code === "provider_unavailable" ? "network_error" : "unknown", messageSafe: e.messageSafe }; } }
  protected base(config: ResolvedProviderConfig): string { return official(config.baseUrlOverride, this.defaultBaseUrl); }
  protected async json(response: Response): Promise<Record<string, unknown>> { if (!response.ok) throw { status: response.status }; return response.json() as Promise<Record<string, unknown>>; }
  protected model(id: string, source: AIModelDescriptor["source"] = "user"): AIModelDescriptor { return { id, displayName: id, providerKey: this.key, capabilities: this.capabilities, source }; }
}
