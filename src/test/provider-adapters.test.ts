import { describe, expect, it } from "vitest";
import { OpenAIAdapter } from "@/ai/adapters/openai";
import { AnthropicAdapter } from "@/ai/adapters/anthropic";
import { DeepSeekAdapter } from "@/ai/adapters/deepseek";
import { GeminiAdapter } from "@/ai/adapters/gemini";
import { parseStructured } from "@/ai/adapters/http";

const config = { secret: "sk_test_not_logged", defaultModel: "test-model" };
const request = { task: { key: "test", displayName: "test", requiredCapabilities: ["text_generation"] as const }, modelId: "test-model", prompt: { key: "test", version: "1", role: "user" as const, enabled: true }, context: { items: [{ id: "x", kind: "user_input" as const, content: "ping", trusted: true }], manifest: { itemIds: ["x"], totalCharacters: 4 } }, requestId: "request" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("real provider adapters", () => {
  it.each([[OpenAIAdapter, { output_text: "ok", usage: { input_tokens: 1, output_tokens: 2 }, id: "openai-id" }], [AnthropicAdapter, { content: [{ type: "text", text: "ok" }], usage: { input_tokens: 1, output_tokens: 2 }, id: "anthropic-id" }], [DeepSeekAdapter, { choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 1, completion_tokens: 2 }, id: "deepseek-id" }], [GeminiAdapter, { candidates: [{ content: { parts: [{ text: "ok" }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2 }, responseId: "gemini-id" }]] as const)("normalizes %p response and errors", async (Adapter, response) => { const adapter = new Adapter(async () => json(response)); await expect(adapter.generate(request, config, new AbortController().signal)).resolves.toMatchObject({ text: "ok" }); expect(adapter.normalizeError({ status: 401 }).code).toBe("auth_error"); expect(adapter.normalizeError({ status: 429 }).code).toBe("rate_limited"); });
  it("propagates cancellation without provider SDK events", async () => { const adapter = new OpenAIAdapter(async (_url, init) => { expect(init?.signal?.aborted).toBe(true); throw new DOMException("aborted", "AbortError"); }); const controller = new AbortController(); controller.abort(); await expect(adapter.generate(request, config, controller.signal)).rejects.toBeInstanceOf(DOMException); });
  it("fails closed when fallback JSON misses its schema", () => { const structuredRequest = { ...request, structuredOutput: { key: "result", version: "1", jsonSchema: { type: "object", required: ["answer"] } } }; expect(() => parseStructured(structuredRequest, "{}")).toThrow("missing"); });
});
