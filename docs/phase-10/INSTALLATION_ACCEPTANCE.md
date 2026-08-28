# Windows Installation Acceptance

版本基线：package version `0.2.0`（尚未宣称 v1.0）。签名：未配置代码签名，不能宣称 signed/safe。Release 构建于 2026-08-28 完成，以下为本次实际 RC 产物哈希。

| Check | Status | Evidence / limitation |
|---|---|---|
| Tauri build configuration | PASS | `src-tauri/tauri.conf.json`, Cargo project present |
| Release artifact generated | PASS | MSI/NSIS RC generated; hashes recorded below |
| Install → create project → import → save → restart | REVIEW | 需要 clean Windows user/VM |
| Chinese/space path and non-admin | REVIEW | 需要目标环境执行 |
| Upgrade migration | REVIEW | migration tests exist; no reliable old installer fixture recorded |
| Uninstall preserves user data | REVIEW | must verify installer behavior explicitly |
| fixtures/dev secrets/debug assets absent | REVIEW | inspect actual RC artifact, not source build |

`npm run build` 仅证明前端构建，不等同安装包验收。

## RC artifacts

- `ThesisFlow_0.2.0_x64_en-US.msi` — SHA-256 `B96FC578347FF5BD590564F6F68EAFD450670A5EB5B34BFB027390D513860C3C`
- `ThesisFlow_0.2.0_x64-setup.exe` — SHA-256 `5C5B2B47400C7F7F290A6B3A345C4F05F7894F5E5B4BF9BD9A3265C48306BFB2`
