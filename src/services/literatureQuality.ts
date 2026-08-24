import { normalizeAuthor, normalizeTitle, type ImportedMetadata } from "@/services/literatureImportPipeline";
import { normalizeIdentifier } from "@/services/literatureServices";
import type { LiteratureChunk } from "@/types/literature";

export type MetadataMatchKind = "exact_identifier" | "strong_metadata" | "possible" | "related_version" | "separate";
export type MetadataMatchDecision = { kind: MetadataMatchKind; autoMerge: boolean; reasons: string[] };

const versionTypes = new Set(["conference", "conference-paper", "proceedings-article", "preprint", "posted-content", "journal", "journal-article", "article"]);
const comparableTitle = (value?: string) => normalizeTitle(value ?? "").toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu, "");
const firstAuthor = (value?: string[]) => normalizeAuthor(value?.[0] ?? "").toLocaleLowerCase();

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
}

export function titleSimilarity(left?: string, right?: string) {
  const a = comparableTitle(left); const b = comparableTitle(right);
  if (!a || !b) return 0;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

/** Conservative matching: only exact identifiers or an exact title+year+author tuple may auto-merge. */
export function classifyMetadataMatch(left: ImportedMetadata, right: ImportedMetadata): MetadataMatchDecision {
  const leftDoi = left.doi ? normalizeIdentifier("doi", left.doi) : null;
  const rightDoi = right.doi ? normalizeIdentifier("doi", right.doi) : null;
  if (leftDoi && rightDoi) return leftDoi === rightDoi
    ? { kind: "exact_identifier", autoMerge: true, reasons: ["same_doi"] }
    : { kind: "separate", autoMerge: false, reasons: ["conflicting_doi"] };

  const title = comparableTitle(left.title); const otherTitle = comparableTitle(right.title);
  const sameTitle = !!title && title === otherTitle;
  const sameYear = !!left.year && left.year === right.year;
  const sameAuthor = !!firstAuthor(left.authors) && firstAuthor(left.authors) === firstAuthor(right.authors);
  const typeLeft = (left.type ?? "").toLocaleLowerCase(); const typeRight = (right.type ?? "").toLocaleLowerCase();
  const versionConflict = !!typeLeft && !!typeRight && typeLeft !== typeRight && versionTypes.has(typeLeft) && versionTypes.has(typeRight);
  if (sameTitle && versionConflict) return { kind: "related_version", autoMerge: false, reasons: ["same_title", "different_publication_version"] };
  if (sameTitle && sameYear && sameAuthor) return { kind: "strong_metadata", autoMerge: true, reasons: ["same_title", "same_year", "same_first_author"] };
  if (sameTitle) return { kind: "possible", autoMerge: false, reasons: ["same_title", !sameYear ? "year_mismatch_or_missing" : "author_mismatch_or_missing"] };
  if (titleSimilarity(left.title, right.title) >= 0.90 && sameYear && sameAuthor) return { kind: "possible", autoMerge: false, reasons: ["near_title", "same_year", "same_first_author"] };
  return { kind: "separate", autoMerge: false, reasons: ["insufficient_evidence"] };
}

export type GroundedField = { value: string; evidence_refs: string[]; confidence: number; status: "supported" | "partially_supported" | "not_found" | "ambiguous" };
export type GroundingMetrics = { evidenceCoverage: number; invalidRefRate: number; unsupportedClaimRate: number; notFoundCorrectness: number };
export type GroundingResult = { valid: boolean; issues: string[]; invalidRefs: string[]; metrics: GroundingMetrics };

const flattenFields = (payload: unknown) => Object.entries((payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>)
  .flatMap(([path, value]) => (Array.isArray(value) ? value.map((field, index) => ({ path: `${path}[${index}]`, field })) : [{ path, field: value }]))
  .filter((entry): entry is { path: string; field: GroundedField } => !!entry.field && typeof entry.field === "object");

export function validateCardGrounding(payload: unknown, chunks: readonly LiteratureChunk[], expectedLiteratureId: string): GroundingResult {
  const issues: string[] = []; const invalidRefs: string[] = [];
  const chunkById = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const entries = flattenFields(payload); let totalRefs = 0; let validRefs = 0; let supported = 0; let groundedSupported = 0; let notFound = 0; let correctNotFound = 0;
  for (const { path, field } of entries) {
    const refs = Array.isArray(field.evidence_refs) ? field.evidence_refs : [];
    const supportsClaim = field.status === "supported" || field.status === "partially_supported";
    if (supportsClaim) supported++;
    if (field.status === "not_found") { notFound++; if (refs.length === 0) correctNotFound++; else issues.push(`${path}: not_found must not cite evidence`); }
    let fieldGrounded = refs.length > 0;
    for (const ref of refs) {
      totalRefs++;
      const chunk = chunkById.get(ref);
      let locatorValid = false;
      if (chunk) { try { const parsed = JSON.parse(chunk.locatorJson) as Record<string, unknown>; locatorValid = !!parsed && typeof parsed === "object" && typeof parsed.format === "string" && (parsed.format !== "pdf" || (typeof parsed.pageNumber === "number" && parsed.pageNumber > 0)); } catch { locatorValid = false; } }
      const valid = !!chunk && chunk.literatureId === expectedLiteratureId && !!chunk.textHash && locatorValid;
      if (valid) validRefs++; else { invalidRefs.push(ref); issues.push(`${path}: invalid source_ref ${ref}`); fieldGrounded = false; }
    }
    if (supportsClaim && refs.length === 0) { issues.push(`${path}: supported claim has no evidence`); fieldGrounded = false; }
    if (supportsClaim && fieldGrounded) groundedSupported++;
  }
  const ratio = (value: number, total: number, empty = 1) => total ? value / total : empty;
  return { valid: issues.length === 0, issues, invalidRefs, metrics: { evidenceCoverage: ratio(groundedSupported, supported), invalidRefRate: ratio(totalRefs - validRefs, totalRefs, 0), unsupportedClaimRate: ratio(supported - groundedSupported, supported, 0), notFoundCorrectness: ratio(correctNotFound, notFound) } };
}

const doiPattern = /10\.\d{4,9}\/[\w.()/:;-]+/gi;
export function guardVerifiedCitations(payload: unknown, allowedSourceIds: readonly string[], allowedDois: readonly string[]) {
  const allowedSources = new Set(allowedSourceIds); const allowedIdentifiers = new Set(allowedDois.map((doi) => normalizeIdentifier("doi", doi)));
  const fields = flattenFields(payload); const invalidSourceRefs = [...new Set(fields.flatMap(({ field }) => field.evidence_refs ?? []).filter((ref) => !allowedSources.has(ref)))];
  const candidateDois = [...new Set((JSON.stringify(payload).match(doiPattern) ?? []).map((doi) => normalizeIdentifier("doi", doi)))];
  const invalidDois = candidateDois.filter((doi) => !allowedIdentifiers.has(doi));
  return { valid: invalidSourceRefs.length === 0 && invalidDois.length === 0, invalidSourceRefs, invalidDois };
}

export function literatureContextPreview(chunks: readonly LiteratureChunk[]) {
  return { totalChunks: chunks.length, totalCharacters: chunks.reduce((sum, chunk) => sum + chunk.text.length, 0), sources: chunks.map((chunk) => ({ sourceRef: chunk.id, literatureId: chunk.literatureId, locator: JSON.parse(chunk.locatorJson), excerpt: chunk.text.slice(0, 240), textHash: chunk.textHash })) };
}

export function safeLiteratureTaskLog(input: { projectId: string; literatureId: string; chunks: readonly LiteratureChunk[] }) {
  return { projectId: input.projectId, literatureId: input.literatureId, chunkCount: input.chunks.length, contextCharacters: input.chunks.reduce((sum, chunk) => sum + chunk.text.length, 0), sourceRefs: input.chunks.map((chunk) => chunk.id) };
}

export function resolveLiteratureKnowledgeScope(needsExternalKnowledge: boolean): "current_evidence" | "scholarly_search_provider" {
  return needsExternalKnowledge ? "scholarly_search_provider" : "current_evidence";
}

export type StorageRecord = { id: string; status?: string; createdAt: string; referenced?: boolean; version?: string };
export function planLiteratureCleanup(now: Date, input: { metadataSources: StorageRecord[]; chunks: StorageRecord[]; embeddings: StorageRecord[]; cards: StorageRecord[] }) {
  const ageDays = (date: string) => (now.getTime() - new Date(date).getTime()) / 86_400_000;
  return {
    metadataSourceIds: [] as string[],
    chunkIds: input.chunks.filter((item) => item.status === "stale" && !item.referenced && ageDays(item.createdAt) > 30).map((item) => item.id),
    embeddingIds: input.embeddings.filter((item) => item.status === "stale" && ageDays(item.createdAt) > 7).map((item) => item.id),
    cardIds: input.cards.filter((item) => item.status === "stale" && !item.referenced && ageDays(item.createdAt) > 30).map((item) => item.id),
    preservedAuditIds: [...input.metadataSources.map((item) => item.id), ...input.cards.filter((item) => item.referenced || item.status === "confirmed" || item.status === "reviewed").map((item) => item.id)],
  };
}
