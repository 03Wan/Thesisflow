# Phase 4 AI threat model

- Status: Design control baseline; no AI transport or SDK is implemented.
- Assets: user API keys, project metadata, imported documents, ContextPacks, model output, audit events, and local SQLite records.
- Trust boundaries: OS credential store ↔ native shell ↔ webview; app ↔ provider API; trusted project records ↔ imported document text; request lifecycle ↔ persistent project state.

| Threat | Primary controls | Verification / residual risk |
| --- | --- | --- |
| Key leakage | `SecretStore` backed by OS credentials; SQLite stores reference/status only; redact IPC/log/crash data. | Test DB contains no secret; review logs and error serialization. OS account compromise remains out of application scope. |
| Prompt injection | Document text is untrusted, delimited data; fixed prompt envelope; no model-authorized tools or persistence. | Injection fixtures must not alter instruction hierarchy or scope. Model may still produce poor advice, so output is validated. |
| Cross-project context leak | ContextPack requires one project ID; repository queries enforce project ownership; request includes selected sources only. | Contract tests assert no foreign facts/locators; UI makes included sources visible. |
| Log leak | Log metadata and hashes, not prompts, documents, keys, or model bodies by default; redaction at native and webview boundaries. | Redaction tests and release log review; diagnostic logging needs an explicit consented design. |
| Accidental whole-project upload | Default deny; builder accepts selected excerpts and size/count limits only; pre-send disclosure. | Tests reject project-root/document-list expansion; deliberate bulk upload remains a future feature requiring consent. |
| Retry duplicate cost | Same-provider bounded retry only for classified transient errors; idempotency key and attempt budget. | Tests simulate timeout after send; uncertain completion is shown, not reissued blindly. |
| Rate limit | Per-provider/model concurrency, queue/backoff honoring retry metadata, visible status. | Contract tests for 429/backoff; provider quotas may still change. |
| Malformed structured output | Native schema mode where available; otherwise adapter JSON extraction plus schema validation; fail closed. | Fuzz malformed/partial/trailing output; no persistence before validation. |
| Malicious model output | Treat output as untrusted; schema/domain validation, escaping, no executable code/tool invocation, explicit user confirmation for changes. | XSS/action-injection fixtures; residual hallucination is presented as assistance, not fact. |
| Provider outage | Typed unavailable result, local work remains usable, no implicit cross-provider fallback. | Simulated outage tests; recovery requires retry by user or allowed same-provider policy. |
| Cancellation race | Abort propagation; request state machine; check cancellation before UI/state writes. | Race tests cancel during stream and validation. |
| Stale response writes | Request IDs plus project revision/context hash; persist only if current request and project revision match. | Concurrent request tests; stale result is discarded with an audit-safe status. |
| Unexpected capability change | Adapter obtains/caches capabilities with version/time; feature gate checks capabilities each request; degrade to explicit unsupported state. | Contract tests for capability removal; providers can still change behavior between probes. |

## Required controls before any provider is enabled

1. Implement and review `AIProvider`, `SecretStore`, ContextPack builder, output validator, request state machine, and audit-safe telemetry.
2. Add FakeProvider/adapter contract tests for every table row above; live tests stay opt-in and outside CI.
3. Perform platform credential-store and Tauri IPC permission review before a key entry UI exists.
4. Keep cross-provider fallback disabled by default and require explicit user authorization for any future enablement.
