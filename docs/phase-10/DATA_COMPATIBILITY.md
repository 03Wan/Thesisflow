# Data Compatibility

- Schema migrations 0001–0014 are the current repository baseline; Phase 10 archive manifest uses `phase10-archive-1` and records app version/schema context.
- An archive is an immutable snapshot, not the project source of truth and not a teacher submission package.
- Restore/import must use a new project namespace by default and preserve the input manifest hash and migration version in the recovery report.
- Unknown manifest schema, missing required files, hash mismatch, path traversal, and partial writes are rejected.
- Old executable upgrade compatibility is not claimed until an old RC fixture or installer is available and tested.
