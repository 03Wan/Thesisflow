import type { ContextItem, ContextPack, PromptTemplateDescriptor } from "@/ai/domain";

type ContextKind = NonNullable<ContextItem["type"]>;
export interface ContextInput { projectId: string; taskKey: string; trustedFacts?: ContextItem[]; confirmedRules?: ContextItem[]; currentStage?: ContextItem; currentPageState?: ContextItem; selectedText?: ContextItem; sourceItems?: ContextItem[]; userInstruction: string; }

export class ContextBuilder {
  constructor(private readonly budget = 12_000, private readonly perType = 4) {}
  build(template: PromptTemplateDescriptor, input: ContextInput): ContextPack {
    const required = template.requiredContext ?? [];
    const userInstruction: ContextItem = { id: "user_instruction", type: "user_instruction", trustLevel: "user_input", text: input.userInstruction, sizeEstimate: input.userInstruction.length };
    const all = [...(input.trustedFacts ?? []), ...(input.confirmedRules ?? []), ...(input.sourceItems ?? []), ...(input.currentStage ? [input.currentStage] : []), ...(input.currentPageState ? [input.currentPageState] : []), ...(input.selectedText ? [input.selectedText] : []), userInstruction].filter((item) => item.type !== undefined && required.includes(item.type));
    const chosen: ContextItem[] = []; const clipped: string[] = []; const counts = new Map<ContextKind, number>(); let size = 0;
    for (const item of all) {
      const estimated = item.sizeEstimate ?? item.text?.length ?? JSON.stringify(item.data ?? {}).length;
      if (/(?:api[_-]?key|secret|bearer\s+)/i.test(item.text ?? "")) { clipped.push(item.id); continue; }
      const type = item.type as ContextKind;
      if ((counts.get(type) ?? 0) >= this.perType || size + estimated > this.budget) { clipped.push(item.id); continue; }
      chosen.push({ ...item, sizeEstimate: estimated }); counts.set(type, (counts.get(type) ?? 0) + 1); size += estimated;
    }
    const ofType = (type: ContextKind) => chosen.filter((item) => item.type === type);
    const user = ofType("user_instruction")[0]; if (!user) throw new Error("用户指令不可省略");
    return { projectId: input.projectId, taskKey: input.taskKey, trustedFacts: ofType("project_fact"), confirmedRules: ofType("confirmed_rule"), currentStage: ofType("page_state")[0] ?? null, currentPageState: null, selectedText: ofType("selected_text")[0] ?? null, sourceItems: ofType("source"), userInstruction: user, items: chosen, manifest: { itemIds: chosen.map((item) => item.id), totalCharacters: size, clippedItemIds: clipped } };
  }
  preview(template: PromptTemplateDescriptor, input: ContextInput) { const pack = this.build(template, input); return { rules: pack.confirmedRules?.map((item) => item.id) ?? [], textFragments: pack.sourceItems?.map((item) => item.id) ?? [], sources: pack.sourceItems?.map((item) => ({ id: item.id, locator: item.sourceLocator })) ?? [], estimatedSize: pack.manifest.totalCharacters, manifest: pack.manifest }; }
}
