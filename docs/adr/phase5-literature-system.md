# ADR: Phase 5 Literature System Architecture and Data/Legal Boundary

- Status: Accepted as a design baseline; implementation is gated.
- Date: 2026-08-24
- Scope: Phase 5 literature-domain architecture. This ADR creates neither a literature database nor an online retrieval client.

## Context and decision

Phase 5 must treat scholarly works as durable domain records, not as files or search-result rows. The system remains local-first and project-isolated by default. It may parse a PDF already present on the user's device, but it must not turn discovery into an unauthorized acquisition channel.

### 1. Canonical Literature Record

`LiteratureRecord` is the canonical domain entity. A record is a scholarly work, not a PDF. It may have zero, one, or many local `ProjectFile` attachments; DOI, PMID, ISBN, arXiv, OpenAlex, Semantic Scholar, and future external identifiers; multiple metadata assertions with provenance; user notes; AI-generated cards; and citation records. A missing PDF never makes the record invalid, and importing a second copy of a PDF must not create a second work automatically.

Attachments, identifiers, metadata assertions, notes, cards, citations, parsed documents, and chunks are separate related entities. Identity resolution records both the winning normalized fields and the evidence used to select them.

### 2. Source of truth and reconciliation

Field-level precedence is, highest first:

1. user-confirmed value;
2. verified external metadata;
3. file-extracted metadata;
4. unverified import;
5. AI candidate.

Every assertion carries source, retrieval time, verification state, and field scope. Background enrichment may add candidates or update a lower-precedence assertion, but it must never silently replace a user-confirmed field. Conflicts remain reviewable and require explicit user action to change the canonical value.

### 3. Full-text and legal boundary

The application may parse local PDFs already supplied by the user. Online discovery fetches public metadata and links that are legitimately offered as open access. It must not bypass publisher controls, paywalls, CAPTCHA, login controls, robots restrictions, or access controls, and it must not bulk-download papers from unauthorised sources. A link is a link, not a licence assertion: the UI must preserve the provider/source and let the user decide whether to open it.

### 4. Metadata-provider boundary

Business code depends on a provider-agnostic `ScholarlyMetadataProvider` adapter, not Crossref, OpenAlex, or Semantic Scholar SDKs/types. Each adapter normalizes provider results into metadata assertions and identifiers, exposes capabilities, and maps safe errors/rate-limit outcomes.

Candidate providers are Crossref, OpenAlex, Semantic Scholar, and future providers. Before implementation, Codex must consult the current official API documentation for the selected provider's authentication method, rate limits, attribution/terms, permitted use, and access constraints. Provider-specific policy lives at the adapter boundary; no business workflow may be hard-wired to one provider.

### 5. Retrieval

Local lexical search is mandatory, implemented with SQLite FTS5 or an equivalently stable local mechanism. It indexes project-scoped canonical metadata, notes where authorised, and parsed chunk text.

Semantic retrieval is optional enhancement only. It requires an `EmbeddingProvider` abstraction and a `VectorIndex` abstraction. When no embedding provider or vector index is configured, ingest, metadata management, lexical search, citations, and evidence cards remain fully usable. A semantic-retrieval failure must degrade to lexical retrieval rather than damage or disable the literature library.

### 6. Chunk provenance

Every persisted searchable chunk must retain all of: `literature_id`, `project_file_id`, `document_parse_id`, page or other locator, heading/path, and a text hash. Chunks are immutable with respect to the parse version they represent; reparsing creates a distinct provenance chain. A search hit, card claim, and citation back-link must carry this source reference end-to-end.

### 7. Evidence-first AI

AI literature cards are advisory, source-grounded derived data. A card may only use the actual retrieved chunks/source references passed in its ContextPack. Claims about research question, method, findings, limitations, or conclusion each need evidence references. If relevant source content is absent or inconclusive, the output must say: “无法从当前全文确认”. The model cannot invent source IDs, assert unsupported facts, or mutate canonical metadata.

### 8. Project scope

A work may be designed for future cross-project reuse, but Phase 5 stores and queries it in the owning project boundary by default. Cross-project discovery, attachments, notes, chunks, cards, and retrieval results must remain isolated. No global shared knowledge base, global vector index, or cross-project inference is introduced unless a later architecture decision is backed by stable existing support.

### 9. Citation data

Normalized canonical metadata must export a standard intermediate representation, at minimum CSL-JSON, preserving identifiers and provenance where possible. This prepares later in-text citation and bibliography formatting. Phase 5 explicitly does not audit a university's final reference-format rules.

## Consequences and gates

- Phase 5 begins with architecture, quality fixtures, and provider-policy research—not a provider SDK or database migration.
- The existing Phase 4 final acceptance remains a release gate: genuine provider connection execution, persisted streaming runs, actual ContextPack preview, source-locator navigation, and user-confirmed task creation must be completed before a production AI literature-card flow is enabled.
- No embeddings, vector DB, full-text web acquisition, or global library is implied by this decision.
