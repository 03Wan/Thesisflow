# ThesisFlow Desktop Alpha

Windows-first desktop alpha for managing the undergraduate thesis workflow. Project data is stored locally in SQLite and project folders. Online scholarly metadata and AI are optional, explicit data flows; the school, review, submission and plagiarism systems are not connected.

## Prerequisites (Windows)

- Node.js 20+
- Rust stable toolchain with Cargo (`rustup`)
- Visual Studio 2022 Build Tools with the **Desktop development with C++** workload and a Windows SDK
- Microsoft Edge WebView2 Runtime. The bundle is configured to offer the Microsoft WebView2 bootstrapper when the runtime is absent.

## Run in development

```powershell
npm install
npm run tauri dev
```

For front-end-only work, use `npm run dev`, then open `http://127.0.0.1:5173`.

## Validate and build

```powershell
npm run typecheck
npm run build
npm run tauri build
```

After a successful Windows bundle build, Tauri writes installers below `src-tauri\target\release\bundle\nsis\` and `src-tauri\target\release\bundle\msi\`. The exact installer type depends on Windows tooling on the build machine. The generated `.ico` and PNG files are Alpha placeholder assets; replace them with production artwork before distribution.

## Phase 3 local document parsing

- **Supported locally:** DOCX, text PDF, XLSX, CSV, TXT and Markdown. Parsing remains on the device; normalized JSON is stored only under each project's `.thesisflow/parsed/` directory.
- **Scanned PDF:** a PDF without a text layer is returned as `needs_ocr`; this release does not perform OCR.
- **Legacy `.doc`:** the original file is always retained. A locally installed converter may produce a best-effort DOCX copy under `.thesisflow/converted/`; when unavailable, ThesisFlow reports a recoverable unsupported/conversion-needed state and asks the user to save as DOCX/PDF.
- **Privacy:** parser inputs, normalized content and parse metadata are local-only. No document text is sent to an external service, and production logging must not write whole-paper content or secrets.

## Phase 4 AI infrastructure — implementation status

Phase 4 infrastructure is present but **has not passed final product acceptance**. The adapters, task engine contracts, ContextPack boundary, prompt registry, structured-output registry, and Windows Credential Manager boundary are available for development and test. The current AI panel is still a controlled FakeProvider-facing UI and must not be represented as a live AI service.

### Provider configuration and secrets

In the desktop app, open **设置 → AI 设置**, enter a provider key, then select or manually enter a model ID. The key is sent only to the native `SecretStore` command and is stored in Windows Credential Manager under a ThesisFlow-specific reference. The UI receives only configured/not-configured state and never reads the key back. SQLite stores only the secret reference and configuration metadata—never a plaintext API key.

Do not use `localStorage`, `sessionStorage`, plaintext JSON, or `.env` as persistent user-key storage. Development-only real-provider contract checks are opt-in: set `AI_REAL_PROVIDER_CONTRACT=1` together with a dedicated test secret outside committed files.

### Privacy and readonly boundary

AI context must be built through `ContextBuilder`. It sends only task-declared facts, confirmed rules, a current stage, selected snippets, and source references; it excludes secrets, other projects, whole files, and unselected thesis text. Imported document content is labelled untrusted data, never treated as instructions. A custom Base URL is an advanced setting because it can change the data recipient and privacy boundary.

The current advisor design is readonly: model output cannot automatically change rules, workflow stage, files, thesis text, research facts, or candidates. Real connection testing, persisted streaming UI, source navigation, and user-confirmed AI task creation remain final-acceptance prerequisites; see `docs/testing/phase4-final-acceptance-report.md`.

## Phase 5 literature research — implementation status

Phase 5 has a logical schema v4 (desktop migration sequence `0009`/`0010`), domain contracts, local parsing/chunking/FTS, evidence validation and Crossref/OpenAlex adapters. It **has not passed final product acceptance**: several Literature Workspace import, conflict-resolution, locator, card lifecycle and online-discovery flows are not connected end to end. See `docs/testing/phase5-final-acceptance-report.md` for TEST 1–20 evidence. Do not represent the current build as `PHASE 5 COMPLETED`.

### Import formats

- Local parsers/candidates: text PDF, BibTeX, RIS, DOI, and manual metadata.
- PDF full text reuses the Phase 3 `NormalizedDocument` pipeline. A PDF without a usable text layer is marked `needs_ocr`; no text or evidence is fabricated.
- BibTeX/RIS parsing preserves the raw input in the candidate model. Persisted provenance through the complete UI import path remains an acceptance gap.

### Metadata providers and online discovery

- Provider-agnostic contracts have Crossref and OpenAlex adapters. Their citation counts retain the provider name and must not be compared as one absolute metric.
- Real opt-in smoke tests use `PHASE5_REAL_PROVIDER_SMOKE=1`; normal test runs skip network access. Provider lookup/search failure must not prevent use of the local library.
- Only provider-declared HTTPS open-access links may be previewed. Download must be explicitly initiated by the user and must enter the normal local file pipeline. ThesisFlow does not bypass authentication, paywalls, CAPTCHAs, or publisher controls and does not use unauthorized repositories.

### Retrieval

- SQLite FTS5 is the offline baseline. Chunks retain literature, file, parse, hash and locator provenance; retrieval budgets cap top-K, per-document results and context size.
- Semantic retrieval is optional behind embedding-provider and VectorIndex abstractions. No production embedding provider or vector index is configured in this build, so semantic search is disabled; lexical FTS remains available. Fake or empty vectors are not treated as enabled semantic retrieval.

### Evidence-first AI cards

Literature-card prompts and `literature_card.v1` structured validation require evidence references from the current ContextPack. Local validation rejects missing, stale, foreign-project or foreign-literature refs and invented verified citations. Missing information must remain `not_found` or `ambiguous`. Only selected chunks are eligible for an AI request; complete PDFs and the whole library are not sent by default, and logs must not contain full document text.

The orchestration and deterministic guards are tested, but the current Literature Workspace does not yet connect the generation button to a live configured task, persistent card/evidence store, human confirmation and automatic stale lifecycle. This is a core acceptance limitation.

### Known Phase 5 limitations

- Literature import dialogs and online discovery are UI placeholders rather than complete persisted workflows.
- Workspace full-text/hybrid switches currently do not execute the FTS retriever.
- Opening a source opens the Phase 3 file location; page/locator navigation and evidence highlighting are not wired into a reader.
- Metadata provenance/conflict selection, notes, a five-record evidence matrix, persistent card confirmation and parse-triggered stale transitions are incomplete.
- OCR, a production embedding/vector index, live-provider AI extraction accuracy and packaged cold-disk performance are not available or not accepted.
- Dashboard confirmed-rule projection exists as a tested service, but it is not connected to the dashboard requirement widgets.

## Remaining legacy mock architecture

- `src/data/mock/thesis-project.ts`: project overview and workflow
- `src/data/mock/literature.ts`: literature records
- `src/data/mock/workflow.ts`: stage states, gates, advisor comments, issues, versions and rules

These UI-facing sources remain legacy Alpha placeholders outside the real literature list. They are not confirmed thesis rules and must not be presented as school requirements or literature-library records.

## Not connected in Alpha

- School account, project, review or submission systems
- Cloud sync, external AI, OCR and online document analysis
- Real AI generation, voice recognition or plagiarism checks
- Full rule-review UI, source viewer and conflict-resolution workflow (Phase 3 acceptance is not yet complete)
