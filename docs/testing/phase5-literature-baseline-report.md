# Phase 5 Baseline Report

- Checked: 2026-08-24
- Decision: **Architecture baseline frozen; STEP 02 / literature database implementation has not started.**

## Phase 4 actual verification

| Area | Result | Evidence |
| --- | --- | --- |
| DB schema v3 / Phase 4 schema | PASS (schema baseline) | Migration `0008_phase4_ai_infrastructure.sql` supplies provider config, run, output, usage tables; Rust migration test checks preservation and no plaintext secret column. |
| SecretStore | PASS (boundary/contract) | Native Windows Credential Manager adapter and redaction tests; webview exposes configured state only. |
| Provider Registry | PASS (contract) | Registry contains provider-neutral adapters plus FakeProvider contract coverage. |
| AI Task Engine | PASS (unit contract) | Capability validation, run/output persistence, timeout/cancel, and structured-output tests pass. |
| Prompt Registry / Structured Output / Context Builder | PASS (unit contract) | Versioned registries and security regression suites pass, including source-ref and project-scope protections. |
| Project isolation | PASS (unit contract) | Context-builder security tests and engine project listing coverage pass. |
| Readonly AI Advisor | FAIL (product acceptance) | `AIContextPanel` invokes `fakeReadonlyAdvisor`; it is not wired to the engine, actual ContextPack, persisted run, or source locator. |
| Real provider connection / persisted streaming | FAIL (product acceptance) | Settings “测试连接” only sets a status; no native secret-resolving execution command exists, and the panel simulates timers. |
| Phase 4 Final Acceptance | NOT PASSED | Confirmed by current implementation and `phase4-final-acceptance-report.md`. |

## Quality commands executed

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test -- --run` | PASS — 22 files, 84 tests |
| `npm run build` | PASS |

Non-fatal warnings observed: PDF standard-font fixture warning, React test `act(...)`/zero-size chart warnings, and Vite chunk-size warning. They do not change the command status, but should be addressed as test/build hygiene work.

## Gate outcome

Phase 4's code-level baseline is frozen, but its product final acceptance is **not** frozen as passed. The required remediation is to implement and verify a native secret-resolving provider execution boundary; wire settings connection tests and the read-only panel to it; persist real streaming output; present actual ContextPack/source locators; and add the confirmed AI-task provenance flow. A live-provider smoke test also needs a user-authorized credential.

The Phase 5 ADR and quality plan are therefore design artifacts only. No literature schema, FTS index, metadata adapter, embedding integration, vector index, online retrieval, or full-text downloader was added. Do not enter STEP 02 until the stated Phase 4 gate is remediated and re-verified.
