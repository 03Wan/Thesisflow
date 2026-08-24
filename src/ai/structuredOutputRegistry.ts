export interface StructuredSchema { key: string; version: string; validate(value: unknown, sourceIds: readonly string[]): { valid: boolean; issues: string[] }; }
export class StructuredOutputRegistry {
  private readonly schemas = new Map<string, StructuredSchema>();
  register(schema: StructuredSchema) { this.schemas.set(`${schema.key}@${schema.version}`, schema); return this; }
  get(key: string, version: string) { const schema = this.schemas.get(`${key}@${version}`); if (!schema) throw new Error("Unknown structured output schema"); return schema; }
}

const advisor: StructuredSchema = {
  key: "advisor_suggestions", version: "v1",
  validate(value, sourceIds) {
    const v = value as Record<string, unknown>; const issues: string[] = [];
    const stringArray = (field: unknown) => Array.isArray(field) && field.every((item) => typeof item === "string");
    if (!v || typeof v !== "object" || typeof v.summary !== "string" || !stringArray(v.issues) || !stringArray(v.suggestions) || !stringArray(v.missing_information) || !["low", "medium", "high"].includes(String(v.risk_level)) || !stringArray(v.source_refs)) issues.push("模型返回格式异常");
    if (Array.isArray(v.source_refs) && v.source_refs.some((ref) => typeof ref !== "string" || !sourceIds.includes(ref))) issues.push("source_ref 不在 ContextPack 白名单");
    return { valid: !issues.length, issues };
  },
};

const cardFields = ["citation_summary", "research_question", "research_context", "theory_framework", "data_source", "sample", "time_period", "geography", "variables", "method", "model", "main_findings", "mechanism_findings", "robustness", "limitations", "contributions", "keywords", "use_for_thesis", "uncertainties"];
const statuses = ["supported", "partially_supported", "not_found", "ambiguous"];
const literatureCard: StructuredSchema = {
  key: "literature_card", version: "v1",
  validate(value, sourceIds) {
    const v = value as Record<string, unknown>; const issues: string[] = [];
    if (!v || typeof v !== "object") return { valid: false, issues: ["模型返回格式异常"] };
    for (const field of cardFields) {
      const entries = Array.isArray(v[field]) ? v[field] as unknown[] : [v[field]];
      if (!entries.length) { issues.push(`字段 ${field} 不满足证据格式`); continue; }
      entries.forEach((entry) => {
        const item = entry as Record<string, unknown> | undefined; const refs = item?.evidence_refs;
        if (!item || typeof item.value !== "string" || typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 1 || !Array.isArray(refs) || !refs.every((ref) => typeof ref === "string" && sourceIds.includes(ref)) || !statuses.includes(String(item.status))) { issues.push(`字段 ${field} 不满足证据格式`); return; }
        if ((item.status === "supported" || item.status === "partially_supported") && refs.length === 0) issues.push(`字段 ${field} 的支持性结论缺少 evidence_ref`);
        if (item.status === "not_found" && refs.length > 0) issues.push(`字段 ${field} 的 not_found 不应附带证据`);
      });
    }
    return { valid: !issues.length, issues };
  },
};

export const structuredOutputs = new StructuredOutputRegistry().register(advisor).register(literatureCard);
