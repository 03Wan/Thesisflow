# Recovery Runbook

## Archive verification

1. Keep the original project storage untouched and work in a temporary directory.
2. Load `archive_manifest.json`; reject unknown schema, absolute paths, `..` segments, missing required files, size mismatch, or SHA-256 mismatch.
3. Use `verifyArchivePackage` before any write. A rejected package must not create a project.
4. Restore an archive as a new project ID by default; never overwrite an existing project ID. A backup restore is distinct from archive import.
5. Write a `RecoveryReport` containing input manifest hash, migration version, restored logical IDs, warnings, and status.

## Backup / migration drill

1. Export the active Final RC snapshot and record project/entity counts, revision hash, citation IDs, evidence IDs, and file hashes.
2. Copy the local project data to an isolated test location, then remove only the test copy.
3. Restore into a fresh project namespace, run migrations, and compare the recorded counts/hashes/links.
4. On any failure, roll back the transaction and preserve the original backup. Mark the run `incomplete` or `rejected`; never show success after partial restore.
5. Reopen the restored project and perform one real read/write workflow before declaring PASS.

The current repository has automated manifest tamper/path tests. A clean-machine SQLite destroy/restore and old-installer upgrade drill remains an environment-dependent manual gate and is reported as pending until executed.
