/** A test-only SecretStore. Production code must use the native credential-store boundary. */
export interface SecretStore { saveSecret(ref: string, value: string): Promise<void>; getSecret(ref: string): Promise<string>; deleteSecret(ref: string): Promise<void>; hasSecret(ref: string): Promise<boolean>; }

export class FakeSecretStore implements SecretStore {
  private readonly values = new Map<string, string>();
  async saveSecret(ref: string, value: string): Promise<void> { if (!ref || !value) throw new Error("密钥引用和值不能为空。"); this.values.set(ref, value); }
  async getSecret(ref: string): Promise<string> { const value = this.values.get(ref); if (!value) throw new Error("测试密钥不存在。"); return value; }
  async deleteSecret(ref: string): Promise<void> { this.values.delete(ref); }
  async hasSecret(ref: string): Promise<boolean> { return this.values.has(ref); }
}

/** This API intentionally exposes only configured state to webview/UI code. */
export interface SecretConfigurationStore { saveSecret(ref: string, value: string): Promise<void>; deleteSecret(ref: string): Promise<void>; hasSecret(ref: string): Promise<boolean>; }

/** Production boundary: native code writes to Windows Credential Manager and never exposes getSecret to the webview. */
export class TauriSecretConfigurationStore implements SecretConfigurationStore {
  async saveSecret(ref: string, value: string): Promise<void> { const { invoke } = await import("@tauri-apps/api/core"); await invoke("save_ai_secret", { request: { secretRef: ref, secretValue: value } }); }
  async deleteSecret(ref: string): Promise<void> { const { invoke } = await import("@tauri-apps/api/core"); await invoke("delete_ai_secret", { secretRef: ref }); }
  async hasSecret(ref: string): Promise<boolean> { const { invoke } = await import("@tauri-apps/api/core"); const status = await invoke<{ configured: boolean }>("ai_secret_status", { secretRef: ref }); return status.configured; }
}

const secretPatterns = [/(?:sk|rk|pk)_[A-Za-z0-9_-]{12,}/g, /Bearer\s+[A-Za-z0-9._-]{12,}/gi, /(?:api[_-]?key|secret|token)\s*[:=]\s*[^\s,;]+/gi];
export function redactSecrets(value: string): string { return secretPatterns.reduce((result, pattern) => result.replace(pattern, "[REDACTED]"), value); }
