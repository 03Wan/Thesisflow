import JSZip from "jszip";
import type { Phase10Inputs, DefenseCard, DefenseSource, DefenseWorkspace, SlideMaterial, PracticeQuestion, RehearsalSession, ArchiveArtifact, ArchiveManifest, ArchivePackage, RecoveryReport } from "@/types/phase10";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
export async function sha256(value: string | Uint8Array): Promise<string> { const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value; return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((x) => x.toString(16).padStart(2, "0")).join(""); }
const plain = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/gu, " ").trim();
const source = (sectionId: string, label: string, revisionHash: string): DefenseSource => ({ id: sectionId, label, locator: `${sectionId}@${revisionHash.slice(0, 12)}`, sourceType: "section" });

export function buildDefenseWorkspace(inputs: Phase10Inputs): DefenseWorkspace {
  const { releaseCandidate: rc, sections } = inputs;
  const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const cards: DefenseCard[] = ordered.filter((section) => plain(section.content)).map((section, index) => ({ id: id(), projectId: rc.projectId, kind: index === 0 ? "problem" : index === ordered.length - 1 ? "conclusion" : "evidence", title: section.title, body: plain(section.content), sources: [source(section.id, section.title, rc.revisionHash)], order: index, hidden: false, stale: false, sourceRevisionHash: rc.revisionHash, updatedAt: now() }));
  return { id: id(), projectId: rc.projectId, sourceRcId: rc.id, sourceRevisionHash: rc.revisionHash, stale: false, cards, createdAt: now(), updatedAt: now() };
}

export function markDefenseStale(workspace: DefenseWorkspace, activeRevisionHash: string): DefenseWorkspace { return { ...workspace, stale: workspace.sourceRevisionHash !== activeRevisionHash, cards: workspace.cards.map((card) => ({ ...card, stale: card.sourceRevisionHash !== activeRevisionHash })), updatedAt: now() }; }

export function buildSlideMaterials(workspace: DefenseWorkspace): SlideMaterial[] {
  const visible = workspace.cards.filter((card) => !card.hidden);
  return visible.map((card, index) => ({ id: id(), projectId: workspace.projectId, order: index, title: card.title, purpose: card.kind, body: card.body, sources: card.sources, speakerNotes: `基于“${card.title}”证据卡进行说明。`, reviewFlags: card.sources.length ? [] : ["REVIEW：缺少来源"], stale: workspace.stale || card.stale }));
}

export function buildPracticeQuestions(inputs: Phase10Inputs, workspace: DefenseWorkspace): PracticeQuestion[] {
  const risks = (inputs.issues ?? []).filter((issue) => issue.status === "open" && issue.severity !== "low");
  const cards = workspace.cards.filter((card) => !card.hidden);
  return [...cards.map((card) => ({ id: id(), projectId: workspace.projectId, category: card.kind, prompt: `请解释“${card.title}”在本研究中的作用。`, sources: card.sources, answerDraft: "", answerAdvice: card.sources.length ? `回答时引用：${card.sources.map((item) => item.label).join("、")}` : "证据不足，请先补充来源。", status: "todo" as const, custom: false, generationVersion: inputs.releaseCandidate.checkerVersion })), ...risks.map((issue) => ({ id: id(), projectId: workspace.projectId, category: "Phase 9 review", prompt: `如何处理：${issue.message}`, sources: issue.evidence.map((item) => ({ id: item.id, label: item.label, locator: item.locator, sourceType: "evidence" as const })), answerDraft: "", answerAdvice: "这是练习题，不代表真实评委问题；请依据来源作答。", status: "review" as const, custom: false, generationVersion: inputs.releaseCandidate.checkerVersion }))];
}

export function createRehearsal(projectId: string, questionIds: string[], selfAssessment = "", notes = ""): RehearsalSession { return { id: id(), projectId, startedAt: now(), endedAt: null, questionIds: [...questionIds], selfAssessment, notes }; }

