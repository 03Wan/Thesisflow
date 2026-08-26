export const researchMethodOptions = ["实证研究", "问卷研究", "访谈研究", "案例研究"] as const;

export type ResearchMethod = (typeof researchMethodOptions)[number];

const isResearchMethod = (value: string): value is ResearchMethod =>
  (researchMethodOptions as readonly string[]).includes(value);

/** Projects created before multi-select support may contain free-form text. */
export function parseResearchMethods(value: string | null | undefined): ResearchMethod[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is ResearchMethod => typeof item === "string" && isResearchMethod(item));
  } catch {
    // Fall through to legacy comma-separated text.
  }
  return value.split(/[，,、]/).map((item) => item.trim()).filter(isResearchMethod);
}

export function serializeResearchMethods(methods: readonly ResearchMethod[]): string {
  return JSON.stringify(researchMethodOptions.filter((method) => methods.includes(method)));
}
