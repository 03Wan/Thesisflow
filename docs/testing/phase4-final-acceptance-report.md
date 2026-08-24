# Phase 4 Final Acceptance Report

Date: 2026-08-24  
Result: **PHASE 4 NOT COMPLETED — core product acceptance has not passed.**

This report records observed behaviour and automated evidence. `PASS` is not inferred from the existence of an interface or type.

| Test | Result | Evidence / finding |
|---|---|---|
| 1. No Provider UX | PASS | The global panel presents a recoverable configuration prompt; non-AI routes remain available. |
| 2. Key storage / restart | PARTIAL | Windows Credential Manager adapter and migration test prove secret-reference-only storage. A packaged-app restart with a user key was not run. |
| 3. Real connection test | FAIL | Settings currently records “待 Provider 连接测试”; it does not call a provider adapter. |
| 4. Model capability validation | PARTIAL | Model IDs can be entered and capability descriptors exist. `AITaskEngine` currently requires text generation but does not validate every task capability. |
| 5. Real streaming / persisted run | FAIL | `AIContextPanel` uses a controlled FakeProvider UI sequence; it does not invoke `AITaskEngine` or persist an `ai_run`/output. |
| 6. Cancel / late delta | PARTIAL | Engine/FakeProvider cancellation race regression passes. The panel is not connected to the engine. |
| 7. Timeout / retry / no cross-provider fallback | PARTIAL | Engine timeout is persisted as `timed_out`; bounded retry is limited to same-provider non-stream generation. Full streaming retry policy remains unverified. |
| 8. Structured output | PARTIAL | Registry validates schema and source-ref whitelist in regression tests. Task output persistence does not yet invoke this registry before marking data valid. |
| 9. Context Preview | PARTIAL | Context minimization and project isolation tests pass. Panel preview is descriptive rather than the actual built ContextPack. |
| 10. Prompt injection | PASS | Regression covers hostile source text, secret exclusion, untrusted-data labelling, and no automatic write authority. |
| 11. Project isolation | PASS | Context builder regression keeps Project B data out of Project A manifests. |
| 12. Readonly Advisor | FAIL | Current advisor is FakeProvider-only and cannot open a real source locator. It does not modify business facts, but the full source UX is absent. |
| 13. AI → Create Task | FAIL | No user-confirmed task-creation flow with `source=ai` / `ai_run_id` exists. |
| 14. Restart persistence | PARTIAL | Schema and SecretStore contract persist the intended data; a real run repository and packaged restart verification are not wired. |
| 15. FakeProvider exception matrix | PASS | Success, slow stream, disconnect, rate limit, auth, 5xx, timeout, malformed output, missing usage, long response, and late-delta cancellation regression pass. |
| 16. Build and test suite | PASS | Full ESLint, typecheck, 83 Vitest tests, production build, Rust tests, and NSIS Tauri validation passed. |
| 17. Real provider smoke | NOT RUN | No user-provided real Provider key was supplied. No real connection, stream, cancel, or structured-output result has been claimed. |

## Implemented baseline

- DB schema: migration **v8** (`0008_phase4_ai_infrastructure.sql`).
- SecretStore: Windows Credential Manager through the native Rust `keyring` adapter; UI receives configured status only.
- Adapters: OpenAI, Anthropic, Google Gemini, DeepSeek, and FakeProvider through `AIProvider`.
- Model policy: capability flags (`text_generation`, `streaming`, `structured_output`, `tool_calling`, `vision`, `embeddings`), not provider-name conditionals.
- Prompts: code registry (`ai.general_assistant@v1`, `ai.thesis_advisor.readonly@v1`, `ai.rule_explanation@v1`).
- Structured schema: `advisor_suggestions@v1`.
- Task statuses: queued, running, streaming, succeeded, failed, cancelled, timed_out.
- Context policy: minimal, project-scoped ContextPack; source text is untrusted data; secret-pattern content is clipped.

## Security regression summary

The regression suite checks secret redaction, error-message safety, SSE splitting, malformed structured data, source-ref whitelisting, Project A/B isolation, hostile prompt data wrapping, and FakeProvider fault/cancellation behaviour. Repo scan found no real credential; only implementation names, documentation, and explicitly labelled test values.

## Technical debt and Phase 5 prerequisites

1. Add a native secret-resolving provider execution command or backend service so UI test-connection and task runs can safely use credentials without exposing them to the webview.
2. Bind `AIContextPanel` to `AITaskEngine`, a SQLite `AIRunRepository`, actual ContextBuilder previews, and stream-batched persistence.
3. Validate every `AITask.requiredCapabilities` and run structured-output registry validation before persisted output can be used.
4. Implement source-locator navigation and user-confirmed AI task creation with `source=ai` and `ai_run_id` provenance.
5. Run and record an explicit real-provider smoke test before promoting Phase 4. Do not start embeddings, vector DB, RAG, online search, automatic writing, automatic rule confirmation, or research-data analysis until these prerequisites pass.
