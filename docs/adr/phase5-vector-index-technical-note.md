# Phase 5 VectorIndex technical note

Semantic retrieval is optional. The Phase 5 default is SQLite FTS5 only, so Windows/Tauri packaging, offline use, migrations, deletion, and updates have no native vector-library dependency. `VectorIndex` is an adapter boundary: deployments may choose a local sidecar/index file only after its Windows packaging, persistence format, deletion guarantees, update/rebuild behaviour, performance, and licence are reviewed.

SQLite stores no large vectors. It stores `embedding_version`, index key, provider key, and lifecycle status. The version is `chunking_version + provider/model + dimension + normalization`; a changed text hash, chunking version, or model marks earlier index metadata stale. Different versions/dimensions are never queried together. Index removal is required when chunks/literature are deleted; failed or unavailable semantic retrieval falls back to FTS5.
