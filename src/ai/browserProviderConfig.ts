export type BrowserProviderProtocol = "openai" | "anthropic" | "gemini";

export type BrowserProviderConfig = {
  id: string;
  name: string;
  protocol: BrowserProviderProtocol;
  secret: string;
  model: string;
  baseUrl: string;
  enabled: boolean;
};

const configKey = "thesisflow/ai/browser-provider-configs";

export function readBrowserProviderConfigs(): BrowserProviderConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(configKey) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(isConfig) : [];
  } catch {
    return [];
  }
}

export function saveBrowserProviderConfig(config: BrowserProviderConfig) {
  const configs = readBrowserProviderConfigs();
  const next = [...configs.filter((item) => item.id !== config.id), config];
  window.localStorage.setItem(configKey, JSON.stringify(next));
}

export function removeBrowserProviderConfig(id: string) {
  window.localStorage.setItem(configKey, JSON.stringify(readBrowserProviderConfigs().filter((item) => item.id !== id)));
}

function isConfig(value: unknown): value is BrowserProviderConfig {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.secret === "string" && typeof item.model === "string" && typeof item.baseUrl === "string" && typeof item.enabled === "boolean" && (item.protocol === "openai" || item.protocol === "anthropic" || item.protocol === "gemini");
}
