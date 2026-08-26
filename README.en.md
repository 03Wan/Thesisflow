# ThesisFlow Desktop

[中文](./README.md) · **English**

ThesisFlow is a Windows-first, local-first student workspace for the complete undergraduate thesis lifecycle. It brings project materials, requirements, topic selection, task planning, literature research, research design, writing, revisions, defense, and archiving into one desktop application.

> The current release is `v0.2.0 Alpha`. Project data is stored locally by default. School administration, thesis submission, plagiarism checking, and cloud-sync systems are not connected. AI, advisor-guidance, and teacher-review screens support local configuration, records, and workflow assistance; they do not imply a connection to a school or real teacher system.

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE) (`AGPL-3.0-only`). Modified copies and instances made available to users over a network must comply with its corresponding-source requirements.

## Key features

- **Student thesis workspace**: project overview, stage progress, upcoming milestones, calendar, tasks, and file activity.
- **Preparation**: thesis requirements, topic selection, and task-book management.
- **Research**: literature library, proposal, research design, data, and survey materials.
- **Writing**: outline, manuscript editor, foreign-language translation, and midterm review.
- **Revision and quality control**: revision tasks, guidance records, teacher review, full-text assessment, citation verification, formatting checks, and version history.
- **Defense and archive**: defense preparation, mock defense, defense records, post-defense revision, final manuscript, materials archive, and file center.
- **Local AI configuration**: provider, model, and secret configuration. Secrets are stored through the desktop native secure-storage boundary, not in source code or browser storage.
- **Responsive desktop UI**: unified improvements for high zoom, narrow windows, text contrast, target sizes, and dense information layouts.

## Technology

- React 18, TypeScript, and Vite
- Tauri 2 and Rust
- SQLite and local project folders
- Zustand, React Router, Tiptap, and Recharts
- Vitest and Testing Library

## Windows prerequisites

- Node.js 20+
- Rust stable toolchain with Cargo (installing through `rustup` is recommended)
- Visual Studio 2022 Build Tools with the **Desktop development with C++** workload and a Windows SDK
- Microsoft Edge WebView2 Runtime (the installer can offer guidance when it is missing)

## Run in development

```powershell
npm install
npm run tauri dev
```

For front-end-only development:

```powershell
npm run dev
```

Then open `http://127.0.0.1:5173`. If Vite selects another port, use the URL printed in the terminal.

## Validate and build

```powershell
npm run typecheck
npm run test
npm run build
npm run tauri build
```

Windows bundles are normally written to:

- `src-tauri\target\release\bundle\nsis\`
- `src-tauri\target\release\bundle\msi\`

The bundle type depends on the Windows toolchain installed on the build machine. Replace the Alpha placeholder artwork and perform clean-machine installation checks before production distribution.

## Local data and document parsing

- Project data is stored in a local SQLite database and project folders.
- Local parsing supports DOCX, text PDF, XLSX, CSV, TXT, and Markdown.
- Scanned PDFs are marked as `needs_ocr`; this release does not invent or infer scanned content.
- Original legacy `.doc` files are retained. A local converter may create a best-effort copy; otherwise the app asks the user to save the file as DOCX or PDF.
- The desktop build uses portable local storage: `thesisflow.db`, `ThesisFlow/Projects`, and imported files are stored beside the EXE. Run it from a user-writable directory; Windows may reject writes under `C:\Program Files`.
- Parsed output remains in the project's `.thesisflow/parsed/` directory.

## AI and privacy boundary

- Open **Settings → AI Settings**, enable a provider, save an API key, and select or manually enter a model ID.
- Desktop secrets are written to Windows Credential Manager through native commands. The UI can read only configured/not-configured state.
- SQLite stores the secret reference and configuration metadata, never the plaintext API key.
- Do not persist user secrets in `localStorage`, `sessionStorage`, plaintext JSON, or a committed `.env` file.
- AI context is limited to task-declared rules, the current stage, user-selected snippets, and source references. Whole manuscripts and libraries are not sent by default.
- Imported documents are always treated as untrusted data, never as executable instructions.
- AI output is readonly by default and cannot automatically change rules, workflow stages, files, thesis text, or research facts.

## Current implementation status

The Alpha includes the desktop shell, primary routes, local data layer, document-parsing foundation, AI provider settings, literature workspace, and the main student workflow screens. The following capabilities remain limited or awaiting final acceptance:

- Real school accounts, review, submission, and plagiarism-system integrations
- Cloud sync, OCR, online document analysis, and production voice recognition
- Real teacher collaboration and school-level guidance/review synchronization
- Live AI generation, persistent streaming sessions, complete source navigation, and automatic task closure
- Complete end-to-end literature discovery, conflict resolution, full-text locators, evidence-card lifecycle, and semantic vector retrieval

For detailed acceptance and visual QA records, see:

- `docs/testing/phase4-final-acceptance-report.md`
- `docs/testing/phase5-final-acceptance-report.md`
- `design-qa.md`

## Data notice

The workbench no longer bundles demonstration projects, thesis content, teacher feedback, scores, or files. When no project or real record exists, the UI shows an empty state. Official workflow names and milestone configuration remain in `src/data/official-workflow.ts`; these product rules are not school-confirmed results.

## Security note

Do not commit API keys, full manuscripts, unpublished research data, or sensitive personal information to Git. Before production distribution, complete dependency auditing, privacy review, signed-installer verification, and real-device regression testing.