const safePath = (path: string) => path.replace(/\\/g, "/");
export async function createArchivePackage(inputs: { projectId: string; appVersion: string; source: string; version: string; files: Array<{ logicalId: string; relativePath: string; content: string | Uint8Array; type: string; optional?: boolean }> }): Promise<ArchivePackage> {
  const files: Record<string, string | Uint8Array> = {}; const artifacts: ArchiveArtifact[] = [];
  for (const entry of inputs.files) { const relativePath = safePath(entry.relativePath); if (!relativePath || /^[\\/]/u.test(entry.relativePath) || relativePath.includes("../") || relativePath.includes("/..") || /^[A-Za-z]:/u.test(relativePath) || /^(archive_manifest\.json|README\.md)$/iu.test(relativePath)) throw new Error(`非法归档路径：${entry.relativePath}`); if (/\.(env|pem|key|log)$/iu.test(relativePath) || /(token|secret|api[_-]?key)/iu.test(relativePath)) throw new Error(`归档拒绝敏感文件：${relativePath}`); if (files[relativePath] !== undefined) throw new Error(`归档路径冲突：${relativePath}`); files[relativePath] = entry.content; const bytes = typeof entry.content === "string" ? new TextEncoder().encode(entry.content) : entry.content; artifacts.push({ logicalId: entry.logicalId, relativePath, size: bytes.byteLength, sha256: await sha256(bytes), type: entry.type, source: inputs.source, version: inputs.version, optional: entry.optional ?? false }); }
  const readme = "# ThesisFlow Archive\n\nThis package is an immutable student-owned snapshot. Verify archive_manifest.json before restore.\n"; files["README.md"] = readme; const readmeBytes = new TextEncoder().encode(readme); artifacts.push({ logicalId: "archive-readme", relativePath: "README.md", size: readmeBytes.byteLength, sha256: await sha256(readmeBytes), type: "documentation", source: inputs.source, version: inputs.version, optional: false });
  const manifest: ArchiveManifest = { schemaVersion: "phase10-archive-1", archiveId: id(), projectId: inputs.projectId, createdAt: now(), appVersion: inputs.appVersion, artifacts, warnings: [] }; files["archive_manifest.json"] = JSON.stringify(manifest, null, 2); return { manifest, files };
}

export async function verifyArchivePackage(pkg: ArchivePackage): Promise<{ valid: boolean; errors: string[] }> { const errors: string[] = []; for (const artifact of pkg.manifest.artifacts) { const content = pkg.files[artifact.relativePath]; if (content === undefined) { if (!artifact.optional) errors.push(`缺失文件：${artifact.relativePath}`); continue; } const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content; if (bytes.byteLength !== artifact.size) errors.push(`大小不一致：${artifact.relativePath}`); if (await sha256(bytes) !== artifact.sha256) errors.push(`hash 不一致：${artifact.relativePath}`); } return { valid: errors.length === 0, errors }; }

export async function zipArchivePackage(pkg: ArchivePackage): Promise<Blob> { const check = await verifyArchivePackage(pkg); if (!check.valid) throw new Error(`归档校验失败：${check.errors.join("；")}`); const zip = new JSZip(); for (const [path, content] of Object.entries(pkg.files)) zip.file(path, content); return zip.generateAsync({ type: "blob", mimeType: "application/zip" }); }
export async function createRecoveryReport(pkg: ArchivePackage, projectId: string, migrationVersion: string): Promise<RecoveryReport> { const check = await verifyArchivePackage(pkg); return { operationId: id(), projectId, inputManifestHash: await sha256(JSON.stringify(pkg.manifest)), restoredArtifactIds: check.valid ? pkg.manifest.artifacts.map((item) => item.logicalId) : [], migrationVersion, status: check.valid ? "completed" : "rejected", warnings: check.errors, createdAt: now() }; }
