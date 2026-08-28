import type { ThesisRequirement } from "@/types/domain";
import type { CitationAudit, ThesisExportManifest, ThesisRevision, WritingWorkspace } from "@/types/writing";
import type { EvidenceBlock } from "./evidenceGuardrails";
import type { Phase9CheckResult, Phase9Issue, Phase9ManualConfirmation, Phase9Report, Phase9Status, ReleaseCandidate } from "@/types/phase9";

export const PHASE9_CHECKER_VERSION = "phase9-checker-1.0.0";
export const PHASE9_SCHEMA_VERSION = "phase9-schema-1";
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
export async function sha256(value: unknown): Promise<string> { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))))).map((x) => x.toString(16).padStart(2, "0")).join(""); }
const text = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/gu, " ").trim();
const revisionHash = async (workspace: WritingWorkspace) => sha256(workspace.revisions[0]?.contentHash ?? workspace.sections.map((section) => ({ id: section.id, title: section.title, content: section.content })));
const check = async (input: Omit<Phase9CheckResult, "id" | "revisionHash" | "checkedAt" | "checkerVersion">, workspace: WritingWorkspace): Promise<Phase9CheckResult> => ({ ...input, id: id(), revisionHash: await revisionHash(workspace), checkedAt: now(), checkerVersion: PHASE9_CHECKER_VERSION });

export interface Phase9Inputs { workspace: WritingWorkspace; requirements: ThesisRequirement[]; literatureIds: string[]; evidence: EvidenceBlock[]; exports?: ThesisExportManifest[]; citationAudit?: CitationAudit; }

