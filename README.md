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
