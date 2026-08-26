import type { AIProvider } from "@/ai/domain";
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

export const providerRegistry = new ProviderRegistry().register(new OpenAIAdapter()).register(new AnthropicAdapter()).register(new GeminiAdapter()).register(new DeepSeekAdapter());