export async function runPhase9Checks(inputs: Phase9Inputs): Promise<Phase9Report> {
  const { workspace, requirements, literatureIds, evidence, exports = [], citationAudit } = inputs;
  const checks: Phase9CheckResult[] = [];
  for (const requirement of requirements) {
    const isNumeric = requirement.targetValue !== null;
    const observed = requirement.currentValue;
    const expected = requirement.targetValue;
    const status: Phase9Status = isNumeric ? (requirement.status === "met" || observed >= (expected ?? 0) ? "PASS" : "FAIL") : "REVIEW";
    checks.push(await check({ checkId: `requirement:${requirement.id}`, category: "requirements", label: requirement.label, status, severity: status === "FAIL" ? "blocking" : "medium", machineVerifiable: isNumeric, observed, expected, evidence: [{ id: requirement.id, label: `confirmed requirement · ${requirement.requirementKey}` }], manualAction: isNumeric ? null : "请学生核对该自然语言要求是否满足。" }, workspace));
  }
  const citedLiterature = new Set(workspace.citations.map((citation) => citation.literatureId));
  const knownLiterature = new Set(literatureIds);
  for (const citation of workspace.citations) {
    const status: Phase9Status = knownLiterature.has(citation.literatureId) ? "PASS" : "FAIL";
    checks.push(await check({ checkId: `citation:${citation.id}`, category: "citation/source", label: `引用 ${citation.anchor}`, status, severity: "blocking", machineVerifiable: true, observed: citation.literatureId, expected: "当前项目存在 literature record", evidence: [{ id: citation.id, label: citation.renderText, locator: `${citation.sectionId}#${citation.anchor}` }, { id: citation.literatureId, label: "literature record" }] }, workspace));
  }
  const audit = citationAudit ?? { citationCount: workspace.citations.length, distinctLiteratureCount: citedLiterature.size, orphanCount: 0, duplicateAnchorCount: 0, staleCount: 0 };
  checks.push(await check({ checkId: "citation:orphan-summary", category: "citation/source", label: "正文引用与文献记录双向一致", status: audit.orphanCount ? "FAIL" : "PASS", severity: "blocking", machineVerifiable: true, observed: audit.orphanCount, expected: 0, evidence: workspace.citations.map((citation) => ({ id: citation.id, label: citation.renderText, locator: citation.sectionId })) }, workspace));
  const staleEvidence = evidence.filter((item) => item.stale);
  for (const link of workspace.links.filter((item) => item.sourceType === "evidence")) {
    const stale = staleEvidence.some((item) => item.id === link.sourceId) || link.status === "stale";
    checks.push(await check({ checkId: `evidence:${link.id}`, category: "empirical consistency", label: link.label, status: stale ? "FAIL" : "PASS", severity: stale ? "high" : "medium", machineVerifiable: true, observed: stale ? "stale" : "linked", expected: "linked and current", evidence: [{ id: link.id, label: link.label, locator: link.locator }, { id: link.sourceId, label: "Phase 7 evidence" }] }, workspace));
  }
  for (const section of workspace.sections) {
    const body = text(`${section.title} ${section.content}`);
    if (!body) checks.push(await check({ checkId: `structure:empty:${section.id}`, category: "logic/structure", label: `章节“${section.title}”有正文`, status: "FAIL", severity: "high", machineVerifiable: true, observed: 0, expected: "> 0 字符", evidence: [{ id: section.id, label: section.title, locator: section.id }] }, workspace));
    if (/TODO|待补充|placeholder|lorem/iu.test(body)) checks.push(await check({ checkId: `structure:placeholder:${section.id}`, category: "logic/structure", label: `章节“${section.title}”无占位文本`, status: "FAIL", severity: "high", machineVerifiable: true, observed: body.match(/TODO|待补充|placeholder|lorem/iu)?.[0] ?? "", expected: "无占位文本", evidence: [{ id: section.id, label: section.title, locator: section.id }] }, workspace));
    if (body.length > 0 && section.headingLevel > 1 && !workspace.sections.some((parent) => parent.sortOrder < section.sortOrder && parent.headingLevel === section.headingLevel - 1)) checks.push(await check({ checkId: `structure:heading:${section.id}`, category: "logic/structure", label: `章节“${section.title}”层级可解释`, status: "REVIEW", severity: "low", machineVerifiable: false, observed: section.headingLevel, expected: "存在上级标题", evidence: [{ id: section.id, label: section.title }], manualAction: "请学生确认章节层级与论证逻辑。" }, workspace));
    if (/因此|结果表明|显著/iu.test(body) && !workspace.links.some((link) => link.sectionId === section.id && link.sourceType === "evidence")) checks.push(await check({ checkId: `empirical:unbound:${section.id}`, category: "empirical consistency", label: `章节“${section.title}”的结果表述有 evidence 绑定`, status: "REVIEW", severity: "high", machineVerifiable: false, observed: "存在结果性表述但无 evidence link", expected: "学生绑定真实 evidence", evidence: [{ id: section.id, label: section.title, locator: section.id }], manualAction: "请绑定真实分析 evidence，或确认该段不是实证结论。" }, workspace));
  }
  const manifest = exports.at(-1);
  checks.push(await check({ checkId: "format:export", category: "format/export", label: "最终导出快照可追溯", status: manifest ? (manifest.warnings.length || manifest.manualCheck.length ? "REVIEW" : "PASS") : "UNSUPPORTED", severity: "medium", machineVerifiable: Boolean(manifest), observed: manifest ? { path: manifest.outputPath, hash: manifest.fileHash, warnings: manifest.warnings, manualCheck: manifest.manualCheck } : "尚无导出 manifest", expected: "存在带 hash 的导出 manifest", evidence: manifest ? [{ id: manifest.id, label: manifest.outputPath }] : [], manualAction: manifest?.warnings.length || manifest?.manualCheck.length ? [...manifest.warnings, ...manifest.manualCheck].join("；") : "请先导出 DOCX 并在 Word/WPS 中确认分页、目录和字段。" }, workspace));
  const issues = checks.filter((item) => item.status !== "PASS").map((item): Phase9Issue => ({ id: id(), fingerprint: `${item.checkId}:${JSON.stringify(item.observed)}`, category: item.category, sourceChecker: item.checkerVersion, severity: item.severity, status: "open", sectionId: item.evidence[0]?.locator?.split("#")[0] ?? null, anchor: item.evidence[0]?.locator?.includes("#") ? item.evidence[0].locator.split("#")[1] : null, sourceIds: item.evidence.map((entry) => entry.id), evidence: item.evidence, message: item.status === "FAIL" ? `${item.label}：机器核验未通过` : item.status === "REVIEW" ? `${item.label}：需要学生人工确认` : `${item.label}：当前检查器不支持可靠判断`, observed: item.observed, expected: item.expected, createdAt: item.checkedAt, checkedAt: item.checkedAt, checkVersion: item.checkerVersion }));
  return { revisionHash: await revisionHash(workspace), checks, issues, generatedAt: now(), checkerVersion: PHASE9_CHECKER_VERSION };
}

