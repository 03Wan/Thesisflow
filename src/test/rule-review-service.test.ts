import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ select: vi.fn(), execute: vi.fn() }));
vi.mock("@/lib/database", () => ({ getDatabase: async () => database }));

import { RuleCandidateRepository } from "@/repositories/ruleCandidateRepository";
import { requirementService } from "@/services/requirementService";
import { RuleReviewService } from "@/services/ruleReviewService";
import { workflowService } from "@/services/workflowService";
import type { RuleCandidate } from "@/types/document";

const candidate = (changes: Partial<RuleCandidate> = {}): RuleCandidate => ({
  id: "candidate-a", projectId: "project-a", projectFileId: "file-a", documentParseId: "parse-a", ruleKey: "references.total.min",
  category: "references", value: 20, unit: "items", rawText: "查阅文献20篇以上", locator: { format: "txt_md", lineStart: 1, lineEnd: 1 },
  confidence: 0.98, extractor: "deterministic-v2", condition: null, exception: null, status: "pending", createdAt: "2026-01-01", updatedAt: "2026-01-01", ...changes,
});

describe("RuleReviewService persisted decision boundary", () => {
  beforeEach(() => { vi.restoreAllMocks(); database.select.mockReset(); database.execute.mockReset().mockResolvedValue(undefined); });

  it("creates an active version, audit row and requirement only after explicit confirmation", async () => {
    const source = candidate();
    const repository = { findById: vi.fn().mockResolvedValue(source), setStatus: vi.fn() } as unknown as RuleCandidateRepository;
    database.select.mockImplementation(async (sql: string) => sql.includes("MAX(version)") ? [{ version: 0 }] : []);
    const createRequirement = vi.spyOn(requirementService, "create").mockImplementation(async (value) => value);
    const rule = await new RuleReviewService(repository).confirm(source.id);
    expect(rule).toMatchObject({ projectId: "project-a", status: "active", version: 1, value: 20 });
    expect(repository.setStatus).toHaveBeenCalledWith(source.id, "confirmed", expect.any(String));
    expect(database.execute.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO thesis_rules"))).toBe(true);
    expect(database.execute.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO rule_audit_log"))).toBe(true);
    expect(createRequirement).toHaveBeenCalledWith(expect.objectContaining({ projectId: "project-a", targetValue: 20 }));
  });

  it("rejects a pending candidate with an audit row and no active rule", async () => {
    const source = candidate(); const repository = { findById: vi.fn().mockResolvedValue(source), setStatus: vi.fn() } as unknown as RuleCandidateRepository;
    await new RuleReviewService(repository).reject(source.id);
    expect(repository.setStatus).toHaveBeenCalledWith(source.id, "rejected", expect.any(String));
    expect(database.execute.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO thesis_rules"))).toBe(false);
    expect(database.execute.mock.calls.some(([sql]) => String(sql).includes("rule_audit_log"))).toBe(true);
  });

  it("persists a conflict instead of overwriting the same scoped active rule", async () => {
    const source = candidate(); const repository = { findById: vi.fn().mockResolvedValue(source), setStatus: vi.fn() } as unknown as RuleCandidateRepository;
    database.select.mockResolvedValueOnce([{ id: "rule-old", value_json: "18", condition_json: null }]);
    await expect(new RuleReviewService(repository).confirm(source.id)).rejects.toThrow(/冲突/);
    expect(repository.setStatus).toHaveBeenCalledWith(source.id, "conflict", expect.any(String));
    expect(database.execute.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO rule_conflicts"))).toBe(true);
    expect(database.execute.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO thesis_rules"))).toBe(false);
  });

  it("projects a deadline only after confirmation", async () => {
    const source = candidate({ ruleKey: "deadline.defense", category: "deadline", value: { value: { start: "2026-04-25", end: "2026-04-26" }, beforeOrOn: false }, unit: null });
    const repository = { findById: vi.fn().mockResolvedValue(source), setStatus: vi.fn() } as unknown as RuleCandidateRepository;
    database.select.mockImplementation(async (sql: string) => sql.includes("MAX(version)") ? [{ version: 0 }] : []);
    vi.spyOn(workflowService, "list").mockResolvedValue([{ id: "stage-defense", projectId: "project-a", stageKey: "defense", stageNumber: 16, title: "论文答辩", status: "not_started", startedAt: null, completedAt: null, deadline: null, progress: 0, sortOrder: 16, createdAt: "2026-01-01", updatedAt: "2026-01-01" }]);
    const update = vi.spyOn(workflowService, "update").mockImplementation(async (_id, changes) => ({ id: "stage-defense", projectId: "project-a", stageKey: "defense", stageNumber: 16, title: "论文答辩", status: "not_started", startedAt: null, completedAt: null, deadline: changes.deadline ?? null, progress: 0, sortOrder: 16, createdAt: "2026-01-01", updatedAt: "2026-01-01" }));
    expect(update).not.toHaveBeenCalled();
    await new RuleReviewService(repository).confirm(source.id);
    expect(update).toHaveBeenCalledWith("stage-defense", expect.objectContaining({ deadline: "2026-04-25" }));
  });
});
