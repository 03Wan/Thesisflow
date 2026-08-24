import { LiteratureRepository } from "@/repositories/literatureRepository";
import type { FieldProvenance, IdentifierScheme, LiteratureItem } from "@/types/literature";
import type { MetadataLookup, ScholarlyMetadataProvider } from "@/services/literatureImportPipeline";

export function normalizeIdentifier(scheme: IdentifierScheme, value: string): string {
  const input = value.trim();
  if (scheme !== "doi") return input.toLowerCase();
  return input.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/^doi\s*:\s*/i, "").trim().toLowerCase();
}
export const provenancePriority: Record<string, number> = { ai_candidate: 1, unverified_import: 2, file_metadata: 3, verified_external_metadata: 4, user_confirmed: 5 };
export function mayReplaceCanonicalField(current: Pick<FieldProvenance,"sourceType"|"trustLevel"> | null, candidate: Pick<FieldProvenance,"sourceType"|"trustLevel">): boolean { return !current || (current.sourceType !== "user_confirmed" && candidate.trustLevel > current.trustLevel); }
export function validateAuthorOrder(orders: readonly number[]): boolean { return orders.every((order, index) => Number.isInteger(order) && order === index); }
export class LiteratureImportService { constructor(private readonly repository = new LiteratureRepository()) {} async createInbox(item: LiteratureItem) { await this.repository.create(item); } }
export class MetadataService { constructor(private readonly repository = new LiteratureRepository()) {} normalizeIdentifier = normalizeIdentifier; async identifiers(projectId: string, literatureId: string) { return this.repository.listIdentifiers(projectId, literatureId); } async enrich(provider: ScholarlyMetadataProvider, doi: string): Promise<MetadataLookup | null> { return provider.lookupDoi(normalizeIdentifier("doi", doi)); } }
export class DedupService { normalizedKey(scheme: IdentifierScheme, value: string) { return `${scheme}:${normalizeIdentifier(scheme, value)}`; } }
export class LiteratureFileService { constructor(private readonly repository = new LiteratureRepository()) {} async find(projectId: string, literatureId: string) { return this.repository.find(projectId, literatureId); } }
export class LiteratureCardService { constructor(private readonly repository = new LiteratureRepository()) {} async evidenceScope(projectId: string, literatureId: string) { return this.repository.activeProvenance(projectId, literatureId); } }
export class LiteratureSearchService { constructor(private readonly repository = new LiteratureRepository()) {} async lexical(projectId: string, query: string) { return this.repository.lexicalSearch(projectId, query); } }
