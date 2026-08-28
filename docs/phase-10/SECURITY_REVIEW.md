# Security Review

审计范围：本地优先 Windows 桌面论文工作台；不套用 SaaS 角色模型。

| Area | Control / evidence | Severity |
|---|---|---|
| Archive path traversal | normalize separators, reject `..`, absolute drive paths and duplicate paths; automated test | PASS |
| Archive secrets | reject env/key/pem/log and token/secret/api-key names; no external tokens in manifest | PASS |
| Archive integrity | per-artifact size + SHA-256 verify; tamper test | PASS |
| Cross-project access | service/repository queries use project ID; existing project isolation tests | PASS |
| AI boundary | opt-in existing provider; no new telemetry/cloud sync; archive excludes provider secrets | REVIEW |
| Rich text / external URLs | existing renderer boundary requires manual UI security review | REVIEW |
| Disk full / crash consistency | SQLite transactions exist for writing; desktop disk-full drill pending | REVIEW |

Blocker/Critical findings: 0 known in automated scope. Manual REVIEW items are not silently treated as PASS.
