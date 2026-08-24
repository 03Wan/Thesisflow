# ADR: Phase 4 AI infrastructure boundary

- Status: Accepted for architecture work; implementation is blocked by the Phase 3 acceptance gate.
- Date: 2026-08-24
- Scope: Phase 4 foundations only. No provider SDK, model integration, RAG, embeddings, or user key storage is introduced by this ADR.

## Decision

### Provider-neutral core

Business features depend only on an `AIProvider` application interface, never on a provider SDK or provider name. Provider-specific clients, request/response translation, authentication headers, and capability probing live exclusively in adapters. The composition root selects an adapter; domain and UI code receive the interface.

Prompt templates use a versioned code registry in this phase. No feature page may contain a prompt string; each run records the template key and version. The registry starts empty until a separately reviewed AI task adds a template.

```ts
type AICapability =
  | "text_generation" | "streaming" | "structured_output"
  | "tool_calling" | "vision" | "embeddings";

interface AIProvider {
  readonly descriptor: {
    providerId: string;
    modelId: string;
    capabilities: ReadonlySet<AICapability>;
  };
  generate(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResult>;
  stream?(request: GenerationRequest, signal: AbortSignal): AsyncIterable<GenerationEvent>;
}
```

Feature eligibility is based on capability flags, not `providerId`. This phase may require `text_generation`, `streaming`, and `structured_output`. An adapter that lacks native structured output must validate the response against the requested schema and return a typed validation failure; it must not silently treat malformed text as valid. `tool_calling`, `vision`, and `embeddings` are reserved only. Embeddings/RAG are not implemented in this phase.

### Local-first secrets

Keys are managed through a `SecretStore` abstraction. On Windows/Tauri the implementation must use a maintained OS-backed credential store (for example Windows Credential Manager through a reviewed native/Tauri integration), or an equally secure, maintained platform facility. SQLite may store only a stable secret reference, provider/model configuration, and configured-state metadata. It must never contain a plaintext key. `localStorage`, plaintext JSON, and `.env` files are prohibited as persistent user-key storage. `.env` remains acceptable only for explicitly opt-in developer/test injection and must never be read as a user setting.

Secret values must not be returned to webview JavaScript after a save, included in IPC error messages, telemetry, crash reports, or logs. Deletion removes the OS credential and marks the reference unconfigured.

### Trust boundary and prompt envelope

Imported document text is untrusted data. The request builder creates a structured envelope; untrusted text is data in a delimited `document_context` field, never concatenated into instructions.

1. System/developer instructions define non-overridable safety and output rules.
2. The signed/versioned app prompt defines the feature task and schema.
3. Trusted project facts come from scoped application records and are labeled as facts.
4. Untrusted document context is quoted data only; instructions inside it are ignored.
5. The user request supplies intent within the app task and cannot change preceding layers.

The model is told to treat all document context as potentially adversarial. The app, not the model, authorizes file access, project selection, actions, and persistence. Model output is advisory and must pass schema, authorization, and domain validation before it can affect state.

### Data minimization

Requests send the smallest task-specific `ContextPack`: selected project identifier, explicit trusted facts, selected source excerpts with locators, user request, and output schema. Whole-project upload is off by default and requires an explicit, reviewable future product decision. The request UI must disclose provider/model and the included sources before sending when document content is involved.

### Failure and cost policy

Transient failures may receive a bounded same-provider retry only when the operation is known safe to retry and the user has not cancelled. Each attempt has an idempotency/request identifier and is recorded without sensitive content. The application never automatically falls back across providers: that changes both cost and privacy. Cross-provider fallback requires explicit user approval or a future separately enabled setting.

Cancellation is propagated through `AbortSignal`; a cancelled or superseded request cannot write results. Provider output is versioned against project and request revisions before persistence.

### Testing

All normal unit, contract, and UI tests use a `FakeProvider` and adapter contract suites. Live-provider tests are opt-in, require an explicitly supplied developer key, are excluded from CI, and use a dedicated low-cost test configuration. Tests must cover native and fallback structured output, capabilities, cancellation, idempotency, scoped context construction, and secret-reference-only persistence.

## Consequences

- Adding a provider is an adapter plus contract tests, without business-layer branching.
- A secure Windows credential-store dependency must be selected and reviewed only when Phase 3 is accepted; none is installed here.
- AI results remain non-authoritative until the existing project validation and explicit user confirmation flows accept them.