export function mergeIssues(previous: Phase9Issue[], report: Phase9Report): Phase9Issue[] { const fingerprints = new Set(report.issues.map((issue) => issue.fingerprint)); return [...report.issues.map((issue) => { const old = previous.find((candidate) => candidate.fingerprint === issue.fingerprint); return old ? { ...issue, id: old.id, status: old.status === "dismissed" ? "dismissed" : issue.status, dismissReason: old.dismissReason } : issue; }), ...previous.filter((issue) => !fingerprints.has(issue.fingerprint)).map((issue) => ({ ...issue, status: "stale" as const }))]; }
export function confirmManual(confirmation: Omit<Phase9ManualConfirmation, "id" | "confirmedAt">): Phase9ManualConfirmation { return { ...confirmation, id: id(), confirmedAt: now() }; }
export function isReady(report: Phase9Report, confirmations: Phase9ManualConfirmation[] = []): boolean { return !report.issues.some((issue) => issue.status === "open" && (issue.severity === "blocking" || issue.severity === "high")) && report.checks.filter((check) => check.status === "REVIEW" || check.status === "UNSUPPORTED").every((check) => confirmations.some((confirmation) => confirmation.checkId === check.checkId)); }
export async function createReleaseCandidate(inputs: { workspace: WritingWorkspace; report: Phase9Report; requirements: ThesisRequirement[]; exports?: ThesisExportManifest[]; confirmations?: Phase9ManualConfirmation[]; label?: string; }): Promise<ReleaseCandidate> {
  const { workspace, report, requirements, exports = [], confirmations = [], label = `RC${(workspace.document.metadata.releaseCandidateCount as number | undefined ?? 0) + 1}` } = inputs;
  const revision = workspace.revisions[0] ?? { id: "working", documentId: workspace.document.id, projectId: workspace.document.projectId, versionNumber: workspace.document.activeVersion, source: "student", label: "working", snapshot: workspace.sections, contentHash: report.revisionHash, createdAt: now() } as ThesisRevision;
  const requirementsHash = await sha256(requirements); const citationHash = await sha256(workspace.citations); const evidenceHash = await sha256(workspace.links); const exportManifest = exports.at(-1) ?? null;
  if (!isReady(report, confirmations)) throw new Error("存在未处理的阻断问题，或 REVIEW/UNSUPPORTED 尚未完成学生确认，不能标记为 Ready。");
  const snapshotBase = { projectId: workspace.document.projectId, documentId: workspace.document.id, label, revisionHash: report.revisionHash, requirementsHash, citationHash, evidenceHash, exportManifest, report };
  return { id: id(), projectId: workspace.document.projectId, documentId: workspace.document.id, label, status: "candidate", ready: true, generatedAt: now(), revisionId: revision.id, revisionHash: report.revisionHash, requirementsSnapshot: { version: `requirements-${requirementsHash.slice(0, 12)}`, hash: requirementsHash, ids: requirements.map((item) => item.id) }, citationSnapshot: { hash: citationHash, citationIds: workspace.citations.map((item) => item.id), literatureIds: [...new Set(workspace.citations.map((item) => item.literatureId))] }, evidenceSnapshot: { hash: evidenceHash, linkIds: workspace.links.map((item) => item.id), staleIds: workspace.links.filter((item) => item.status === "stale").map((item) => item.id) }, qaSummary: { openBlocking: report.issues.filter((item) => item.status === "open" && item.severity === "blocking").length, openFail: report.issues.filter((item) => item.status === "open" && item.message.includes("未通过")).length, review: report.issues.filter((item) => item.message.includes("人工确认")).length, dismissed: report.issues.filter((item) => item.status === "dismissed").length, unsupported: report.checks.filter((item) => item.status === "UNSUPPORTED").length, manualConfirmations: confirmations.length }, exportManifest, manifestHash: await sha256(snapshotBase), appVersion: "0.2.0", schemaVersion: PHASE9_SCHEMA_VERSION, checkerVersion: PHASE9_CHECKER_VERSION, backup: { revision, sections: structuredClone(workspace.sections), citations: structuredClone(workspace.citations), links: structuredClone(workspace.links) } };
}
