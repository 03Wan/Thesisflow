# Phase 7 · STEP 02 Dataset Registry + Immutable Raw Data

## Delivered

- Added migration `0011_phase7_dataset_registry.sql` with project-scoped `datasets` and `dataset_versions` tables.
- Original file snapshots are referenced from the existing controlled `project_files` storage; deleting a referenced source file is rejected before any filesystem mutation.
- Desktop import computes and persists SHA-256 after the copied file is successfully readable; an import failure creates no project-file record.
- CSV and XLSX dataset parsing is real (`SheetJS` / local decoder), bounded to 50 MiB, records schema, duplicate-column normalization, inferred type, nullability, selected XLSX sheet, full row/column counts, a 50-row preview, and a materialized full-row snapshot for reproducible transforms within that bound.
- Re-import of the same raw bytes within a project returns the existing raw version. A source file from another project is rejected.
- User field-type confirmation creates a new derived metadata version with a parent reference; raw bytes and their raw hash are not modified.
- `/data` provides Loading, Empty, Ready and Error states, controlled data-file registration, and displays real version metadata. It does not claim a preview is full-dataset statistics.

## Verification

| Command | Result |
|---|---|
| `npx vitest run src/test/dataset-parser.test.ts src/test/dataset-service.test.ts` | PASS — CSV/XLSX parsing, malformed/unsupported rejection, dedupe, project isolation, type-confirmation versioning |
| `cargo test phase7_dataset_registry` | PASS — cross-project reference rejection, source immutability and reopening SQLite preserves version metadata |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS (existing large-chunk warning remains) |

## STEP 02 Gate

- [x] 原始数据不能被编辑覆盖；被引用源文件不能删除
- [x] dataset version 与 SHA-256 可追溯
- [x] 不支持/坏数据解析时不会生成数据集记录
- [x] 预览行数与全量行列数分开记录和显示
- [x] 触发器、查询和服务均按项目隔离
- [x] SQLite 关闭并重开后数据集版本元数据仍可读取
- [x] 无示例数据兜底

**Gate：PASS。下一步：STEP 03（可复现 Transform Recipe）。**
