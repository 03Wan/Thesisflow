# ThesisFlow Desktop Alpha

Windows-first desktop alpha for managing the undergraduate thesis workflow. The current version is local-only: its UI and mock data run entirely in the app. It does not connect to a cloud service, database, school system, AI provider, or plagiarism service.

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

## Local mock architecture

- `src/data/mock/thesis-project.ts`: project overview and workflow
- `src/data/mock/literature.ts`: literature records
- `src/data/mock/workflow.ts`: stage states, gates, advisor comments, issues, versions and rules

These remaining UI-facing mock sources are legacy Alpha placeholders. They are not confirmed thesis rules and must not be presented as school requirements.

## Not connected in Alpha

- School account, project, review or submission systems
- Cloud sync, external AI, OCR and online document analysis
- Real AI generation, voice recognition or plagiarism checks
- Full rule-review UI, source viewer and conflict-resolution workflow (Phase 3 acceptance is not yet complete)
