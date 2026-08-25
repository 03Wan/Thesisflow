import { readBrowserProviderConfigs, type BrowserProviderConfig } from "@/ai/browserProviderConfig";

export const getActiveBrowserProvider = () => readBrowserProviderConfigs().find((provider) => provider.enabled && provider.secret);

const defaultModel = (config: BrowserProviderConfig) => config.model.trim() || (config.id === "gemini" ? "gemini-2.0-flash" : config.id === "anthropic" ? "claude-3-5-haiku-latest" : config.id === "deepseek" ? "deepseek-chat" : "gpt-4o-mini");

export async function askConfiguredProvider(config: BrowserProviderConfig, prompt: string): Promise<string> {
  const base = config.baseUrl.replace(/\/$/, ""); const model = defaultModel(config); let response: Response;
  if (config.protocol === "gemini") { response = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.secret)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) }); if (!response.ok) throw new Error("Provider request failed"); const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }; return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? ""; }
  if (config.protocol === "anthropic") { response = await fetch(`${base}/messages`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": config.secret, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 700, messages: [{ role: "user", content: prompt }] }) }); if (!response.ok) throw new Error("Provider request failed"); const body = await response.json() as { content?: Array<{ text?: string }> }; return body.content?.map((part) => part.text ?? "").join("") ?? ""; }
  response = await fetch(`${base}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.secret}` }, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.3 }) }); if (!response.ok) throw new Error("Provider request failed"); const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> }; return body.choices?.[0]?.message?.content ?? "";
}
