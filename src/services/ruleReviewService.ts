import { getDatabase } from "@/lib/database";
import { RuleCandidateRepository } from "@/repositories/ruleCandidateRepository";
import { requirementService } from "@/services/requirementService";
import { workflowService } from "@/services/workflowService";
import type { RuleCandidate, ThesisRule } from "@/types/document";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const label = (key: string) => key.replace(/_/g, " ");
const numberValue = (value: unknown) => typeof value === "number" ? value : typeof value === "object" && value && "value" in value && typeof value.value === "number" ? value.value : null;
const stageFor: Record<string, string> = { "deadline.topic_confirm": "topic", "deadline.taskbook": "taskbook", "deadline.proposal": "proposal", "deadline.first_draft": "first_draft", "deadline.midterm": "midterm", "deadline.final_draft": "final_draft", "deadline.review": "reviewer_review", "deadline.inspection": "inspection", "deadline.defense": "defense", "deadline.final_submission": "final_submission", "deadline.archive": "archive" };

/** Explicit user confirmation is the sole path from extracted candidates to active rules. */
export class RuleReviewService {
  constructor(private readonly candidates = new RuleCandidateRepository()) {}
  async confirm(candidateId: string, editedValue?: unknown): Promise<ThesisRule> {
    const candidate = await this.candidates.findById(candidateId); if (!candidate) throw new Error("未找到规则候选项。"); if (candidate.status !== "pending") throw new Error("该规则候选项已处理。");
    const value = editedValue === undefined ? candidate.value : editedValue; const database = await getDatabase(); const timestamp = now();
    const version = Number((await database.select<Array<{ version: number }>>("SELECT COALESCE(MAX(version), 0) AS version FROM thesis_rules WHERE project_id = ? AND rule_key = ?", [candidate.projectId, candidate.ruleKey]))[0]?.version ?? 0) + 1;
    const rule: ThesisRule = { id: id(), projectId: candidate.projectId, ruleKey: candidate.ruleKey, category: candidate.category, value, unit: candidate.unit, scope: "project", condition: candidate.condition, exception: candidate.exception, sourceCandidateId: candidate.id, sourceFileId: candidate.projectFileId, sourceLocator: candidate.locator, status: "active", version, effectiveFrom: timestamp, createdAt: timestamp, updatedAt: timestamp };
    await database.execute("INSERT INTO thesis_rules (id,project_id,rule_key,category,value_json,unit,scope,condition_json,exception_json,source_candidate_id,source_file_id,source_locator_json,status,version,effective_from,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [rule.id,rule.projectId,rule.ruleKey,rule.category,JSON.stringify(rule.value),rule.unit,rule.scope,rule.condition ? JSON.stringify(rule.condition) : null,rule.exception ? JSON.stringify(rule.exception) : null,rule.sourceCandidateId,rule.sourceFileId,JSON.stringify(rule.sourceLocator),rule.status,rule.version,rule.effectiveFrom,rule.createdAt,rule.updatedAt]);
    await this.candidates.setStatus(candidate.id, editedValue === undefined ? "confirmed" : "edited", timestamp);
    await database.execute("INSERT INTO rule_audit_log (id,project_id,rule_id,candidate_id,action,actor,before_json,after_json,created_at) VALUES (?,?,?,?,?,?,?,?,?)", [id(),candidate.projectId,rule.id,candidate.id,editedValue === undefined ? "confirm" : "edit_confirm","local_user",null,JSON.stringify(rule),timestamp]);
    await this.applyProjection(candidate, value, rule.unit, rule.id, timestamp);
    return rule;
  }
  private async applyProjection(candidate: RuleCandidate, value: unknown, unit: string | null, ruleId: string, timestamp: string) {
    const stageKey = stageFor[candidate.ruleKey];
    if (stageKey) { const deadline = typeof value === "string" ? value : value && typeof value === "object" && "value" in value && typeof value.value === "string" ? value.value : null; if (deadline) { const stages = await workflowService.list(candidate.projectId); const stage = stages.find((item) => item.stageKey === stageKey); if (stage && stage.deadline === null) await workflowService.update(stage.id, { deadline }); } return; }
    const target = numberValue(value); if (target === null) return;
    const database = await getDatabase(); const existing = await database.select<Array<{ id: string }>>("SELECT id FROM thesis_requirements WHERE project_id = ? AND requirement_key = ?", [candidate.projectId, candidate.ruleKey]);
    if (existing[0]) await requirementService.update(existing[0].id, { targetValue: target, unit: unit ?? "", description: `来自已确认规则 ${ruleId}` });
    else await requirementService.create({ id: id(), projectId: candidate.projectId, requirementKey: candidate.ruleKey, label: label(candidate.ruleKey), targetValue: target, currentValue: 0, unit: unit ?? "", status: "pending", description: `来自已确认规则 ${ruleId}`, createdAt: timestamp, updatedAt: timestamp });
  }
}
export const ruleReviewService = new RuleReviewService();
