import type { PromptTemplateDescriptor } from "@/ai/domain";

/** Versioned code registry; no feature page may own an ad-hoc prompt string. */
export class PromptTemplateRegistry {
  private readonly templates = new Map<string, PromptTemplateDescriptor>();
  private keyOf(template: Pick<PromptTemplateDescriptor, "key" | "version">): string { return `${template.key}@${template.version}`; }
  register(template: PromptTemplateDescriptor): this { if (!template.key || !template.version) throw new Error("Prompt template 必须包含 key 和 version。"); const key = this.keyOf(template); if (this.templates.has(key)) throw new Error(`Prompt template 已注册：${key}`); this.templates.set(key, template); return this; }
  get(key: string, version: string): PromptTemplateDescriptor { const template = this.templates.get(`${key}@${version}`); if (!template) throw new Error(`Prompt template 未注册：${key}@${version}`); return template; }
  list(): PromptTemplateDescriptor[] { return [...this.templates.values()]; }
}

/** Intentionally empty until an approved Phase 4 task adds a reviewed versioned template. */
export const promptTemplateRegistry = new PromptTemplateRegistry();
